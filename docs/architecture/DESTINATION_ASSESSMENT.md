# Destination assessment slice

## Scope

Assess a destination the traveller has already selected (FR-DEST-05). Ranked discovery and experience-equivalent alternatives are outside this slice. The destination selector is backed by the existing curated demo catalogue; the assessment itself uses the existing geocoding and weather adapters.

## Request path

`src/components/decision/Discover.tsx` → `src/modules/decision/decision.service.ts` → typed `apiClient` → same-origin `/api/v1` proxy → Express `POST /api/v1/decisions/evaluate` → provider/domain service.

The browser submits only when asked. Changing destination or the crowd/accessibility lens invalidates the prior result. Provider failures stay visible; the client never substitutes fixture scoring.

## Evidence and decision rules

- Weather is accepted only when required current fields are present and provider confidence is known.
- Open-Meteo's precipitation probability is used directly; precipitation amount is retained separately in millimeters.
- The provider timestamp is converted from its local timezone using the returned UTC offset. Weather evidence expires after one hour.
- Crowd, opening/operations and accessibility signals are currently unknown. They do not add positive or negative points to the suitability score.
- Suitability is shown as weather-based partial suitability; confidence is a separate evidence-coverage value. Missing material signals prevent a GO result. A known severe-weather threshold produces ALTERNATIVE; otherwise incomplete coverage produces MODIFY.
- The UI displays the resolved provider destination name and data source, timestamp, freshness, limitations, and persistence status.

## Persistence

No schema change is required. A resolved provider destination is upserted using its stable OSM slug. Known weather creates a `DestinationObservation` with source, collection time, one-hour expiry, confidence, `API_PROVIDER` evidence type and destination scope. Recommendations are persisted only for a Supabase identity mapped to a local `User` and only when a numeric suitability score exists. Missing database configuration or write failures are reported as not saved while the assessment response remains available.

## Verification and limits

Decision rules have unit tests for unknown weather, incomplete evidence, severe weather and freshness. Root build/lint are also required. External provider calls and live database persistence require a configured network/database and are not represented as verified by compilation tests. Crowd, operations and accessibility providers remain open work.
