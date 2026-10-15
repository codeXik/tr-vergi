import { z } from "zod";

export const ITO_TOOL_ID = "ito-harc";
export const ITO_TARIFF_YEAR = 2026;
export const ITO_SOURCE_URLS = [
  "https://www.ito.org.tr/tr/hizmetler/ticaret-sicili-islemleri/sicil-islem-bedelleri",
  "https://ito.org.tr/documents/Ticaret-Sicil/onemli_bilgiler_ve_duyurular/harc.pdf",
  "https://www.ito.org.tr/tr/hizmetler/aidat-islemleri",
] as const;

export const itoEntityTypes = [
  "sole_proprietor",
  "limited",
  "joint_stock",
  "cooperative",
  "collective",
  "commandite",
] as const;
export const itoOperations = [
  "establishment",
  "branch_opening",
  "change",
  "representative",
  "deletion",
  "incoming_headquarters_transfer",
  "capital_increase",
  "share_transfer",
  "type_change",
  "merger",
  "demerger",
] as const;

export type ItoEntityType = (typeof itoEntityTypes)[number];
export type ItoOperation = (typeof itoOperations)[number];
export type ItoCalculationStatus = "calculated" | "unsupported" | "needs_review";

const nonNegativeMoney = z.number().int().min(0).max(99_999_999_999_999);
const positiveMoney = z.number().int().positive().max(99_999_999_999_999);

export const itoTariffDataSchema = z.object({
  year: z.number().int().min(2026).max(2100),
  versionLabel: z.string().trim().min(1).max(32),
  verifiedAt: z.string().date(),
  registrationFees: z.record(z.enum(itoEntityTypes), z.object({
    establishment: nonNegativeMoney.nullable(),
    branch_opening: positiveMoney,
    change: positiveMoney,
    representative: positiveMoney,
    deletion: positiveMoney,
    incoming_headquarters_transfer: positiveMoney,
  }).strict()),
  ttsg: z.object({
    companyPerWord: positiveMoney,
    companyEstablishmentPerWord: positiveMoney,
    cooperativePerWord: positiveMoney,
    cooperativeEstablishmentPerWord: positiveMoney,
    soleEstablishmentFixed: positiveMoney,
    technopreneurEstablishment: positiveMoney,
    announcementExpense: positiveMoney,
  }).strict(),
  documentFees: z.object({
    registryCertificate: positiveMoney,
    documentCopy: positiveMoney,
    statusCertificate: positiveMoney,
    insolvencyCertificate: positiveMoney,
    headquartersTransferCertificate: positiveMoney,
    otherAuthorityCertificate: positiveMoney,
  }).strict(),
  serviceFees: z.object({
    merger: positiveMoney,
    demerger: positiveMoney,
    shareTransfer: positiveMoney,
    capitalIncrease: positiveMoney,
    typeChange: positiveMoney,
    representationDirective: positiveMoney,
    generalAssemblyDirective: positiveMoney,
    establishmentApproval: positiveMoney,
    bookCertification: positiveMoney,
    unregisteredAssemblyDecision: positiveMoney,
    signatureDeclaration: positiveMoney,
  }).strict(),
  chamberRegistration: z.object({
    newCompany: positiveMoney,
    extraordinary: positiveMoney,
    degree1: positiveMoney,
    degree2: positiveMoney,
    degree3: positiveMoney,
    degree4: positiveMoney,
  }).strict(),
  competitionShare: z.object({ numerator: z.number().int().positive(), denominator: z.number().int().positive() }).strict(),
  rules: z.object({
    limitedEstablishmentBookCertificationAutoApply: z.literal(false),
  }).strict(),
  sources: z.array(z.object({ label: z.string().min(1).max(120), url: z.enum(ITO_SOURCE_URLS) }).strict()).length(ITO_SOURCE_URLS.length),
}).strict().superRefine((tariff, context) => {
  if (!tariff.versionLabel.startsWith(`${tariff.year}.`)) context.addIssue({ code: "custom", path: ["versionLabel"], message: "Sürüm etiketi tarife yılıyla başlamalıdır." });
  if (tariff.competitionShare.numerator >= tariff.competitionShare.denominator) context.addIssue({ code: "custom", path: ["competitionShare"], message: "Rekabet Kurumu payı birden küçük bir oran olmalıdır." });
  const sourceUrls = new Set(tariff.sources.map((source) => source.url));
  for (const sourceUrl of ITO_SOURCE_URLS) if (!sourceUrls.has(sourceUrl)) context.addIssue({ code: "custom", path: ["sources"], message: "Tüm resmî İTO kaynakları tarifeye bağlı olmalıdır." });
});

export type ItoTariffData = z.infer<typeof itoTariffDataSchema>;

const companyFees = {
  establishment: null,
  branch_opening: 3_535_450,
  change: 859_880,
  representative: 859_880,
  deletion: 270_750,
  incoming_headquarters_transfer: 3_535_450,
} as const;

