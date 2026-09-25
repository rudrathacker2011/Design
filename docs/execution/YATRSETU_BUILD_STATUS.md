# YatraSetu Build Status

**Updated:** 2026-09-25  
**Current phase:** Production integration
**Current task:** Replace remaining local fixtures with authenticated, persisted provider-backed workflows
**Status:** In progress. The browser no longer exposes demo-mode authentication or reset controls. Do not deploy until the readiness checks pass.

## Production-only boundary

- Runtime mode is now production-only; the browser cannot create local accounts or local demo sessions.
- The shell no longer exposes the Demo badge, illustrative dispatch label, or reset control.
- Login and registration require configured Supabase Auth.
- The Gemini AI registry no longer falls back to deterministic demo intent extraction; a missing key produces an explicit provider configuration error.
- Backend readiness is available at `GET /health/readiness` and returns `503` until database, Supabase, AI, and maps configuration is present.
- `.env.example` now documents the production provider variables. Secrets must be supplied through deployment configuration, never committed.

This does not yet claim that every domain provider is live. Mobility, safety, trust, feedback, itinerary, and government surfaces still contain local fixture/state paths that must be migrated to authenticated backend endpoints before production deployment.

## Authenticated trip persistence slice

- Added `GET /api/v1/trips`, `POST /api/v1/trips`, and ownership-checked `PUT /api/v1/trips/:tripId`.
- Trip and itinerary writes use Prisma transactions and create immutable itinerary versions; active versions are deactivated before a new version is written.
- Added `Trip.planningPreferences` for persisted party size, pace, budget, and transport choices.
- Replaced the active trip page's browser-only create/edit flow with Supabase-token-backed API loading, creation, editing, and save states.
- Added a Prisma migration at `prisma/migrations/20260925195000_add_trip_planning_preferences/migration.sql`.

The migration must be applied to the deployment database before enabling the trip route in production. No local demo fallback remains on the active trip page.

## Authenticated feedback and assistance slice

- Added `POST /api/v1/feedback`, scoped to the authenticated user, with duplicate protection and transactional `YatraPoint` awarding.
- Replaced the feedback page's browser-only write with the authenticated feedback API.
- Changed SOS assistance from optional-auth simulated responses to authenticated `AssistanceEvent` creation against an owned planned/active trip.
- The safety page now requests device geolocation when permission is available and sends the request to the backend; it falls back to the selected destination coordinates only when location permission is unavailable.

Operator acknowledgement and external emergency dispatch integrations are still separate production integrations; the API now records a real assistance event instead of claiming that a service was contacted.

## Authenticated trust and mobility boundary

- Verified providers now come from active, server-side `Provider` records with `VERIFIED` status; the trust UI no longer uses fixture stays or demo review tokens.
- Review submission requires authentication, a verified provider, and an owned active/completed trip. Reviews and audit hashes are persisted transactionally with 250 Yatra Points.
- Mobility arrival points now come from persisted `ArrivalPoint` rows. Route planning returns `PROVIDER_UNAVAILABLE` instead of generated transport availability until a maps/transport adapter is configured.

## Current state

