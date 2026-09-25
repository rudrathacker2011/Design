# YatraSetu Recovery Audit

**Audit date:** 2026-09-25  
**Supersedes:** the unverified baseline dated 2026-09-24 previously in this file  
**Scope:** repository, product context, frontend, backend, Prisma schema, providers, security, tests/tooling and deployment evidence.  
**Purpose:** establish a current, evidence-based recovery baseline. This is inspection, not authorization for a rewrite.

## Executive summary

The repository is no longer in the state described by the earlier audit. It has a root npm workspace, a Vite/React SPA, an Express/TypeScript API and a substantial Prisma schema. Several API routes and AI/provider adapters exist. Many domain entities the older audit called missing are already modeled.

The main recovery problem is split-brain behavior and misleading realism. The active SPA routes through web/src/main.tsx to six dashboard modules driven primarily by fixtures and browser state. A newer guided journey and typed API client exist in web/src/pages/Journey.tsx and web/src/lib/apiClient.ts, but that journey is not registered in the active router. The backend exposes seven route groups, but several handlers return fabricated transport, safety, provider, review and tourism telemetry. The decision path calls real geocoding and weather providers, but combines those with guessed seasonal crowd conditions and assumed operating/accessibility scores. The Prisma schema is broad, while API behavior does not safely enforce or persist several claims it makes.

Existing work is salvageable as design material, domain vocabulary, interfaces and provider experiments. It is not yet a trustworthy end-to-end product or production-ready backend. The recovery path is to select the active UI, reconcile architecture decisions and replace fake behavior through small vertical slices.

## Follow-up: root structure activation

After the initial audit, the user selected the requested root structure and authorized migration into it. Root Next.js App Router now runs the public/auth/traveller/trip/support/operator/admin route shells. Selected former Vite UI, services, fixtures and API-client code now live under `src/`; `/api/v1` proxies to the existing Express API. The original `web/` workspace is preserved as legacy reference, and Express remains the backend during the transition. This is structural progress, not completion of the product capabilities described below. The latest build status is tracked in `docs/execution/YATRSETU_BUILD_STATUS.md`.

## Repository and recovery checkpoint

- Root contains web/, backend/, context/, docs/, logs/, skills/, package.json and a lockfile.
- Root Next.js App Router is now the active web runtime. The root npm workspace contains backend; the old Vite app remains preserved in web/ as a legacy reference.
- The requested root-level structure now exists under src/, prisma/, tests/ and docs/. The canonical schema was moved from backend/prisma/schema.prisma to prisma/schema.prisma. Selected existing UI screens, services, fixtures and the API client were migrated into src/. Express remains the backend workspace, with `/api/v1` proxied through Next route handlers. See docs/execution/YATRSETU_BUILD_STATUS.md and docs/architecture/ROOT_APP_MIGRATION.md.
- A prior docs/RECOVERY_AUDIT.md existed; this revision corrects it rather than treating its claims as verified.
- Git status and git log could not be read in this environment: Git returned “not a git repository,” and direct access to .git was denied by the filesystem boundary. Current branch, recent history and uncommitted changes are unverified. No reset, checkout or destructive action was attempted.
- .env files exist under web/ and backend/ and are ignored by .gitignore. Their contents were not opened. .env.example files exist in both apps. No credential values are reproduced here.
- No build, lint, test or database command was run for this audit. Findings are from static inspection; runtime behavior remains unverified unless described as code behavior.

## Current structure and architecture

    root
    ├── src/                     Next.js 16 App Router + migrated UI/domain client code
    ├── prisma/                  canonical Prisma schema and migrations directory
    ├── tests/                   unit/integration/e2e structure
    ├── web/                     preserved legacy Vite application
    └── backend/                 Express 4 + TypeScript + Prisma 6 API workspace

The logged architecture decision names Supabase (PostgreSQL/Auth/Storage/Realtime), Next.js route handlers and Prisma. Root Next.js now owns the web application and `/api/v1` proxy routes; domain API behavior remains in the Express workspace during migration. Prisma uses PostgreSQL and environment-based URLs. Supabase JS is used for JWT lookup and a browser client exists, but integrated Supabase Auth screens and a complete auth-to-database identity lifecycle are not demonstrated.

### Frontend architecture

