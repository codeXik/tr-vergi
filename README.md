# tr-vergi

[![test](https://github.com/codeXik/tr-vergi/actions/workflows/test.yml/badge.svg)](https://github.com/codeXik/tr-vergi/actions/workflows/test.yml)

> **Tax year 2026 only.** Income tax brackets and VAT withholding rates were verified against GİB on 6 Sep 2026, ITO fees against the 2026 İTO tariff on 16 Sep 2026. Other years are rejected with an error; rates are updated each January.

Turkish tax calculators in TypeScript, extracted from [Muhasebeci.ai](https://muhasebeci.ai/araclar).

- **Income tax** (gelir vergisi): 2026 brackets for wage and non-wage income, with a per-bracket breakdown.
- **VAT withholding** (KDV tevkifat): inclusive/exclusive amounts, withholding shares, invoice threshold.
- **ITO fees**: Istanbul Chamber of Commerce registry fees from a validated tariff.

Cent-precise integer and BigInt math (no floating-point rounding). Every rate links to its official GİB / İTO source.

```ts
import { parseTaxAmount, calculateIncomeTax } from "tr-vergi";

const result = calculateIncomeTax(parseTaxAmount("850.000"), "wage");
```

```bash
npm install
npm test
```

Results are estimates, not tax advice.

MIT © [Skynon Labs](https://skynonlabs.com) · hello@skynonlabs.com · [Türkçe](README.tr.md)