export const DEFAULT_ITO_2026_TARIFF: ItoTariffData = {
  year: 2026,
  versionLabel: "2026.1",
  verifiedAt: "2026-09-16",
  registrationFees: {
    sole_proprietor: { establishment: 546_610, branch_opening: 546_610, change: 270_750, representative: 270_750, deletion: 105_300, incoming_headquarters_transfer: 546_610 },
    limited: companyFees,
    joint_stock: companyFees,
    cooperative: { establishment: null, branch_opening: 546_610, change: 270_750, representative: 270_750, deletion: 105_300, incoming_headquarters_transfer: 546_610 },
    collective: { establishment: 1_568_840, branch_opening: 1_568_840, change: 388_160, representative: 388_160, deletion: 152_620, incoming_headquarters_transfer: 1_568_840 },
    commandite: { establishment: 1_568_840, branch_opening: 1_568_840, change: 388_160, representative: 388_160, deletion: 152_620, incoming_headquarters_transfer: 1_568_840 },
  },
  ttsg: {
    companyPerWord: 553,
    companyEstablishmentPerWord: 248,
    cooperativePerWord: 285,
    cooperativeEstablishmentPerWord: 178,
    soleEstablishmentFixed: 70_800,
    technopreneurEstablishment: 1,
    announcementExpense: 25_000,
  },
  documentFees: {
    registryCertificate: 89_580,
    documentCopy: 26_630,
    statusCertificate: 89_580,
    insolvencyCertificate: 89_580,
    headquartersTransferCertificate: 89_580,
    otherAuthorityCertificate: 89_580,
  },
  serviceFees: {
    merger: 344_000,
    demerger: 344_000,
    shareTransfer: 344_000,
    capitalIncrease: 344_000,
    typeChange: 344_000,
    representationDirective: 301_000,
    generalAssemblyDirective: 216_000,
    establishmentApproval: 216_000,
    bookCertification: 276_000,
    unregisteredAssemblyDecision: 216_000,
    signatureDeclaration: 172_000,
  },
  chamberRegistration: {
    newCompany: 330_500,
    extraordinary: 460_000,
    degree1: 430_000,
    degree2: 350_000,
    degree3: 340_000,
    degree4: 330_500,
  },
  competitionShare: { numerator: 4, denominator: 10_000 },
  rules: { limitedEstablishmentBookCertificationAutoApply: false },
  sources: [
    { label: "İTO Sicil İşlem Bedelleri", url: ITO_SOURCE_URLS[0] },
    { label: "2026 İTO tarife PDF'i", url: ITO_SOURCE_URLS[1] },
    { label: "İTO Aidat İşlemleri", url: ITO_SOURCE_URLS[2] },
  ],
};

export const itoCalculationInputSchema = z.object({
  entityType: z.enum(itoEntityTypes),
  operation: z.enum(itoOperations),
  capitalCents: z.number().int().positive().max(99_999_999_999_999).optional(),
  wordCount: z.number().int().min(0).max(100_000).optional(),
}).strict();
export type ItoCalculationInput = z.infer<typeof itoCalculationInputSchema>;

export type ItoCalculationItem = {
  id: string;
  label: string;
  amountCents: number;
  sourceRuleId: string;
  status: "applied" | "excluded" | "conditional";
};

export type ItoCalculationResult = {
  year: number;
  entityType: ItoEntityType;
  operation: ItoOperation;
  status: ItoCalculationStatus;
  items: ItoCalculationItem[];
  totalCents: number | null;
  message?: string;
};

function roundedRatio(value: number, numerator: number, denominator: number) {
  return Number((BigInt(value) * BigInt(numerator) * BigInt(2) + BigInt(denominator)) / (BigInt(denominator) * BigInt(2)));
}

function item(id: string, label: string, amountCents: number, sourceRuleId: string, status: ItoCalculationItem["status"] = "applied"): ItoCalculationItem {
  return { id, label, amountCents, sourceRuleId, status };
}

