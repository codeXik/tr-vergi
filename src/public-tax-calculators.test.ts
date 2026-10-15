import assert from "node:assert/strict";
import test from "node:test";
import { calculateIncomeTax, calculateVatWithholding, MAX_TAX_AMOUNT_CENTS, parseTaxAmount, formatTaxMoney, formatTaxPercent, resolveWithholdingShare } from "./public-tax-calculators";
import { getTaxConfig, type IncomeKind } from "./public-tax-config";

test("public amounts retain Turkish grouping, precise cents and readable TL output", () => {
  for (const value of ["1.234,56", "1234,56", "1234.56"]) assert.equal(parseTaxAmount(value), 123456);
  assert.equal(parseTaxAmount("1.000"), 100000);
  assert.equal(parseTaxAmount("0,01"), 1);
  assert.equal(formatTaxMoney(10000000), "100.000,00 TL");
  assert.equal(formatTaxPercent(16.5), "%16,50");
  for (const value of ["", "-1", "NaN", "Infinity", "1e8", "1,234", "12.34.56", "1,000.00", "1000000000000", "1 000"]) assert.throws(() => parseTaxAmount(value));
});

test("2026 income examples match both official tariffs and all result metrics", () => {
  const cases: [IncomeKind, number, number, number][] = [
    ["non-wage", 100000, 15000, 15], ["non-wage", 190000, 28500, 15], ["non-wage", 300000, 50500, 20], ["non-wage", 400000, 70500, 20], ["non-wage", 750000, 165000, 27], ["non-wage", 1000000, 232500, 27], ["non-wage", 5300000, 1737500, 35], ["non-wage", 6000000, 2017500, 40],
    ["wage", 100000, 15000, 15], ["wage", 400000, 70500, 20], ["wage", 1500000, 367500, 27], ["wage", 5300000, 1697500, 35], ["wage", 6000000, 1977500, 40],
  ];
  for (const [kind, base, tax, highestRate] of cases) {
    const result = calculateIncomeTax(base * 100, kind);
    assert.equal(result.taxCents, tax * 100);
    assert.equal(result.highestRate, highestRate);
    assert.equal(result.afterTaxCents, (base - tax) * 100);
    assert.equal(result.effectiveRate, tax / base * 100);
    assert.equal(result.bands.reduce((sum, band) => sum + band.baseCents, 0), base * 100);
    assert.equal(result.bands.reduce((sum, band) => sum + band.taxCents, 0), tax * 100);
    assert.ok(result.bands.every((band) => band.baseCents > 0));
  }
  assert.deepEqual(calculateIncomeTax(75000000, "non-wage").bands.map((b) => [b.baseCents, b.taxCents]), [[19000000, 2850000], [21000000, 4200000], [35000000, 9450000]]);
});

test("both income tariffs stay continuous at boundaries and handle zero and half kuruş", () => {
  for (const kind of ["wage", "non-wage"] as const) {
    for (const boundary of [19000000, 40000000, kind === "wage" ? 150000000 : 100000000, 530000000]) {
      const results = [-1, 0, 1, 10, 100].map((delta) => calculateIncomeTax(boundary + delta, kind));
      for (let i = 1; i < results.length; i++) assert.ok(results[i].taxCents >= results[i - 1].taxCents);
      for (const result of results) assert.equal(result.taxCents + result.afterTaxCents, result.baseCents);
    }
    const zero = calculateIncomeTax(0, kind);
    assert.equal(zero.effectiveRate, 0); assert.equal(zero.highestRate, 0); assert.equal(zero.bands.length, 0);
    assert.equal(calculateIncomeTax(10, kind).taxCents, 2);
  }
});

