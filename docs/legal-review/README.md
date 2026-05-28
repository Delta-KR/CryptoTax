# Kontaxt 엔진 외부 검증 패키지 — v0.1 (2026-05-28)

> 한국 가상자산 전문 세무사에게 Kontaxt 의 양도소득 계산 엔진을 외부 검증 의뢰하기 위한 자료 묶음입니다.
>
> **검증 목적**: Kontaxt 의 계산 알고리즘이 소득세법 시행령 §88·§92·§64의3 (2025-02-28 개정 + 2027-01-01 시행) 에 부합하는지 확인합니다. 신고대행이 아닌 알고리즘 검증입니다.

---

## 패키지 구성

| 영역 | 파일 | 상태 |
|------|------|------|
| 서비스 한 페이지 개요 | [`OVERVIEW.md`](OVERVIEW.md) | ✅ 작성 완료 |
| 법령 적용 정책 | [../tax-law-compliance.md](../tax-law-compliance.md) | ✅ v1.0 (2026-05-22) |
| 법령 원문 PDF | [../../law/](../../law/) | ✅ 시행령 §88·§92·§183 + 과세개요 |
| 검증 시나리오 | `scenarios/*.md` | ✅ #1~#10 작성 완료 (10건) |
| 검증 의견서 양식 | [`OPINION_FORM.md`](OPINION_FORM.md) | ✅ 작성 완료 |
| NDA 템플릿 | [`NDA.md`](NDA.md) | ✅ 작성 완료 |
| 보수·범위 합의서 | [`ENGAGEMENT.md`](ENGAGEMENT.md) | ✅ 작성 완료 |

---

## 시나리오 인덱스

각 시나리오마다 **최대 4 종 자료** 가 한 묶음입니다 — 문서 (.md) · 정규화 거래내역 (.csv) · Kontaxt 실 출력 PDF 리포트 (.pdf) · 거래소 실 다운로드 형식 (Upbit 거래는 `.upbit.pdf`, Binance 거래는 `.binance.csv`).

### 필수 (#1~#5)

| # | 시나리오 | 문서 | CSV | 결과 PDF | Upbit PDF | 법령 |
|---|---------|------|-----|---------|----------|------|
| 1 | 단일 거래소 단순 매수·매도 | [.md](scenarios/01-basic-buy-sell.md) | [.csv](scenarios/01-basic-buy-sell.csv) | [.pdf](scenarios/01-basic-buy-sell.pdf) | [.upbit.pdf](scenarios/01-basic-buy-sell.upbit.pdf) | §88①·§92②4호 |
| 2 | 의제 코인 매도 (의제율 50%) | [.md](scenarios/02-imputed-expense.md) | [.csv](scenarios/02-imputed-expense.csv) | [.pdf](scenarios/02-imputed-expense.pdf) | [.upbit.pdf](scenarios/02-imputed-expense.upbit.pdf) | §88④⑤ |
| 3 | 시행 전 보유분 의제취득가액 | [.md](scenarios/03-deemed-cost.md) | [.csv](scenarios/03-deemed-cost.csv) | [.pdf](scenarios/03-deemed-cost.pdf) | [.upbit.pdf](scenarios/03-deemed-cost.upbit.pdf) | §88② |
| 4 | 해외 거래소 USD 일별 환율 | [.md](scenarios/04-fx-conversion.md) | [.csv](scenarios/04-fx-conversion.csv) | [.pdf](scenarios/04-fx-conversion.pdf) | [.binance.csv](scenarios/04-fx-conversion.binance.csv) | §88③2호 |
| 5 | 다년 손익 통산 (carry-over) | [.md](scenarios/05-carry-over.md) | [.csv](scenarios/05-carry-over.csv) | [.pdf](scenarios/05-carry-over.pdf) | [.upbit.pdf](scenarios/05-carry-over.upbit.pdf) | §64의3② |

### 추가 (#6~#10) — 엣지·복합 케이스