- web/src/main.tsx is the active entry point. It mounts BrowserRouter, AppProvider, AppShell and routes for Dashboard, Discover, Mobility, Safety, Trust and Gov.
- The active screens use React Context and legacy services/data. Navigation is organized as broad dashboard areas, not the finalized progressive traveller journey.
- web/src/pages/Journey.tsx contains a larger guided workflow and calls apiClient, but the active route table does not register it. web/src/App.tsx is another self-contained guided prototype importing gujarat.ts and local decision code; it is also not mounted by main.tsx.
- web/src/data/seed.ts (about 24.5 KB) and web/src/data/gujarat.ts (about 3 KB) are separate fixture sources. Several active services read seed.ts; the compact prototype reads gujarat.ts. decisionService.ts contains seed-backed behavior and a backend request path. These are competing sources of truth.
- apiClient.ts has a typed response envelope and endpoint methods, but includes any responses, has no demonstrated shared contract generation, and is called by the unmounted Journey page rather than the active routed experience.
- web/src/lib/supabase.ts creates a browser client with fallback placeholder values. No auth UI, route guards or app-level session lifecycle were found in the inspected route tree.
- The current theme and handover describe dark glassmorphism. The new recovery brief asks for a calmer, serious travel product and warns against excessive glassmorphism. Existing visual work is material to evaluate, not a binding design constraint.

### Backend architecture and API inventory

The backend is an Express modular-ish monolith. server.ts adds CORS, JSON parsing, request IDs, /health, a 404 handler and a generic error handler. It mounts these groups:

| Route group | Current implementation observed | Reality / concern |
|---|---|---|
| GET/PUT /api/v1/profile | Supabase requireAuth; Prisma profile read/upsert; Zod validation | Real persistence path, but profile service creates its own Prisma client instead of using shared lib/db.ts. User-row provisioning and error mapping are not demonstrated. |
| POST /api/v1/decisions/evaluate | Optional auth; geocoding + weather adapters; scores; optional recommendation write | Hybrid live/demo logic. Crowd, operations and accessibility are guessed. Recommendation persistence uses external OSM ID as a database destination UUID and suppresses write failures. |
| POST /api/v1/intent/extract, GET /history | Provider extraction; optional/required auth; Prisma | Intent can be persisted, but direct Prisma client is instantiated in router. AI output schema validation and rate limits are not visible. |
| GET /api/v1/mobility/routes, /arrival-points | Request parsing and static route/arrival objects | Fabricated schedules, costs, carbon values and recommendation scores; no transport integration. |
| POST /api/v1/safety/assistance, GET /assessment | Optional auth; validation; attempts event write only when an active trip exists; static assessment | Claims dispatch/ETA/agency without integration. Event write failure is swallowed; isSimulated is false. Anonymous/no-active-trip requests can receive success without a durable event. |
| GET /api/v1/trust/providers, POST /reviews | Prisma provider lookup with hardcoded fallback; review hash response | Empty DB is represented by fabricated verified providers. Review accepts optional auth and client-supplied proof, does not verify eligibility and does not persist review/audit records. |
| GET /api/v1/gov/capacity, /dispersal | Static footfall, policy and incentive payloads | Fabricated real-time-looking telemetry without source or freshness evidence. |

No complete destination/discovery, alternative ranking, trips/itinerary, offline pack, notification, rental inventory, provider-verification or analytics persistence vertical slices were found. Some related schema entities exist without working feature flows.

### Database architecture

prisma/schema.prisma is substantial (about 531 lines). It includes User, TravellerProfile, EmergencyContact, TravellerIntent, Destination, DestinationExperience, DestinationObservation, DestinationAlternative, ArrivalPoint, Recommendation, Trip, Itinerary, ItineraryItem, ItineraryEvent, Provider, VerificationRecord, Vehicle, ServiceRequest, Review, ReviewAudit, AssistanceEvent, OfflinePack, Feedback, YatraPoint and AuditLog. The earlier audit's claim that most of these models were absent is false.

The schema is a useful starting point but does not prove safe or current database deployment. Static concerns:

