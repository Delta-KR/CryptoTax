import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Upbit KRW 마켓 일별 종가를 daily_rates 테이블에 적재.
// 호출: POST /functions/v1/fetch-daily-rates
// Body: { startDate?: 'YYYY-MM-DD', coins?: string[] }
// startDate 기본값: 30일 전. coins 기본값: BTC,ETH,USDT,SOL,XRP
//
// 주의: verify_jwt=false. v2에서 추가 예정:
//   - body 시크릿 인증 (env: FETCH_RATES_SECRET)
//   - rate limit (Upstash Redis 등)
//   - cron 자동화

const UPBIT_API = "https://api.upbit.com/v1/candles/days";
const DEFAULT_COINS = ["BTC", "ETH", "USDT", "SOL", "XRP"];
const MAX_PAGES = 50;
const CANDLES_PER_PAGE = 200;
const PAGE_DELAY_MS = 300; // Upbit 공용 API: 10 req/sec
const COIN_DELAY_MS = 1500;

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

  const coins = Array.isArray(body.coins) && body.coins.length > 0
    ? body.coins.filter((c) =>
      typeof c === "string" && /^[A-Z0-9]{1,16}$/.test(c)
    )
    : DEFAULT_COINS;
  const startDate = typeof body.startDate === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(body.startDate)
    ? body.startDate
    : new Date(Date.now() - 30 * 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);

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
