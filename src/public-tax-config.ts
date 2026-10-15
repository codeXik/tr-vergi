// Public, year-scoped tariff data. All monetary constants are integer kuruş.
export const TAX_YEAR = 2026;
export const MAX_TAX_AMOUNT_CENTS = 99_999_999_999_999;
export type IncomeKind = "wage" | "non-wage";
export const TAX_SOURCES = {
  income: "https://cdn.gib.gov.tr/api/gibportal-file/file/getFileResources?objectKey=arsiv/yardim-kaynaklar/yararli-bilgiler/gelir-vergisi-tarifeleri/gelir-vergisi-tarifesi-2026.pdf",
  withholding: "https://cdn.gib.gov.tr/api/gibportal-file/file/getFile?objectKey=MEVZUAT_TEBLIGLER/UNIVERSAL/2026/kdv_genteb.pdf",
  threshold: "https://ivdb.gib.gov.tr/yardim-ve-kaynaklar/yararli-bilgiler/fatura-duzenleme-siniri",
  vat: "https://cdn.gib.gov.tr/api/gibportal-file/file/getFileResources?objectKey=arsiv/yardim-kaynaklar/yararli-bilgiler/kdv-oranlari.pdf",
} as const;
export const TAX_CONFIG = {
  2026: {
    verifiedAt: "6 Eylül 2026",
    partialWithholdingThresholdCents: 1_200_000,
    incomeBands: {
      "non-wage": [{ upper: 19_000_000, rate: 15 }, { upper: 40_000_000, rate: 20 }, { upper: 100_000_000, rate: 27 }, { upper: 530_000_000, rate: 35 }, { upper: MAX_TAX_AMOUNT_CENTS, rate: 40 }],
      wage: [{ upper: 19_000_000, rate: 15 }, { upper: 40_000_000, rate: 20 }, { upper: 150_000_000, rate: 27 }, { upper: 530_000_000, rate: 35 }, { upper: MAX_TAX_AMOUNT_CENTS, rate: 40 }],
    },
    vatRates: [1, 10, 20],
    withholdingShares: [2, 3, 4, 5, 7, 9],
    operations: [
      { id: "construction", label: "Yapım ve birlikte verilen proje hizmetleri", share: 4, section: "2.1.3.2.1", note: "Yapım işleriyle birlikte verilen mühendislik, mimarlık ve etüt-proje hizmetleri dahildir. Belirlenmiş alıcılarda ve diğer KDV mükelleflerine yapılan KDV dahil 5 milyon TL ve üzerindeki yapım işlerinde farklı kapsam koşulları vardır; toplam sözleşme ve alt yüklenici ilişkisini kontrol edin." },
      { id: "consulting", label: "Etüt, plan-proje, danışmanlık ve denetim", share: 9, section: "2.1.3.2.2", note: "Bu başlık belirlenmiş alıcılara verilen hizmetleri kapsar. Yapımla birlikte sunulan proje hizmetleri ve avukatların yargı mercileri önündeki vekâlet hizmetleri bu başlıkla karıştırılmamalıdır." },
      { id: "maintenance", label: "Makine, teçhizat, demirbaş ve taşıt bakımı", share: 7, section: "2.1.3.2.3", note: "Belirlenmiş alıcılara verilen tadil, bakım ve onarım hizmetleri içindir. İlk yapım veya tamamen yenileme işlerinde yapım işleri koşullarını ayrıca değerlendirin." },
      { id: "catering", label: "Yemek servis ve organizasyon hizmetleri", share: 5, section: "2.1.3.2.4", note: "Belirlenmiş alıcıların yemek servis ve organizasyon alımları içindir. Yemek çeki satışı ve yalnız malzeme alımı aynı kapsamda değerlendirilmez." },
      { id: "workforce", label: "İşgücü temin hizmetleri", share: 9, section: "2.1.3.2.5", note: "KDV mükellefleri ve belirlenmiş alıcılarda, personelin hizmet alanın sevk, idare ve kontrolü altında çalışması gibi koşullar aranır. Her taşeron hizmeti işgücü temini değildir." },
      { id: "inspection", label: "Yapı denetim hizmetleri", share: 9, section: "2.1.3.2.6", note: "KDV mükellefleri ve belirlenmiş alıcılara verilen yapı denetim hizmetleri içindir. Ödemeyi yapan yerine faturanın adına düzenlendiği alıcının durumunu kontrol edin." },
      { id: "freight", label: "Karayoluyla yük taşımacılığı", share: 2, section: "2.1.3.2.11", note: "KDV mükellefleri ve belirlenmiş alıcıların karayolu yük taşıma alımları içindir. Yetki belgeli kargo işletmeciliği hariçtir; işi devreden ve fiilen taşıyan ayrımı ayrıca incelenmelidir." },
      { id: "shuttle", label: "Servis taşımacılığı", share: 5, section: "2.1.3.2.11", note: "KDV mükellefleri ve belirlenmiş alıcıların servis alımları içindir. Doğrudan personel, öğrenci veya veli adına düzenlenen faturalar aynı kapsamda değildir." },
      { id: "other", label: "Diğer hizmetler (özel alıcı koşullarıyla)", share: 5, section: "2.1.3.2.13", note: "Yalnız bu bölümde sayılan kamu kuruluşları, bankalar, sigorta ve emeklilik kuruluşları gibi alıcılara verilen, Tebliğde başka başlıkta düzenlenmemiş hizmetler içindir. Her alıcıya verilen her hizmeti kapsamaz; SGK'ya faturalanan sağlık hizmeti istisnasını kontrol edin." },
    ],
  },
} as const;
export function getTaxConfig(year: number) {
  if (year !== TAX_YEAR) throw new Error("Bu araç yalnız 2026 hesaplama dönemini destekler.");
  return TAX_CONFIG[year];
}
export const TAX_VERIFIED_AT = TAX_CONFIG[TAX_YEAR].verifiedAt;