- No PostGIS geometry or spatial index is evident; latitude/longitude fields have ordinary indexes, not efficient radius-search support.
- Several references are loose strings rather than relations (for example service request user/trip IDs and itinerary parent/current-itinerary semantics). Trip.currentItineraryId is not visibly related to Itinerary.
- Recommendation.destinationId requires a real Destination, while evaluation resolves an external place and passes an OSM identifier or “unknown,” then suppresses write errors.
- Verification status is duplicated between Provider and VerificationRecord; consistent state transitions are not enforced visibly.
- Review has proof/hash fields, but no eligibility record or demonstrated proof validation. A hash column does not itself make a tamper-evident ledger.
- Invariants such as unique itinerary version per trip, one active itinerary, rating bounds, nonnegative prices or one primary emergency contact are not visibly enforced.
- Schema breadth creates migration risk. Use additive slice-driven migrations and verify deployed state before changes; do not treat db push as a production migration strategy.

## A–Z audit inventory

| Area | Finding |
|---|---|
| A. Project structure | Workspace split between SPA and API, with useful product docs/logs. No shared contract package boundary is evident. |
| B. Frontend architecture | Three competing entry/flow implementations; only the six-tab legacy route tree is active. |
| C. Backend architecture | Express modular monolith; seven route groups. Route files contain domain behavior and static payload construction. |
| D. Database architecture | Broad Prisma schema exists; deployed state and migration history are unverified. Relations/invariants and spatial queries need work. |
| E. Authentication | Backend Supabase JWT middleware protects profile/history. Most action endpoints are public or optional-auth. Browser session integration is not evident. RBAC is not enforced in routes; role comes from user metadata. User provisioning/linking is unclear. |
| F. State management | Active SPA uses React Context. Journey keeps local state. Durable session, trip persistence and offline synchronization are incomplete or absent in inspected code. |
| G. API inventory | Listed above. A response envelope and validation helper exist, but error behavior and client contracts are inconsistent/incomplete. |
| H. External integrations | Open-Meteo, OSM Nominatim and optional Gemini exist. Transport, dispatch, notifications, review proof, live crowd and operator feeds do not. Rate/usage policy is inconsistent; Nominatim suitability needs review. |
| I. AI | Gemini and deterministic demo adapters exist. Intent JSON is parsed without runtime schema validation. Decision explanations are given limited factors but grounding is weak. |
| J. UI/UX | Active dashboard and guided prototype differ. Active navigation is not the finalized journey. Loading/error/unknown states vary; accessibility and responsiveness need review. |
| K. Hardcoded data | Gujarat destination fixtures plus backend mobility, safety, provider fallback and government data. |
| L. Mock data | Delayed promises, demo AI, hardcoded network-like status and local UI state. Fixtures are not consistently isolated behind providers. |
| M. Fake “live” behavior | Discover copy refers to live sensors/authority feeds while using fixtures. Backend reports specific ETA, footfall, operating and route claims without sources. Dashboard advertises satellite simulation. |
| N. Duplicate logic | Suitability exists in web/src/lib/decision.ts, web/src/services/decisionService.ts and backend decision service. Destination/profile contracts differ across seed data, API client and Prisma. |
| O. Dead/unclear code | Journey.tsx and App.tsx are not active routes. Some apiClient methods appear to serve Journey only. Determine salvage/retirement after review. Vite/React logos appear to be template leftovers. |
| P. Coupling | Routers instantiate Prisma clients and mix validation, domain logic, persistence and response shaping. Active frontend pages/services bind closely to fixture shapes. |
| Q. Security | Many state-changing flows have optional/no auth. Review can return verified=true from client-supplied proof without authentication or proof lookup. Assistance can claim dispatch without durable event or integration. Provider fallback asserts verification without records. Rate limits, security headers, audit/retention controls are not evident. |
| R. Scalability | No Redis, queue, worker, provider rate limiter or load tests surfaced. Decision requests synchronously call external services. Multiple Prisma clients risk extra pools. 10k concurrency is unvalidated. |
| S. Database risks | Schema is more complete than the earlier audit said. Spatial querying, lifecycle constraints, referential integrity and actual migration state remain unverified. Contact/location/assistance data need access and retention design. |
| T. API risks | Success payloads imply work not performed; error handling hides provider/database distinctions. API envelope and frontend expectations are not consistently aligned. |
| U. Type safety | TypeScript throughout, but any appears in API/persistence paths. AI/external payloads need runtime schemas. Web and backend TypeScript versions differ. |
| V. Testing | No test scripts, test files or test config were found in inspected manifests/tree. Traceability says “Implemented” based on build/lint, which does not establish persistence, eligibility or live correctness. Tests were not run for this audit. |
| W. Deployment | No workflow/container/infra files surfaced in inspected inventory. Workspace scripts support local development, not reproducible deployment. Env templates exist but need consistency review. |
| X. Handover mismatch | web/DESIGN_HANDOVER.md documents an older tree and falsely implies replacing service files with fetch automatically connects the UI. It treats all JSX interpolations as protected data binding and assumes glass theme; the new user direction supersedes that. |
| Y. Product mismatch | PRD/Phase 1 says curated pilot, while 2026-09-24 decision expands to all India/live adapters. Current code remains Gujarat fixture-first with a live weather/geocoding decision path. Nationwide verified coverage does not exist. |
| Z. Classification | See subsystem disposition below. No code deletion is recommended during audit. |

