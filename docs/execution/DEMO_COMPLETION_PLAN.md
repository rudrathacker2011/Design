# YatraSetu Demo Completion Plan

**Status:** Active, user-approved scope  
**Updated:** 2026-09-25

## Goal

Make every documented YatraSetu feature area demonstrable through working inputs, deterministic behavior, and saved/restored demo state, before real-data and production integration (FR-PROF-01–04, FR-DEST-01–05, FR-DEC-01–04, FR-MOB-01–04, FR-SAFE-01–05, FR-TRUST-01–04; see `context/02_functional_requirements.md` and gates in `context/06_mvp_roadmap_kpis.md`).

## Ordered milestones

1. **Demo integrity and coverage:** inventory every route and control; identify placeholder, dead-end, random, or falsely-live behavior; mark every documented feature as functional, simulated, or intentionally staged. Independently verifiable by a route/requirement coverage matrix and explicit demo labels.
2. **Traveller setup and decision loop:** implement validated profile and intent input; preserve it locally; make discovery, destination assessment, suitability, GO/MODIFY/ALTERNATIVE and experience-equivalent alternatives deterministic and dependent on those inputs. Preserve freshness/unknown semantics and never substitute fake live data.
3. **Trip and mobility:** create/edit/save trip and itinerary; make route legs, Smart Arrival, rental request and mechanic flow respond to selected destination, transport preferences, dates and party needs. Clearly identify fixtures/simulated requests.
4. **Resilience and trust:** make safety details, remote-area preparation, offline pack, consent-gated simulated SOS, verification/review eligibility, feedback and rewards usable and stateful. Reject ineligible reviews with explicit reasons; remove random or unverifiable claims.
5. **Operator, admin and presentation path:** make demo dashboards filter/reflect the curated dataset, label metrics as illustrative, add consistent navigation and demo reset, and ensure all documented feature areas can be shown through a scripted journey.
6. **Verification and handoff:** run applicable type/build/lint checks and acceptance walkthroughs; inspect the diff; update traceability, decision log, learnings if needed, and build status. Document real-data/backend/security work as the following phase.

## Files and modules

Expected areas based on current inspection: `src/app/` route groups; `src/components/` feature screens; `src/modules/profile/app-context.tsx`; `src/modules/destination/seed.ts`; frontend services under `src/modules/{decision,mobility,safety,provider,analytics}`; `src/lib/`; `logs/traceability.md`; `docs/execution/YATRSETU_BUILD_STATUS.md`. Exact files will be adjusted to existing ownership as each milestone is implemented.

## Data and API changes

No schema migration or external API dependency is required for demo completion. Introduce/extend typed demo-domain state and service/provider boundaries, backed by browser persistence. Keep backend/API adapters available for a later integration milestone. Any server/API/schema change will be called out before implementation and recorded in `logs/decision-log.md`.

## Verification approach

Walk the Phase 1 acceptance script in `context/06_mvp_roadmap_kpis.md`; verify all FRs in the coverage matrix have a user-visible action and honest resulting state; reload to check persistence; exercise invalid/ineligible inputs and simulation labels; verify offline-pack contents remain readable without network. Run typecheck/build/lint and relevant tests where configured and applicable, then report limitations accurately.

## Out of scope for this milestone

Real weather/maps/transport/crowd feeds, production authentication and authorization, backend/database persistence, actual booking/payment/dispatch, actual government telemetry, production security/privacy hardening, load testing and deployment. Demo interfaces should make these integrable later, but the demo must not imply they already exist.
