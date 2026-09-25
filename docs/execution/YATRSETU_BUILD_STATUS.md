# YatraSetu Build Status

**Updated:** 2026-09-25  
**Current phase:** Complete feature demo before real-data integration  
**Current task:** Make all documented feature areas and user inputs demonstrable end to end  
**Status:** In progress. Do not describe the overall demo as complete or production-ready.

## Current state

- Root Next.js App Router is the active web application; Express + TypeScript remains the backend for the later real-data phase.
- Traveller profile fields (dates, party size, budget, pace, crowd preference, transport and accessibility) are editable and saved in browser storage.
- Free-text travel intent is editable and saved. Matching cues are simple substring hints, explicitly not an AI interpretation.
- In development, destination assessment follows a deterministic local demo path so it does not depend on the reported Express/API 404. Results are marked as demo scenarios, have low confidence, unknown weather/freshness, and disclose that signals are not verified live.
- Demo alternatives are ranked by transparent keyword-to-experience-tag overlap, then adjusted for the crowd preference and screened using curated open/accessibility fields. The small catalogue and its status values remain illustrative and are not current reality screening.
- A day-by-day editable itinerary can be created for the selected destination. Activity prompts are generic and editable; origin, dates, group size, pace, budget, transport, item time/day/title/notes are captured. Changes increment a draft version and persist in browser storage.
- The mobility, safety/support, trust, and tourism-insight demo components are now wired to their routes instead of leaving those routes as placeholder pages. Mobility reads the saved trip destination/origin/transport and filters demo rentals by party capacity.
- SOS now requires explicit confirmation and consent before creating a local-only demo event. It shows fixture coordinates and says no service/contact was notified.
- Offline demo packs now store the editable itinerary, coordinates, and an optional traveller-entered emergency contact in browser storage. They explicitly contain no map tiles, verified emergency contacts, or live reality signals.
- Mechanic requests require consent and create a local demo reference without contacting a shop. Trust and rental simulations are labeled as examples and do not claim real bookings or verification.
- Production mode still uses the typed API client, same-origin Next proxy and Express endpoint. The reported `/api/v1/decisions/evaluate` 404 remains unresolved for the later real-data/backend phase.
- Application-shell reset clears demo profile, destination, offline pack state, Yatra Points and SOS state from browser storage.
- Trust review fixture tokens are now exact per-stay demo codes; arbitrary non-empty tokens are rejected and successful reviews are described as local demo records, not cryptographic audit entries.
- Trust submissions now prevent duplicate local reviews, disable the saved stay's form, and show the saved review and demo reference after submission.
- A post-trip feedback route now captures outcome, observed crowd, observed weather and notes for the selected destination, persists one local record, and awards demo Yatra Points. Unknown observations remain selectable.
- Login and registration now provide a browser-local demo account flow with input validation and explicit messaging that production authentication is not connected.
- SOS, mechanic and rental demo requests now share a browser-persisted support queue. The operator page can review each record and move it through illustrative Recorded/Acknowledged/Closed states.
- The admin page now shows a transparent local readiness monitor and session counters, with a route-level provider boundary so it builds correctly.
- The trip planner now includes a user-triggered adaptation simulation that adds a new draft suggestion, increments the itinerary version, explains the simulated conflict, and preserves the original items for editing.
- Rental controls now create an explicitly simulated request reference rather than a fake verified voucher or booking confirmation; the request uses the traveller's entered travel dates.
- Tourism metrics and safety factor headings are labeled illustrative rather than live.
- Product and technical scope are recorded in `logs/decision-log.md`; the staged implementation plan is `docs/execution/DEMO_COMPLETION_PLAN.md`.

## Current gaps

- Production auth, authorization, provider verification, and real operator/admin controls remain incomplete; the traveller trip, support, trust, feedback and demo request queue are now interactive and browser-persistent where documented.
- SOS, destination seed observations and several provider/verification labels still need a full honesty and behavior pass.
- Assessment rules remain intentionally partial: the destination-level demo decision uses experience intent, crowd preference and curated access/open scenario; budget, dates, party size, pace and transport are disclosed as unassessed for suitability. The trip planner captures trip needs and can demonstrate a user-controlled simulated adaptation, but does not yet produce destination-specific verified activity recommendations.
- Offline pack content persists locally, but the application shell and route assets are not guaranteed to reload after disabling the network; map tiles are absent. The PRD offline acceptance walkthrough is not yet satisfied.
- Smart Arrival still shows one curated candidate per destination rather than ranking multiple operational candidates.
- Support requests are now persisted in the shared demo state; provider dispatch and real request history remain staged.
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