## Subsystem disposition

| Subsystem / assets | Classification | Recommendation |
|---|---|---|
| Root workspace and lockfile | [SALVAGE] | Keep; review scripts and package-version alignment in foundation milestone. |
| Product context and logs | [SALVAGE] | Keep as intent source; reconcile geography, roadmap, provider and design assumptions; correct traceability claims. |
| CSS, page styles and hero asset | [SALVAGE / REFACTOR] | Preserve useful visual assets. Rework hierarchy against new UI direction; glassmorphism is not binding. |
| AppShell and page components | [REFACTOR] | Reuse suitable components after selecting canonical routing and contracts. |
| main.tsx and six-tab route tree | [REFACTOR] | Replace broad destinations with progressive journey routes while preserving useful pieces selectively. |
| Journey.tsx | [INVESTIGATE / SALVAGE] | Review against requirements; useful flow/API work is currently unmounted and concentrated in a large component. |
| App.tsx, gujarat.ts, decision.ts | [INVESTIGATE] | Useful concise demo reference, but duplicates active UI and scoring. Compare before retiring. |
| seed.ts and frontend services | [REFACTOR] | Keep fixtures behind explicit demo providers. Remove random outputs and false-live copy; do not delete useful records blindly. |
| apiClient.ts | [REFACTOR] | Keep central-client concept; align contracts/errors with backend and add auth/session/timeout behavior as needed. |
| Express app and route modules | [REFACTOR] | Keep modular monolith; thin routes, centralize DB client/auth/error/provider boundaries. Resolve Express vs Next decision first. |
| Prisma schema | [SALVAGE / REFACTOR] | Inspect migration/deployed state; evolve additively by slice. Do not wholesale replace. |
| Weather/geocoding adapters | [SALVAGE / INVESTIGATE] | Keep behind interfaces; add evidence/freshness/error semantics and review provider terms, quotas and fallbacks. |
| Gemini/demo AI | [REFACTOR] | Keep interface concept; validate output, constrain prompts and prevent unsupported claims. |
| Mobility/safety/trust/government payload handlers | [REBUILD] | Replace fake success with explicit demo-provider responses or real persisted/provider workflows. Never present simulated dispatch/verification as live. |
| Auth/authorization lifecycle | [REBUILD / REFACTOR] | Implement browser session, DB user mapping, ownership and role checks before sensitive flows. |
| Tests, CI and deployment docs | [REBUILD] | Establish conventions and critical tests with slices; production claims require reproducible verification. |
| Template logos and duplicate prototypes | [INVESTIGATE] | Remove only after reference checks and after Git recovery checkpoint is available. |

## Conflicts and architecture recommendations

1. **All India vs Phase 1 pilot:** latest log expands geography, while MVP context specifies a coherent small journey. Recommendation: support all-India extensibility but show unknown/unsupported coverage unless evidence exists; validate the initial end-to-end flow on a coherent dataset. This is a proposal, not a settled decision.
2. **Live integration vs actual coverage:** Open-Meteo and Nominatim exist; they do not make crowd, operations, transport, safety or provider information live. Keep provenance explicit.
3. **Stack mismatch:** decision log says Next.js route handlers; implementation is Express. Decide whether to amend the log to keep Express or migrate before adding APIs. Do not maintain two API architectures indefinitely.
4. **UI direction:** old handover says glassmorphism; latest user brief asks for calm, serious UX. Latest instruction governs; update handover after the design direction is implemented.
5. **Checkpoint:** branch/history and current diff are unavailable. Restore Git visibility before structural changes.

