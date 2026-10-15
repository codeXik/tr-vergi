import assert from "node:assert/strict";
import test from "node:test";
import { calculateItoFees, DEFAULT_ITO_2026_TARIFF, formatItoMoney, itoCalculationInputSchema, itoTariffDataSchema, validateItoTariff } from "./ito-tariff";

test("2026 İTO gerçek kişi kuruluş altın senaryosu 10.624,90 TL üretir", () => {
  const result = calculateItoFees({ entityType: "sole_proprietor", operation: "establishment" });
  assert.equal(result.status, "calculated");
  assert.equal(result.totalCents, 1_062_490);
  assert.deepEqual(result.items.map((row) => row.amountCents), [546_610, 70_800, 330_500, 89_580, 25_000]);
  assert.equal(formatItoMoney(result.totalCents!), "10.624,90 TL");
});

test("2026 İTO Limited kuruluş altın senaryosu kuruşu kuruşuna uzlaşır", () => {
  const result = calculateItoFees({ entityType: "limited", operation: "establishment", capitalCents: 500_000_000, wordCount: 1374 });
  assert.equal(result.totalCents, 1_112_252);
  assert.equal(result.items.find((row) => row.id === "ttsg")?.amountCents, 340_752);
  assert.equal(result.items.find((row) => row.id === "competition")?.amountCents, 200_000);
  assert.equal(result.items.some((row) => row.id === "book_certification"), false);
  assert.equal(DEFAULT_ITO_2026_TARIFF.rules.limitedEstablishmentBookCertificationAutoApply, false);
});

test("kesin olmayan İTO kombinasyonu toplam uydurmaz", () => {
  const result = calculateItoFees({ entityType: "joint_stock", operation: "establishment" });
  assert.equal(result.status, "needs_review");
  assert.equal(result.totalCents, null);
  const special = calculateItoFees({ entityType: "limited", operation: "capital_increase" });
  assert.equal(special.status, "needs_review");
  assert.equal(special.totalCents, null);
  assert.equal(special.items[0]?.amountCents, 344_000);
});

test("İTO girişleri ve tarife şeması negatif, taşan ve serbest ifade alanlarını reddeder", () => {
  assert.throws(() => calculateItoFees({ entityType: "limited", operation: "establishment", capitalCents: 500_000_000 }));
  assert.throws(() => itoCalculationInputSchema.parse({ entityType: "limited", operation: "establishment", capitalCents: -1, wordCount: 1 }));
  assert.throws(() => itoTariffDataSchema.parse({ ...DEFAULT_ITO_2026_TARIFF, formula: "process.exit()" }));
  assert.throws(() => itoTariffDataSchema.parse({ ...DEFAULT_ITO_2026_TARIFF, ttsg: { ...DEFAULT_ITO_2026_TARIFF.ttsg, companyPerWord: -1 } }));
  assert.throws(() => itoTariffDataSchema.parse({ ...DEFAULT_ITO_2026_TARIFF, year: 2027 }));
  assert.throws(() => itoTariffDataSchema.parse({ ...DEFAULT_ITO_2026_TARIFF, sources: [DEFAULT_ITO_2026_TARIFF.sources[0], DEFAULT_ITO_2026_TARIFF.sources[0], DEFAULT_ITO_2026_TARIFF.sources[0]] }));
});

test("tarife doğrulaması iki altın hesabı ve koşullu defter kuralını geçer", () => {
  const report = validateItoTariff(DEFAULT_ITO_2026_TARIFF);
  assert.equal(report.passed, true);
  assert.equal(report.checks.length, 4);
  assert.ok(report.checks.every((check) => check.passed));
});

test("yeni yıl tarifesi 2026 tutarlarına kilitlenmeden aynı hesap kurallarını doğrular", () => {
  const tariff2027 = {
    ...structuredClone(DEFAULT_ITO_2026_TARIFF),
    year: 2027,
    versionLabel: "2027.1",
    verifiedAt: "2027-01-15",
    ttsg: { ...DEFAULT_ITO_2026_TARIFF.ttsg, companyEstablishmentPerWord: 300 },
  };
  const report = validateItoTariff(tariff2027);
  assert.equal(report.passed, true);
  assert.match(report.checks[0].id, /2027/);
  assert.match(report.checks[1].id, /2027/);
});
