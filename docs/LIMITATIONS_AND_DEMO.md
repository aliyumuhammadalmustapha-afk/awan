# Awan — Honest Limitations, Security Model & Demo Script

## 1. Intended Use & Clinical Boundaries
- **Intended Use (Draft — Requires Regulatory Adviser Confirmation)**: Awan helps adults understand how their reproductive health is changing over time and when it may be worth speaking to a professional. It does not diagnose, predict fertility, or recommend treatment.
- **No AI in Decision Logic**: All assessments come from a deterministic, rule-based engine (`T1–T5`, `F1–F6`, `M1–M5`, `X1–X4`, `D1–D6`).
- **Thresholds**: Follow common public guidelines (e.g., ASRM 12 months trying under age 35, 6 months at 35+) and are marked `guideline-derived, not clinician-reviewed`.

## 2. Privacy & Security Model
- **Local-First**: Health data stays on the user's device.
- **Zero-Knowledge Doctor Pass**: Snapshots are encrypted client-side with `AES-GCM-256` (`crypto.subtle`) and a random 256-bit key placed in the URL `#key` fragment (which browsers never transmit to servers).
- **K-Anonymity**: Health-system planner insights suppress any group with `<10` individuals.
- **Honest Limits**: A web-app PIN lock is weaker than native OS biometrics/keychain; demo SMS/OTP (`123456`) is simulated; population insights use synthetic cohort data (`n=1,202`).

## 3. 3-Minute Hackathon Demo Script
1. **Intro (`P1–P5`)**: Show the calm 3-second choreographed welcome ("Know your potential as it changes.") and 4 How It Works cards.
2. **Check-in (`P19–P24`)**: Walk through Layla's check-in, demonstrate `"Why we ask"` and `"Skip"`, add a lab result with its own reference range, review `SourceTag`s (`P23`), and land on the Hero Result Card (`P24`) showing `"Worth a conversation"` (never a score), `"What can change"`, `"What can't change"`, and `"What we don't know yet"` gaps.
3. **Clinician & System Loop (`P29`, `P32`, `P33`)**: Create an encrypted Doctor Pass (`P29`), open the `1024px` Clinician View (`P32`), and finish on the `1024px` Health-System Planner Dashboard (`P33`) showing median days to confirmed contact (`31 days`), `<10` small-group privacy suppression, and `15/15` vignette calibration with `0` false-reassurance under-calls.
