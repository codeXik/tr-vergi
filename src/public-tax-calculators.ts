// Public estimates only; never writes to accounting or tax declaration records.
import { getTaxConfig, MAX_TAX_AMOUNT_CENTS, TAX_YEAR, type IncomeKind } from "./public-tax-config";
export { MAX_TAX_AMOUNT_CENTS, TAX_YEAR, TAX_SOURCES, TAX_VERIFIED_AT } from "./public-tax-config";

export function parseTaxAmount(value: string): number {
  let normalized = value.trim();
  if (normalized.length > 24) throw new Error("Tutar çok büyük.");
  if (/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(normalized)) normalized = normalized.replaceAll(".", "");
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(normalized)) throw new Error("Sıfır veya pozitif bir tutar girin. Kuruş için en fazla iki basamak kullanın.");
  const [whole, fraction = ""] = normalized.replace(",", ".").split(".");
  const cents = BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
  if (cents > BigInt(MAX_TAX_AMOUNT_CENTS)) throw new Error("Tutar 999.999.999.999,99 TL sınırını aşamaz.");
  return Number(cents);
}
function assertAmount(cents: number) {
  if (!Number.isSafeInteger(cents) || cents < 0 || cents > MAX_TAX_AMOUNT_CENTS) throw new Error("Geçersiz tutar.");
}
function roundedRatio(cents: number, numerator: number, denominator: number) {
  return Number((BigInt(cents) * BigInt(numerator) * BigInt(2) + BigInt(denominator)) / (BigInt(denominator) * BigInt(2)));
}
export function calculateIncomeTax(baseCents: number, incomeKind: IncomeKind, year = TAX_YEAR) {
  const config = getTaxConfig(year);
  assertAmount(baseCents);
  if (incomeKind !== "wage" && incomeKind !== "non-wage") throw new Error("Ücret veya ücret dışı gelir türünü seçin.");
  let lower = 0;
  const bands = config.incomeBands[incomeKind].flatMap(({ upper, rate }, index) => {
    const taxable = Math.max(0, Math.min(baseCents, upper) - lower);
    const band = { index: index + 1, lowerCents: lower, upperCents: upper, rate, baseCents: taxable, taxCents: roundedRatio(taxable, rate, 100) };
    lower = upper;
    return taxable ? [band] : [];
  });
  const taxCents = bands.reduce((total, band) => total + band.taxCents, 0);
  return { year, incomeKind, baseCents, taxCents, afterTaxCents: baseCents - taxCents, effectiveRate: baseCents ? taxCents / baseCents * 100 : 0, highestRate: bands.at(-1)?.rate ?? 0, bands };
}
export function resolveWithholdingShare(operationId: string, year: number, manualShare?: number) {
  const config = getTaxConfig(year);
  if (operationId === "manual") {
    if (manualShare === undefined || !(config.withholdingShares as readonly number[]).includes(manualShare)) throw new Error("Geçerli bir tevkifat oranı seçin.");
    return manualShare;
  }
  const operation = config.operations.find((item) => item.id === operationId);
  if (!operation) throw new Error("İşlem türünü seçin.");
  return operation.share;
}
export type VatAmountMode = "exclusive" | "inclusive";
export function calculateVatWithholding(input: { amountCents: number; amountMode: VatAmountMode; vatRate: number; operationId: string; manualShare?: number; year?: number }) {
  const year = input.year ?? TAX_YEAR;
  const config = getTaxConfig(year);
  assertAmount(input.amountCents);
  const share = resolveWithholdingShare(input.operationId, year, input.manualShare);
  if (!(config.vatRates as readonly number[]).includes(input.vatRate)) throw new Error("Desteklenen KDV oranlarından birini seçin.");
  if (input.amountMode !== "exclusive" && input.amountMode !== "inclusive") throw new Error("KDV dahil veya hariç tutar yöntemini seçin.");
  const baseCents = input.amountMode === "inclusive" ? roundedRatio(input.amountCents, 100, 100 + input.vatRate) : input.amountCents;
  // Preserve the entered gross amount; allocate its rounding remainder to VAT.
  const vatCents = input.amountMode === "inclusive" ? input.amountCents - baseCents : roundedRatio(baseCents, input.vatRate, 100);
  const grossCents = baseCents + vatCents;
  const applies = grossCents > config.partialWithholdingThresholdCents;
  const withheldCents = applies ? roundedRatio(vatCents, share, 10) : 0;
  return { year, share, vatRate: input.vatRate, baseCents, vatCents, grossCents, withheldCents, sellerVatCents: vatCents - withheldCents, sellerReceivesCents: grossCents - withheldCents, applies, thresholdCents: config.partialWithholdingThresholdCents };
}
export function formatTaxAmount(cents: number) {
  return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100);
}
export function formatTaxMoney(cents: number) { return `${formatTaxAmount(cents)} TL`; }
export function formatTaxPercent(rate: number) {
  return `%${new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(rate)}`;
}