- Root Next.js App Router is the active web application; Express + TypeScript remains the backend for the later real-data phase.
- Traveller profile fields (dates, party size, budget, pace, crowd preference, transport and accessibility) are editable and saved in browser storage.
- Free-text travel intent is editable and saved. Matching cues are simple substring hints, explicitly not an AI interpretation.
- In development, destination assessment follows a deterministic local demo path so it does not depend on the reported Express/API 404. Results are marked as demo scenarios, have low confidence, unknown weather/freshness, and disclose that signals are not verified live.
- Demo alternatives are ranked by transparent keyword-to-experience-tag overlap, then adjusted for the crowd preference and screened using curated open/accessibility fields. The small catalogue and its status values remain illustrative and are not current reality screening.
- A day-by-day editable itinerary can be created for the selected destination. Activity prompts are generic and editable; origin, dates, group size, pace, budget, transport, item time/day/title/notes are captured. Changes increment a draft version and persist in browser storage.
- The mobility, safety/support, trust, and tourism-insight components are wired to their routes. Arrival points and verified providers are database-backed; route planning reports provider unavailability when maps/transport configuration is missing.
- SOS now requires an authenticated planned or active trip and persists an `AssistanceEvent`; browser geolocation is submitted when permitted, and the UI does not claim emergency dispatch.
- Offline demo packs now store the editable itinerary, coordinates, and an optional traveller-entered emergency contact in browser storage. They explicitly contain no map tiles, verified emergency contacts, or live reality signals.
- Mechanic requests require consent and create a local demo reference without contacting a shop. Trust and rental simulations are labeled as examples and do not claim real bookings or verification.
- Production mode uses the typed API client, same-origin Next proxy and Express endpoint. Missing provider configuration fails explicitly instead of returning generated availability.
- Application-shell reset clears demo profile, destination, offline pack state, Yatra Points and SOS state from browser storage.
- Trust review fixture tokens are now exact per-stay demo codes; arbitrary non-empty tokens are rejected and successful reviews are described as local demo records, not cryptographic audit entries.
- Trust submissions now prevent duplicate local reviews, disable the saved stay's form, and show the saved review and demo reference after submission.
- A post-trip feedback route now captures outcome, observed crowd, observed weather and notes for the selected destination, persists one local record, and awards demo Yatra Points. Unknown observations remain selectable.
- Login and registration require Supabase Auth configuration; browser-local account fallback is removed.
- The operator page now requires an operator/admin role, reads persisted assistance and service requests, and writes controlled status transitions through the backend.
- The admin monitor now reads authenticated PostgreSQL counts, recent destination observations, and provider configuration from `/api/v1/gov/monitor`; it no longer reports browser-session counters.
- Offline packs now require an owned persisted trip and are upserted through `/api/v1/offline/packs` with itinerary, emergency-contact, sync metadata, and explicit no-map-tile/provider-refresh boundaries.
- API hardening now applies global and intent-specific rate limits, audits operator status changes, and uses database-backed government capacity/dispersal observations instead of hard-coded telemetry.
- Mechanic assistance now creates an authenticated persisted `AssistanceEvent`; the active safety route no longer writes mechanic or SOS records only to browser state.
- Readiness now performs a real `SELECT 1` database probe, every request receives an `X-Request-ID` correlation header, and structured request logs include method, path, status, and duration.
- The frontend decision service no longer has a development/demo evaluation fallback; destination decisions must come from the backend decision API.
- The admin page now shows a transparent local readiness monitor and session counters, with a route-level provider boundary so it builds correctly.
- The trip planner now includes a user-triggered adaptation simulation that adds a new draft suggestion, increments the itinerary version, explains the simulated conflict, and preserves the original items for editing.
- Rental controls now create an explicitly simulated request reference rather than a fake verified voucher or booking confirmation; the request uses the traveller's entered travel dates.
- Tourism metrics and safety factor headings are labeled illustrative rather than live.
- Product and technical scope are recorded in `logs/decision-log.md`; the staged implementation plan is `docs/execution/DEMO_COMPLETION_PLAN.md`.

## Current gaps

- Production auth, authorization, provider verification, trip, feedback, assistance, trust, mobility boundaries, and operator request controls are implemented; live provider credentials, deployment, offline persistence, and government/admin telemetry remain incomplete.
- SOS, destination seed observations and several provider/verification labels still need a full honesty and behavior pass.
- Assessment rules remain intentionally partial: the destination-level demo decision uses experience intent, crowd preference and curated access/open scenario; budget, dates, party size, pace and transport are disclosed as unassessed for suitability. The trip planner captures trip needs and can demonstrate a user-controlled simulated adaptation, but does not yet produce destination-specific verified activity recommendations.
- Offline pack content persists locally, but the application shell and route assets are not guaranteed to reload after disabling the network; map tiles are absent. The PRD offline acceptance walkthrough is not yet satisfied.
- Smart Arrival still shows one curated candidate per destination rather than ranking multiple operational candidates.
- Assistance and service requests are persisted in PostgreSQL and visible to authorized operators; external dispatch and provider acknowledgement integrations remain staged.
- Offline packs persist server-side manifests, but map tiles, live routes, verified emergency contacts, and background synchronization still require provider integrations and a service worker/offline cache strategy.
- The in-memory rate limiter is suitable for a single backend instance only; production multi-instance deployments must use the configured Redis boundary before scaling horizontally.
- Provider and deployment secrets remain environment-only and must be configured before readiness can report fully ready.
- Older traceability entries still describe legacy `web/` implementation and must be re-audited against the active root app.