test("income engine rejects unsupported years, absent kind and invalid cents", () => {
  for (const amount of [-1, Infinity, NaN, 0.1, MAX_TAX_AMOUNT_CENTS + 1]) assert.throws(() => calculateIncomeTax(amount, "wage"));
  assert.throws(() => calculateIncomeTax(100, "non-wage", 2025));
  assert.throws(() => calculateIncomeTax(100, "" as IncomeKind));
  assert.ok(Number.isSafeInteger(calculateIncomeTax(MAX_TAX_AMOUNT_CENTS, "wage").taxCents));
});

const valid = { amountCents: 10000000, amountMode: "exclusive" as const, vatRate: 20, operationId: "manual", manualShare: 5 };
test("withholding is calculated on VAT, not the base, for 5/10 and 9/10", () => {
  const half = calculateVatWithholding(valid);
  assert.equal(half.vatCents, 2000000); assert.equal(half.withheldCents, 1000000); assert.equal(half.sellerReceivesCents, 11000000);
  const nine = calculateVatWithholding({ ...valid, manualShare: 9 });
  assert.equal(nine.withheldCents, 1800000); assert.equal(nine.sellerReceivesCents, 10200000);
  assert.notEqual(half.withheldCents, 5000000);
});

test("VAT inclusive reverse calculation preserves gross and applies threshold to all VAT", () => {
  const run = (amountCents: number) => calculateVatWithholding({ ...valid, amountCents, amountMode: "inclusive" });
  assert.equal(run(1200000).withheldCents, 0);
  const over = run(1200100);
  assert.equal(over.baseCents, 1000083); assert.equal(over.vatCents, 200017);
  assert.equal(over.withheldCents, 100009); assert.equal(over.sellerReceivesCents, 1100091);
  assert.equal(run(1200001).applies, true);
  assert.equal(run(12000000).baseCents, 10000000);
  assert.equal(run(12000000).sellerReceivesCents, 11000000);
  assert.equal(calculateVatWithholding({ ...valid, amountCents: 1000000 }).withheldCents, 0);
  assert.equal(calculateVatWithholding({ ...valid, amountCents: 1000001 }).applies, true);
});

test("VAT inclusive and exclusive amounts reconcile for all supported ratios including rounding", () => {
  for (const amountMode of ["inclusive", "exclusive"] as const) for (const vatRate of [1, 10, 20]) for (const manualShare of [2, 3, 4, 5, 7, 9]) for (const amountCents of [0, 1, 1200001, 99999999, MAX_TAX_AMOUNT_CENTS]) {
    const result = calculateVatWithholding({ ...valid, amountCents, amountMode, vatRate, manualShare });
    assert.equal(result.baseCents + result.vatCents, result.grossCents);
    assert.equal(result.withheldCents + result.sellerVatCents, result.vatCents);
    assert.equal(result.withheldCents + result.sellerReceivesCents, result.grossCents);
    assert.ok(result.withheldCents <= result.vatCents);
    if (amountMode === "inclusive") assert.equal(result.grossCents, amountCents);
  }
});

test("verified operations resolve their own rate and cannot silently use a manual override", () => {
  for (const [id, share] of [["construction", 4], ["consulting", 9], ["maintenance", 7], ["catering", 5], ["workforce", 9], ["inspection", 9], ["freight", 2], ["shuttle", 5], ["other", 5]] as const) {
    assert.equal(resolveWithholdingShare(id, 2026, 3), share);
    assert.equal(calculateVatWithholding({ ...valid, operationId: id }).share, share);
  }
  assert.equal(getTaxConfig(2026).partialWithholdingThresholdCents, 1200000);
  assert.throws(() => resolveWithholdingShare("", 2026));
});

test("VAT rejects stale years, unknown operations, invalid modes and rates", () => {
  assert.throws(() => calculateVatWithholding({ ...valid, amountMode: "invalid" as "exclusive" }));
  for (const change of [{ vatRate: 18 }, { manualShare: 10 }, { manualShare: undefined }, { year: 2027 }, { amountCents: -1 }, { amountCents: Infinity }, { amountCents: 0.5 }, { operationId: "unknown" }]) assert.throws(() => calculateVatWithholding({ ...valid, ...change }));
});
