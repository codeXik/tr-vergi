# tr-vergi

[Muhasebeci.ai](https://muhasebeci.ai/araclar) içinden ayrılmış TypeScript vergi hesaplayıcıları.

- **Gelir vergisi:** ücret ve ücret dışı gelir için 2026 dilimleri, dilim dilim döküm.
- **KDV tevkifatı:** KDV dahil/hariç tutar, tevkifat oranları, fatura sınırı.
- **İTO harç ve bedelleri:** doğrulanmış tarifeden ticaret sicil ücretleri.

Kuruş hassasiyetinde tam sayı ve BigInt hesap (kayan nokta yuvarlama hatası yok). Her oranın resmi GİB / İTO kaynağı kodda yazılıdır.

```ts
import { parseTaxAmount, calculateIncomeTax } from "tr-vergi";

const sonuc = calculateIncomeTax(parseTaxAmount("850.000"), "wage");
```

Sonuçlar tahminidir, vergi danışmanlığı değildir. Oranların doğrulandığı yıl `src/public-tax-config.ts` içindedir.

MIT © [Skynon Labs](https://skynonlabs.com) · hello@skynonlabs.com · [English](README.md)