## Verification

- `npm.cmd run build`: passed for Next.js and backend TypeScript after profile, intent, local persistence and demo-assessment changes.
- `npm.cmd run build`: passed for Next.js and backend TypeScript after alternatives and trip-planning changes.
- `npm.cmd run lint`: exited successfully with two `react(only-export-components)` warnings and one `react(set-state-in-effect)` warning in demo-state hydration.
- `npm.cmd test`: passed; 4 existing backend decision/freshness tests. These do not directly test the new frontend demo alternative ranking or trip editor.
- `npm.cmd run build`: passed after wiring mobility, safety, trust, tourism-insight routes and offline pack state.
- Safety/mobility routes were compile-checked, not browser-walked. SOS/offline/mechanic consent behavior has not yet had a manual acceptance walkthrough.
- No live provider call, API proxy/backend integration, database write, or production-mode request was verified in this milestone.
- Production-mode smoke check: `npm.cmd run start -- -p 3100` served the landing, auth, traveller, support, trust, feedback, operator and admin routes with HTTP 200 responses.

## Next milestone

Complete the demo handoff: perform a manual browser walkthrough across registration/login, profile, intent, assessment, trip, mobility, support, trust, feedback, operator and admin; audit remaining seed labels and close route/state regressions. Then begin the separately scoped real-data/backend integration phase.

## Production foundation started

- The active root shell now distinguishes demo and production workspaces and hides demo reset controls outside demo mode.
- Shared UI async-state primitives are available for loading, error and empty states.
- Backend authentication now resolves a verified Supabase identity to a local Prisma `User` record and uses the local `User.role` for authorization.
- Government routes require authenticated tourism-admin or system-admin roles.
- Supabase server configuration no longer uses placeholder keys; production requests fail closed when authentication configuration is missing.
- Profile persistence reuses the shared Prisma client.

This is foundation work, not a claim that production authentication is complete. The browser now supports Supabase email/password, email verification registration, magic links, persisted sessions, and session-expiry redirects when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are configured. Demo credentials remain available only in demo mode.

Live Supabase sign-in and email delivery require project configuration and were not exercised in this environment. The auth UI and backend remain build/test verified.

## Profile and intent persistence started

- Authenticated users now load their saved traveller profile from the backend when a session is available.
- Profile screens can save pace, crowd preference, accessibility, transport preference, and vehicle need through the authenticated API.
- Travel intent can be submitted through the authenticated intent extraction endpoint and reports saving/error state explicitly.
- Demo mode continues to use browser persistence; production mode does not silently treat a failed API write as successful.

## Complete UI adaptation started

- The supplied Wanderlog reference was analyzed at the token, screenshot, layout, component, interaction, and animation levels.
- The active root landing page now uses a light, centered, high-whitespace marketing composition with a compact header, pill actions, product-preview panel, feature grid, and structured footer.
- Root design tokens now expose semantic light-theme surfaces, YatraSetu brand/status roles, a normalized 4px scale, responsive radii/elevation, and local-safe font fallbacks without remote font imports.
- The authenticated shell now uses a responsive top navigation/content-first layout inspired by the reference rather than the previous desktop sidebar.
- Dashboard legacy dark hero variables are scoped locally so the first shell migration does not reduce contrast in existing data-bound content.
- The design handover now identifies the root Next.js tree as the active implementation target.

This is the first complete-adaptation pass, not the final route-by-route visual migration. Remaining pages still need the shared reference templates, detailed responsive work, motion, accessibility validation, and screenshot comparison.