| # | 시나리오 | 문서 | CSV | 결과 PDF | Upbit PDF | 법령 |
|---|---------|------|-----|---------|----------|------|
| 6 | 다거래소 + orphan 매도 | [.md](scenarios/06-multi-exchange-orphan.md) | [.csv](scenarios/06-multi-exchange-orphan.csv) | [.pdf](scenarios/06-multi-exchange-orphan.pdf) | [.upbit.pdf](scenarios/06-multi-exchange-orphan.upbit.pdf) (Upbit 부분만) | §88① |
| 7 | KST 경계 거래 | [.md](scenarios/07-kst-boundary.md) | [.csv](scenarios/07-kst-boundary.csv) | [.pdf](scenarios/07-kst-boundary.pdf) | [.upbit.pdf](scenarios/07-kst-boundary.upbit.pdf) | §88②③ + 부칙 |
| 8 | 동일 timestamp 합산 | [.md](scenarios/08-same-timestamp.md) | [.csv](scenarios/08-same-timestamp.csv) | [.pdf](scenarios/08-same-timestamp.pdf) | [.upbit.pdf](scenarios/08-same-timestamp.upbit.pdf) | §88① |
| 9 | 거래소 간 이동 (transfer) | [.md](scenarios/09-cross-exchange-transfer.md) | [.csv](scenarios/09-cross-exchange-transfer.csv) | [.pdf](scenarios/09-cross-exchange-transfer.pdf) | [.upbit.pdf](scenarios/09-cross-exchange-transfer.upbit.pdf) (Upbit 부분만) | §88 |
| 10 | 의제 + 실가 + 의제취득가액 mix | [.md](scenarios/10-mixed-treatment.md) | [.csv](scenarios/10-mixed-treatment.csv) | [.pdf](scenarios/10-mixed-treatment.pdf) | [.upbit.pdf](scenarios/10-mixed-treatment.upbit.pdf) | §88①②④⑤ |

> CSV·PDF 는 [`scripts/generate-legal-review-artifacts.ts`](../../scripts/generate-legal-review-artifacts.ts) 가 시나리오 데이터 (vitest 와 동일) 를 실 Kontaxt 엔진에 입력하여 자동 생성합니다. 재생성: `npm run legal-review:generate`.
>
> **거래소 파일 형식 안내**: 시나리오의 .csv 는 Kontaxt 의 내부 정규화 형식 (UnifiedTransaction) 을 사람이 읽기 쉽게 변환한 것으로, 실제 거래소 다운로드 형식과 다릅니다. 실제 형식 — Upbit: PDF (브라우저 인쇄), Binance: CSV, Bithumb: XLS (파서 Phase 8 구현 예정). 본 패키지의 CSV 는 **세무사가 산식을 검증** 하는 용도이며, 거래소 원본 형식으로 직접 업로드하는 시스템 검증은 별도 단계입니다.

---

## 검증 요청 범위

**알고리즘 정합성 검증** (✅ 의뢰 범위):
- 거주자 총평균법 산식이 시행령 §88① + §92②4호 정의에 부합하는가
- 의제취득가액·의제필요경비 적용이 §88②④⑤ 에 부합하는가
- 환율 변환 시점이 §88③2호 "교환거래일 현재" 정의에 부합하는가
- 기본공제·산출세액·지방세 계산이 §64의3② + 지방세법 §93 에 부합하는가

**개별 신고대행** (❌ 의뢰 범위 밖):
- 특정 사용자의 실제 신고서 작성·제출
- 사용자별 세무 상담·자문

---

## 변경 이력

- **2026-05-28** — 신설 + 시나리오 10건 + 부속 문서 4종 일괄 완성. 패키지 1세트 발송 가능 상태. 다음 단계 = CSV 별도 첨부 + 시나리오 실 엔진 PDF 리포트 출력 + 세무사 후보 컨택.
- **2026-05-28 (self-check 발견)** — vitest 회귀 12 케이스 추가로 시나리오 #2·#10 의 의제 50% 매도 수수료 해석 + 시나리오 #5 의 결손금 carry 엔진 외부 사실 사전 발견. 외부 의뢰 1회로 종결 가능.
