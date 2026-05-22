import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Upbit KRW 마켓 일별 종가를 daily_rates 테이블에 적재.
// 호출: POST /functions/v1/fetch-daily-rates
// Body: { startDate?: 'YYYY-MM-DD', coins?: string[] }
// startDate 기본값: 30일 전. coins 기본값: BTC,ETH,USDT,SOL,XRP
//
// 인증: x-shared-secret 헤더 == FETCH_RATES_SHARED_SECRET (env) 필수.
// verify_jwt=false 이므로 익명 호출이 가능한 점을 shared secret로 보강.
// pg_cron이 호출할 때 cron.schedule 본문에 동일 헤더를 동봉.
//
// 입력 clamp (DoS·data abuse 방어):
//   - coins: 1~50개, 각 코인 정규식 검증
//   - startDate: 2022-01-01 ~ 오늘(UTC) 범위
//
// v2 추가 예정: rate limit (Upstash Redis 등).

const UPBIT_API = "https://api.upbit.com/v1/candles/days";
const DEFAULT_COINS = ["BTC", "ETH", "USDT", "SOL", "XRP"];
const MAX_PAGES = 50;
const CANDLES_PER_PAGE = 200;
const PAGE_DELAY_MS = 300; // Upbit 공용 API: 10 req/sec
const COIN_DELAY_MS = 1500;
const COIN_PATTERN = /^[A-Z0-9]{1,16}$/;
const MAX_COINS = 50;
const MIN_START_DATE = "2022-01-01";

interface UpbitCandle {
  market: string;
  candle_date_time_kst: string;
  trade_price: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchCandles(
  coin: string,
  to: string | undefined,
  count: number,
  retries = 3,
): Promise<UpbitCandle[]> {
  const market = `KRW-${coin}`;
  const params = new URLSearchParams({ market, count: String(count) });
  if (to) {
    params.set("to", `${to}T23:59:59Z`);
  }
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(`${UPBIT_API}?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) return await res.json() as UpbitCandle[];
    if (res.status === 429) {
      // exponential backoff
      await sleep(2000 * (attempt + 1));
      lastErr = new Error(`Upbit ${market} 429 (attempt ${attempt + 1})`);
      continue;
    }
    throw new Error(`Upbit ${market} ${res.status}: ${await res.text()}`);
  }
  throw lastErr ?? new Error(`Upbit ${market} failed after retries`);
}

function kstDateStr(iso: string): string {
  return iso.slice(0, 10);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } },
    );
  }

  // Shared secret 검증. 미설정 시 함수 자체를 거부 (open access 방지).
  const sharedSecret = Deno.env.get("FETCH_RATES_SHARED_SECRET");
  if (!sharedSecret) {
    return new Response(
      JSON.stringify({ error: "server_misconfigured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
  const providedSecret = req.headers.get("x-shared-secret");
  if (providedSecret !== sharedSecret) {
    return new Response(
      JSON.stringify({ error: "unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) {
    return new Response(
      JSON.stringify({ error: "Missing SUPABASE_URL / SERVICE_ROLE_KEY" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRole);

  let body: { startDate?: string; coins?: string[] } = {};
  try {
    body = await req.json();
  } catch {
    // body 없으면 기본값 사용
  }

  // coins clamp: 최대 50개. 입력이 array지만 모두 invalid면 빈 배열로 fall through하지 않도록 거부.
  let coins: string[];
  if (Array.isArray(body.coins) && body.coins.length > 0) {
    if (body.coins.length > MAX_COINS) {
      return new Response(
        JSON.stringify({
          error: "invalid_coins",
          message: `coins는 최대 ${MAX_COINS}개까지 허용됩니다.`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const filtered = body.coins.filter(
      (c): c is string => typeof c === "string" && COIN_PATTERN.test(c),
    );
    if (filtered.length === 0) {
      return new Response(
        JSON.stringify({
          error: "invalid_coins",
          message: "유효한 coin 코드가 없습니다.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    coins = filtered;
  } else {
    coins = DEFAULT_COINS;
  }

  // startDate clamp: 2022-01-01 ~ 오늘 (UTC) 범위.
  const todayUtc = new Date().toISOString().slice(0, 10);
  let startDate: string;
  if (typeof body.startDate === "string") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.startDate)) {
      return new Response(
        JSON.stringify({
          error: "invalid_startDate",
          message: "startDate는 YYYY-MM-DD 형식이어야 합니다.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    if (body.startDate < MIN_START_DATE || body.startDate > todayUtc) {
      return new Response(
        JSON.stringify({
          error: "invalid_startDate",
          message: `startDate는 ${MIN_START_DATE} ~ ${todayUtc} 범위여야 합니다.`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    startDate = body.startDate;
  } else {
    startDate = new Date(Date.now() - 30 * 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);
  }

  let inserted = 0;
  const errors: string[] = [];
  const perCoin: Record<string, number> = {};

  for (let ci = 0; ci < coins.length; ci++) {
    const coin = coins[ci];
    if (ci > 0) await sleep(COIN_DELAY_MS); // 코인간 대기 (rate limit)
    try {
      let to: string | undefined = undefined;
      const candleMap = new Map<string, UpbitCandle>(); // dedup by KST date
      for (let page = 0; page < MAX_PAGES; page++) {
        if (page > 0) await sleep(PAGE_DELAY_MS);
        const candles = await fetchCandles(coin, to, CANDLES_PER_PAGE);
        if (candles.length === 0) break;
        for (const c of candles) {
          candleMap.set(kstDateStr(c.candle_date_time_kst), c);
        }
        const earliestDate = kstDateStr(
          candles[candles.length - 1].candle_date_time_kst,
        );
        if (earliestDate <= startDate) break;
        // 다음 페이지: 가장 이른 날짜의 전날로 조정 (중복 회피)
        const earliestDateObj = new Date(`${earliestDate}T00:00:00Z`);
        earliestDateObj.setUTCDate(earliestDateObj.getUTCDate() - 1);
        to = earliestDateObj.toISOString().slice(0, 10);
      }

      const rows = Array.from(candleMap.values())
        .filter((c) => kstDateStr(c.candle_date_time_kst) >= startDate)
        .map((c) => ({
          date: kstDateStr(c.candle_date_time_kst),
          from_currency: coin,
          to_currency: "KRW",
          rate: c.trade_price,
          source: "Upbit (KRW market daily close)",
        }));

      if (rows.length === 0) {
        perCoin[coin] = 0;
        continue;
      }

      // 첫 단계 dedup으로 배치 내 중복 없음. ON CONFLICT는 기존 행 대상.
      const { error } = await supabase
        .from("daily_rates")
        .upsert(rows, {
          onConflict: "date,from_currency,to_currency",
        });

      if (error) {
        errors.push(`${coin}: ${error.message}`);
        perCoin[coin] = 0;
      } else {
        inserted += rows.length;
        perCoin[coin] = rows.length;
      }
    } catch (e) {
      errors.push(
        `${coin}: ${e instanceof Error ? e.message : String(e)}`,
      );
      perCoin[coin] = 0;
    }
  }

  return new Response(
    JSON.stringify({
      ok: errors.length === 0,
      inserted,
      perCoin,
      errors,
      coins,
      startDate,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
});