export function calculateItoFees(rawInput: ItoCalculationInput, rawTariff: ItoTariffData = DEFAULT_ITO_2026_TARIFF): ItoCalculationResult {
  const input = itoCalculationInputSchema.parse(rawInput);
  const tariff = itoTariffDataSchema.parse(rawTariff);
  const base = { year: tariff.year, entityType: input.entityType, operation: input.operation };

  if (input.operation !== "establishment") {
    const specialFeeKey: Partial<Record<ItoOperation, keyof ItoTariffData["serviceFees"]>> = {
      capital_increase: "capitalIncrease", share_transfer: "shareTransfer", type_change: "typeChange", merger: "merger", demerger: "demerger",
    };
    const key = specialFeeKey[input.operation];
    const knownItems = key ? [item(`service_${key}`, "İTO hizmet bedeli", tariff.serviceFees[key], `serviceFees.${key}`)] : [];
    return { ...base, status: "needs_review", items: knownItems, totalCents: null, message: "Bu işlemde kesin toplam, işlem belgeleri ve güncel İTO tahakkuku incelendikten sonra belirlenir." };
  }

  if (input.entityType === "sole_proprietor") {
    const items = [
      item("registration", "Kuruluş harcı", tariff.registrationFees.sole_proprietor.establishment ?? 0, "registrationFees.sole_proprietor.establishment"),
      item("ttsg", "TTSG maktu ilan ücreti", tariff.ttsg.soleEstablishmentFixed, "ttsg.soleEstablishmentFixed"),
      item("chamber", "Oda kayıt ücreti", tariff.chamberRegistration.newCompany, "chamberRegistration.newCompany"),
      item("certificate", "Ticaret Sicil Tasdiknamesi", tariff.documentFees.registryCertificate, "documentFees.registryCertificate"),
      item("announcement", "İlan gideri", tariff.ttsg.announcementExpense, "ttsg.announcementExpense"),
    ];
    return { ...base, status: "calculated", items, totalCents: items.reduce((sum, row) => sum + row.amountCents, 0) };
  }

  if (input.entityType === "limited") {
    if (!input.capitalCents || input.wordCount === undefined) throw new Error("Limited şirket kuruluşu için sermaye ve ilan kelime sayısını girin.");
    const items = [
      item("ttsg", "TTSG kuruluş ilanı", input.wordCount * tariff.ttsg.companyEstablishmentPerWord, "ttsg.companyEstablishmentPerWord"),
      item("approval", "Kuruluş tasdik ücreti", tariff.serviceFees.establishmentApproval, "serviceFees.establishmentApproval"),
      item("chamber", "Oda kayıt ücreti", tariff.chamberRegistration.newCompany, "chamberRegistration.newCompany"),
      item("competition", "Rekabet Kurumu payı", roundedRatio(input.capitalCents, tariff.competitionShare.numerator, tariff.competitionShare.denominator), "competitionShare"),
      item("announcement", "İlan gideri", tariff.ttsg.announcementExpense, "ttsg.announcementExpense"),
    ];
    return { ...base, status: "calculated", items, totalCents: items.reduce((sum, row) => sum + row.amountCents, 0) };
  }

  return { ...base, status: "needs_review", items: [], totalCents: null, message: "Bu şirket türünün kuruluş toplamı için İTO tahakkuk ayrıntılarının manuel olarak doğrulanması gerekir." };
}

export function formatItoMoney(cents: number) {
  return `${new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100)} TL`;
}

export function validateItoTariff(tariff: ItoTariffData) {
  const parsed = itoTariffDataSchema.parse(tariff);
  const sole = calculateItoFees({ entityType: "sole_proprietor", operation: "establishment" }, parsed);
  const limited = calculateItoFees({ entityType: "limited", operation: "establishment", capitalCents: 500_000_000, wordCount: 1374 }, parsed);
  const expectedSole = (parsed.registrationFees.sole_proprietor.establishment ?? 0) + parsed.ttsg.soleEstablishmentFixed + parsed.chamberRegistration.newCompany + parsed.documentFees.registryCertificate + parsed.ttsg.announcementExpense;
  const expectedLimited = 1374 * parsed.ttsg.companyEstablishmentPerWord + parsed.serviceFees.establishmentApproval + parsed.chamberRegistration.newCompany + roundedRatio(500_000_000, parsed.competitionShare.numerator, parsed.competitionShare.denominator) + parsed.ttsg.announcementExpense;
  const checks = [
    { id: `GOLDEN-ITO-${parsed.year}-SOLE-ESTABLISHMENT`, expectedCents: parsed.year === 2026 ? 1_062_490 : expectedSole, actualCents: sole.totalCents, passed: sole.totalCents === (parsed.year === 2026 ? 1_062_490 : expectedSole) },
    { id: `GOLDEN-ITO-${parsed.year}-LTD-ESTABLISHMENT`, expectedCents: parsed.year === 2026 ? 1_112_252 : expectedLimited, actualCents: limited.totalCents, passed: limited.totalCents === (parsed.year === 2026 ? 1_112_252 : expectedLimited) },
    { id: "LIMITED-BOOK-CERTIFICATION-NOT-AUTO-APPLIED", expectedCents: 0, actualCents: limited.items.some((row) => row.id === "book_certification") ? parsed.serviceFees.bookCertification : 0, passed: !limited.items.some((row) => row.id === "book_certification") },
    { id: "TARIFF-VERIFIED-IN-TARIFF-YEAR", expectedCents: parsed.year, actualCents: Number(parsed.verifiedAt.slice(0, 4)), passed: parsed.verifiedAt.startsWith(`${parsed.year}-`) },
  ];
  return { passed: checks.every((check) => check.passed), checks, testedAt: new Date().toISOString() };
}