Recommended target boundaries:

    web/
      src/app/                 route layouts
      src/components/          shared UI
      src/features/            journey domain screens and components
      src/data/                typed fixtures behind demo providers
      src/lib/                  API, auth, errors, validation

    backend/
      src/app/                  bootstrap and middleware
      src/modules/<domain>/     routes, application service, domain logic, repository
      src/providers/            weather, geocoding, maps, transport, AI, notifications
      src/lib/                  shared DB, config, auth, errors, logging
      prisma/                   schema and migration history

    docs/architecture/
    docs/execution/
    tests/

Keep the two-package workspace unless a reviewed plan identifies a concrete reason to consolidate. Boundaries matter more than folder count; do not create empty future modules.

### UI architecture recommendation

Use one application shell with progressive journey navigation and persistent trip context. The traveller path should cover profile/intent, discovery/reality, decision/alternatives, plan/mobility/arrival, preparedness, active trip/adaptation and feedback. Separate operator/admin routes from the traveller default. Standardize responsive navigation, accessible forms, evidence/freshness states, loading/empty/error/offline states and explicit demo labels. No screen should claim data the backend cannot provide.

### Backend architecture recommendation

Keep a modular monolith and choose one API framework. Routes should parse/authenticate, invoke an application service and return typed responses. Keep decision rules deterministic and separately testable. Use one Prisma client. Enforce ownership and role checks server-side. Persist canonical destination IDs; map provider IDs through ingestion/normalization. Every dynamic observation needs source, collected time, expiry, confidence, evidence type and scope. Unknown/provider failure should be explicit. Add Redis, queues, PostGIS or nationwide synchronization only when a validated slice and workload justify them.

## Proposed implementation order

1. **Recovery checkpoint and decision reconciliation:** restore Git status/history access, record branch/diff, settle Express vs Next and clarify All-India coverage semantics.
2. **Foundation and UI shell:** route architecture, reusable primitives, responsive shell, typed contracts and named fixture mode. No unsupported live claims.
3. **Auth + profile + intent:** session, user mapping, protected persistence and validated intent extraction/fallback.
4. **Destination + reality + decision:** canonical destination records, evidence/freshness, deterministic versioned constraints/scoring and honest unknown/stale UI.
5. **Alternatives + plan + mobility/arrival:** experience match with current-condition screening and structured provider states.
6. **Trip + itinerary + adaptation + offline:** persisted versioning, user approval and offline data with sync time.
7. **Safety/SOS + mechanic + trust/reviews:** consent, durable events, real eligibility and verification states.
8. **Hardening:** security/privacy, tests, observability, provider governance, deployment and measured load validation.

This ordering follows the canonical journey; scope acceptance still needs reconciliation.

## Dependencies, credentials and risks

- No API key is needed to complete this audit or establish provider interfaces/fixtures. Code references GEMINI_API_KEY, Supabase URL/anon/service-role keys, database URLs and frontend Supabase/backend URL variables. Normalize names in the integration checklist; never put private values in client builds or docs.
- Open-Meteo and Nominatim are in code. Review terms, attribution, rate limits, reliability and production suitability. Transport, dispatch/notification and map-asset providers remain unresolved.
- Main risks: Git state cannot be checkpointed; fake claims harm trust; auth/user mapping is incomplete; framework migration would be broad; schema changes may affect an existing Supabase database; nationwide scope hides source-coverage gaps; location/contact/SOS data require consent and retention limits.
- This follow-up created the requested root scaffolding and moved the Prisma schema without changing its contents. No feature source, data, assets or credentials were altered.

## First milestone

**Root structure and active web migration:** Next.js now runs from the requested root structure, with selected existing UI code migrated and builds passing. Remaining work is to implement real domain behavior one vertical slice at a time and migrate backend capabilities only behind explicit contracts. Keep `web/` as a legacy reference until its useful work is accounted for; Git inspection remains deferred at the user's direction.
