# Acro Commerce: B2B ICP visitor ID + ICP audience (2026-09-18)

Trigger: Jared Seitz (Acro Commerce, workspace a321114e-198f-4f46-9c88-94a7cd3d6676,
pixel runceleste.com, trial ends 2026-09-24) says Cursive identifies the least of his
B2B ICP of any visitor-ID vendor he runs (RB2B > Apollo > Vector > LeadPipe ~ Cursive).
Adam: no calls, no extra tools, no Prospeo. Use Cursive + AudienceLab (scoring, custom
models, audience sync) so his leads are clean, accurate, and keep improving.

## Verified facts (read-only, prod)
- His site loads the dashboard snippet `cdn.meetcursive.com/pixel.js` +
  `cursive('init','1503a8ec-…')`. That host never existed. Last event 2026-09-08 17:48Z.
  Real script `cdn.idpixel.app/v1/idp-analytics-6a90a9444525f8fe67d774c0.min.js` (200).
- Root cause: settings/pixel/page.tsx built the correct snippet (`_installSnippet`,
  unused) and rendered `PixelInstallTabs pixelId=…`, which hardcoded a fake branded
  loader. Since commit 38da02d1 (2026-02-25, "overnight enterprise build").
- field-map read `BUSINESS_EMAILS`; live events send `BUSINESS_EMAIL`. 133/336 of his
  events carried a work email we discarded.
- His identified B2B visitors: 178 people with a company, 124 work emails, 106 LinkedIn,
  33 Director+. By industry, few match his real ICP (B2B manufacturers/distributors
  evaluating commerce platforms): most are IT services, government, finance, education.

## Slices
1. Snippet: dashboard shows the provisioned snippet; `public/pixel.js` + public
   `/api/pixel/script/[pixelId]` (302 to install_url, https cdn.idpixel.app only) so the
   broken snippet already on customer sites starts working once `cdn.meetcursive.com`
   points at the app. Infra: add domain to Vercel project leadme + Namecheap CNAME.
2. Work email: read singular key; backfill his leads from stored raw events.
3. ICP scoring: per-workspace ICP profile; score each lead; ICP-first view.
4. ICP audience: AudienceLab custom model (intent) + ICP filters, delivered into his
   workspace on refresh.

## Invariants
- Every read/write scoped to workspace. Public route exposes only install_url.
- No billing change in this slice (ICP-weighted credits is a later Tier-1 slice).
- No production write without a dry-run first.
