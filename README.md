# Awan — Private, Longitudinal Reproductive Health Guide

Awan is a local-first, person-owned web app that helps adults notice changes in their reproductive potential earlier, understand them in plain language, and act at the right moment—without deterministic fertility scores, AI hallucinations, or anxiety.

## How to Run Locally
```bash
cd apps/web
npm install
npm run dev
```
Open **http://localhost:5173/** in your browser.

### Quick Verification & Demo Routes
- **Onboarding & Lock (`P1–P17`)**: `http://localhost:5173/p1-welcome` and `http://localhost:5173/p17-lock`
- **Home & Check-in Flow (`P18–P25`)**: `http://localhost:5173/home`
- **Longitudinal Trend, Results & Follow-up (`P26, P27, P30`)**: `http://localhost:5173/p26-trend`, `/results`, `/p30-follow-up`
- **Share & Doctor Pass (`P28, P29`)**: `http://localhost:5173/share`
- **Clinician Summary View (`P32`, 1024px)**: `http://localhost:5173/clinician-view`
- **Health-System Planner Dashboard (`P33`, 1024px)**: `http://localhost:5173/dashboard`
- **Account & System States (`P31, P34`)**: `http://localhost:5173/account` and `/p34-system-states`
- **UI Kit & Route Directory**: `http://localhost:5173/ui-kit` and `/routes`

## Quality Checks
- **Tests**: `cd apps/web && npx vitest run` (19 tests across 7 suites including 15 clinical vignettes, 6 Golden Rules, 250 randomized property tests, AES-GCM Doctor Pass crypto, WCAG AA contrast verification, and `<50ms` engine speed).
- **Design Lint**: `node scripts/design-lint.mjs` (verifies single token file, single copy catalog, single UI kit, zero hardcoded hex literals in components).
- **Typecheck & Build**: `cd apps/web && npm run build`
