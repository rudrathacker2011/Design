# YatraSetu — Backend Implementation Specification v1.0

**Project:** YatraSetu

**Product:** Adaptive, Trust-First AI Tourism Intelligence Platform

**Purpose:** Implementation-grade specification for AI coding agents and human developers

**Primary target:** Production-oriented backend capable of scaling horizontally toward ~10,000 concurrent users, while remaining practical for an SIH MVP and pilot rollout.

**Status:** Proposed implementation baseline — review before implementation

---

## 0. How this document must be used

This document is the **engineering execution specification** for YatraSetu's backend. The existing Product Requirements Document (PRD) remains the source of truth for product intent and requirements. This document translates those requirements into an implementation plan, architecture, domain boundaries, database structure, API contracts, caching strategy, background processing, testing, deployment, and agent operating procedure.

The repository also contains project-specific agent governance and context files. The coding agent must read those files before modifying code.

### Required project context order

1. `AGENTS.md`
2. `context/00_index.md`
3. Relevant files from `context/`
4. Relevant workflow skill from `skills/`
5. Existing implementation and repository structure
6. This backend implementation specification
7. Relevant logs in `logs/`
8. `web/DESIGN_HANDOVER.md` when a backend change affects frontend data bindings

### Repository memory / governance files

- `AGENTS.md` — agent operating rules and constraints.
- `logs/decision-log.md` — settled decisions; do not reopen settled decisions without a reason.
- `logs/learnings.md` — failed approaches, bugs and fixes; check before repeating a risky approach.
- `logs/traceability.md` — maps requirements to implementation; update after meaningful feature completion.

### Workflow skills

Use the appropriate workflow before executing a task:

- `skills/discuss-product-decision.md` for unresolved product/UX behavior.
- `skills/discuss-technical-decision.md` for unresolved architecture/engineering choices.
- `skills/plan-implementation.md` before non-trivial implementation.
- `skills/execute-task.md` while modifying code.
- `skills/verify-result.md` after implementation.
- `skills/capture-learning.md` after significant failures, fixes, or newly discovered constraints.

---

# 1. Product engineering baseline

## 1.1 Core product statement

YatraSetu helps travellers:

1. decide where to go,
2. determine whether a destination is suitable for them now,
3. determine how to reach it,
4. adapt when real-world conditions change.

The central backend pipeline is:

```text
Traveller Profile
    ↓
Travel Intent
    ↓
Destination Discovery / Selected Destination
    ↓
Destination Reality
    ↓
Personal Suitability
    ↓
GO / MODIFY / ALTERNATIVE
    ↓
Experience-Equivalent Alternative when required
    ↓
Mobility
    ↓
Smart Arrival Point
    ↓
Trip / Itinerary
    ↓
Remote Area + Safety + Offline Support
    ↓
Adaptive Trip
    ↓
Feedback
    ↓
Learning / Analytics
```

## 1.2 Product pillars

- **Decision Intelligence** — suitability and GO/MODIFY/ALTERNATIVE.
- **Trust Layer** — verification, verified-stay/review logic, evidence, auditability.
- **Mobility & Resilience** — routing, arrival intelligence, rentals, mechanics, offline and SOS.
- **De-congestion & Sustainability** — experience-equivalent alternatives and demand distribution.
- **Local Tourism Ecosystem** — stays, guides, rentals, mechanics, artisans and local experiences.

## 1.3 Backend principle

The backend is not a generic CRUD API. Its most important responsibility is to provide a reliable **decision and adaptation layer** over normalized tourism data.

Do not let feature count dilute this core.

---

# 2. Architecture decisions

## 2.1 Primary architecture choice

Use a **modular monolith** initially.

```text
Next.js / Node.js application
    ├── Authentication
    ├── Profile
    ├── Intent
    ├── Destination
    ├── Reality
    ├── Discovery
    ├── Decision
    ├── Alternatives
    ├── Mobility
    ├── Trip
    ├── Safety
    ├── Offline
    ├── Marketplace
    ├── Trust
    ├── Reviews
    ├── Feedback
    └── Analytics

Shared infrastructure:
    PostgreSQL
    Redis
    Queue
    Object storage
    External provider adapters
    AI provider
```

Do **not** begin with microservices unless a measured bottleneck, organizational boundary, reliability boundary, or provider-isolation requirement justifies extraction.

## 2.2 Horizontal scaling model

The API layer must be stateless.

```text
Users
  ↓
CDN / WAF / HTTPS
  ↓
Load Balancer / Platform Routing
  ↓
API Instance 1
API Instance 2
API Instance 3
...
  ↓
Redis / PostgreSQL / Queue
```

No important application state should exist only in process memory.

Examples of state that must not live only in RAM:

- active trip state,
- user profile,
- authentication-critical state,
- decision history,
- verification state,
- review eligibility,
- offline pack metadata,
- SOS events.

## 2.3 Scale target interpretation

The target is approximately **10,000 concurrent users**, not a promise that every request can be served at arbitrary burst rates without testing.

The implementation must be validated with realistic load tests and observed metrics.

Initial engineering validation target:

- 10,000 concurrent simulated users.
- Realistic mixed traffic rather than a single repeated endpoint.
- API, Redis, PostgreSQL and worker behavior observed together.
- p50, p95 and p99 latency recorded.
- Error rate and provider failures recorded.
- Database connection utilization measured.
- Queue depth and worker latency measured.

The actual production capacity is the result of load testing, provider quotas, selected infrastructure size, query performance, caching and workload mix.

---

# 3. Technology baseline

Use the project's existing stack where it is already established and working.

Recommended baseline:

| Layer | Technology / pattern |
|---|---|
| Application | Next.js + TypeScript |
| API | Next.js route handlers / API layer |
| ORM | Prisma |
| Database | PostgreSQL |
| Geospatial | PostgreSQL geospatial capabilities / PostGIS where appropriate |
| Cache | Redis |
| Queue | Redis-backed or managed job queue compatible with the deployment platform |
| AI | LLM + embeddings/similarity services via provider adapter |
| Maps | Provider abstraction; permitted Maps/OSM-compatible sources |
| Weather | Weather provider adapter |
| Transport | Government/public feeds, GTFS-style data where available, permitted provider APIs |
| Auth | Existing project authentication strategy; do not replace working auth without evidence |
| Notifications | Provider abstraction for push/email/SMS where applicable |
| Object storage | Managed object storage for larger/offline assets |
| Hosting | Cloud deployment with stateless application instances |
| CI/CD | GitHub-based automated test/build/deploy pipeline |
| Observability | Structured logs + error tracking + metrics |

Do not hard-code a provider just because it was used in a prototype.

---

# 4. Agent Operating System

This section is intentionally explicit because an AI coding agent must not treat this document as permission to make uncontrolled architectural changes.

## 4.1 Mandatory pre-task procedure

For every task larger than a trivial typo/documentation change:

```text
READ AGENTS.md
    ↓
READ relevant context files
    ↓
READ relevant skill workflow
    ↓
READ decision log
    ↓
READ relevant learnings
    ↓
INSPECT existing code
    ↓
TRACE frontend ↔ API ↔ service ↔ DB
    ↓
PLAN
    ↓
IMPLEMENT
    ↓
TEST
    ↓
VERIFY
    ↓
UPDATE traceability / logs when required
```

## 4.2 Repository-first rule

Before adding a new file, confirm:

- whether an equivalent utility already exists,
- whether the same domain module already exists,
- whether the database model already exists,
- whether the requested API already exists under another route,
- whether a provider adapter exists,
- whether the frontend already expects a specific response shape.

Do not duplicate existing abstractions.

## 4.3 No destructive implementation

Never:

- delete a working module merely to simplify the code,
- replace the database schema wholesale without a migration strategy,
- rename public API contracts without checking consumers,
- remove security controls to make a feature easier,
- replace provider abstraction with direct provider calls,
- remove tests to make CI pass.

If a clean refactor is necessary, document the reason and migration path.

## 4.4 One vertical slice at a time

Preferred feature delivery pattern:

```text
UI consumer
  ↓
API contract
  ↓
Validation
  ↓
Application service
  ↓
Domain logic
  ↓
Repository
  ↓
Database / external provider
  ↓
Tests
  ↓
UI integration verification
```

Do not build all database tables first, then all APIs, then all frontend work without validating complete feature slices.

## 4.5 Agent task contract

For each implementation task, the agent should produce internally (or record where project rules require):

```text
Task ID
Goal
Relevant requirements
Relevant files inspected
Existing behavior
Planned changes
Database changes
API changes
External integrations
Tests to add/update
Acceptance criteria
Risks
Rollback / migration concerns
```

## 4.6 Definition of done

A backend task is not done when code compiles.

It is done only when:

```text
Implementation
+ validation
+ tests
+ error handling
+ observability where appropriate
+ security checks
+ documentation / traceability
+ frontend contract compatibility
```

have been considered and the project's verification workflow passes.

---

# 5. Backend folder architecture

Recommended structure, adapted to an existing Next.js repository rather than imposing a fresh project layout blindly:

```text
src/
├── app/
│   └── api/
│       └── v1/
│           ├── auth/
│           ├── profile/
│           ├── intents/
│           ├── destinations/
│           ├── discovery/
│           ├── reality/
│           ├── decisions/
│           ├── alternatives/
│           ├── mobility/
│           ├── arrival-points/
│           ├── trips/
│           ├── itineraries/
│           ├── safety/
│           ├── offline/
│           ├── vehicles/
│           ├── mechanics/
│           ├── providers/
│           ├── verification/
│           ├── reviews/
│           ├── feedback/
│           └── analytics/
│
├── modules/
│   ├── auth/
│   ├── profile/
│   ├── intent/
│   ├── destination/
│   ├── reality/
│   ├── discovery/
│   ├── decision/
│   ├── experience/
│   ├── mobility/
│   ├── trip/
│   ├── safety/
│   ├── offline/
│   ├── rental/
│   ├── mechanic/
│   ├── trust/
│   ├── review/
│   ├── feedback/
│   └── analytics/
│
├── services/
│   ├── ai/
│   ├── weather/
│   ├── maps/
│   ├── transport/
│   ├── notifications/
│   ├── storage/
│   └── geocoding/
│
├── workers/
│   ├── reality/
│   ├── ai/
│   ├── review/
│   ├── itinerary/
│   ├── offline/
│   ├── notification/
│   └── analytics/
│
├── repositories/
├── lib/
│   ├── db.ts
│   ├── redis.ts
│   ├── queue.ts
│   ├── auth.ts
│   ├── logger.ts
│   ├── validation.ts
│   ├── errors.ts
│   ├── config.ts
│   └── telemetry.ts
│
├── types/
└── constants/

prisma/
├── schema.prisma
├── migrations/
└── seed.ts

tests/
├── unit/
├── integration/
├── e2e/
└── load/
```

### Layering rule

```text
HTTP route
   ↓
Controller / request handler
   ↓
Application service
   ↓
Domain logic
   ↓
Repository / provider
```

Routes must not contain large business algorithms.

---

# 6. Domain boundaries

## 6.1 Auth

Owns:

- registration/login if applicable,
- session/token integration,
- authentication context,
- role resolution,
- protected route checks.

Does not own traveller suitability or trip logic.

## 6.2 Profile

Owns:

- traveller preferences,
- budget,
- pace,
- accessibility requirements,
- language,
- transport preference,
- emergency contacts.

## 6.3 Intent

Owns normalization of:

- natural-language travel request,
- intended experience,
- constraints,
- trip context.

## 6.4 Destination

Owns canonical destination records and relatively stable metadata.

## 6.5 Reality

Owns dynamic destination state and evidence metadata.

## 6.6 Decision

Owns hard constraints, suitability calculation, decision resolution and explainable decision factors.

## 6.7 Experience

Owns experience taxonomy, vectors/embeddings where used, similarity logic and alternative candidate matching.

## 6.8 Mobility

Owns:

- route request,
- transport options,
- arrival points,
- last-mile planning,
- vehicle/rental integration boundaries.

## 6.9 Trip

Owns:

- trip state,
- itinerary versions,
- trip events,
- adaptations.

## 6.10 Safety

Owns:

- Safety Indicator,
- remote-area context,
- SOS workflow,
- assistance events.

## 6.11 Offline

Owns:

- downloadable trip pack,
- versioning,
- asset manifest,
- synchronization metadata.

## 6.12 Trust / Verification

Owns:

- providers,
- verification state,
- verification evidence,
- review eligibility,
- audit/hash records.

## 6.13 Feedback

Owns the prediction → actual experience comparison.

---

# 7. Database design

## 7.1 Canonical data model

The minimum conceptual model is:

```text
User
 ├── TravellerProfile
 ├── TravellerIntent
 ├── Trip
 ├── Review
 └── Feedback

Destination
 ├── DestinationExperience
 ├── DestinationObservation
 ├── DestinationAlternative
 ├── ArrivalPoint
 └── Provider proximity

Trip
 ├── Itinerary
 ├── ItineraryItem
 ├── ItineraryEvent
 ├── Recommendation / Decision references
 ├── AssistanceEvent
 └── OfflinePack

Provider
 ├── VerificationRecord
 ├── Vehicle
 ├── ServiceRequest
 └── Review references
```

## 7.2 Core Prisma entities

The agent should implement and refine these models rather than blindly creating duplicate entities:

### User

Fields conceptually:

```text
id
email / identity reference
name
role
createdAt
updatedAt
```

Do not duplicate auth-provider state unnecessarily if an existing auth library owns it.

### TravellerProfile

```text
id
userId
budgetMin
budgetMax
travelPace
crowdPreference
accessibilityNeeds
transportPreference
vehicleRequired
languagePreference
createdAt
updatedAt
```

Flexible preference structures may use normalized tables or validated JSON where appropriate. Avoid unstructured JSON for fields that require frequent filtering/querying.

### EmergencyContact

Separate entity preferred over a single JSON field when the application needs validation, ordering, revocation, auditing, or selective use.

```text
id
userId
name
phone
relationship
isPrimary
createdAt
updatedAt
```

### TravellerIntent

```text
id
userId
tripId nullable
rawText
normalizedIntent JSON
experienceTags
constraints JSON
embeddingVersion nullable
embeddingReference nullable
createdAt
```

### Destination

```text
id
name
slug
latitude
longitude
region
country
category
description
operationalMetadata
createdAt
updatedAt
```

Stable fields belong here. Dynamic state does not.

### DestinationExperience

```text
id
destinationId
experienceType
weight
source
confidence
createdAt
updatedAt
```

### DestinationObservation

Central dynamic evidence record:

```text
id
destinationId
signalType
value JSON
source
collectedAt
expiresAt
confidence
evidenceType
locationScope nullable
createdAt
```

Examples of `signalType`:

```text
WEATHER
CROWD
OPERATIONS
TRANSPORT
CONNECTIVITY
SAFETY
ACCESSIBILITY
SUPPORT
REVIEW_SENTIMENT
EVENT
ROAD
```

### DestinationAlternative

Optional precomputed/curated relationship:

```text
id
sourceDestinationId
targetDestinationId
relationshipType
experienceSimilarity
status
createdAt
updatedAt
```

Dynamic ranking should still happen at request time.

### Recommendation / Decision

Persist decisions that matter for traceability or feedback.

Conceptual fields:

```text
id
userId
destinationId
tripId nullable
ruleVersion
modelVersion nullable
suitability
decision
confidence
factors JSON
reasons JSON
inputSnapshot JSON or reference
createdAt
```

Do not silently overwrite historical decisions when feedback analysis depends on the original prediction.

### Trip

```text
id
userId
origin
destinationSummary
startDate
endDate
status
currentItineraryVersion
createdAt
updatedAt
```

### Itinerary

```text
id
tripId
version
status
source
createdAt
```

### ItineraryItem

```text
id
itineraryId
dayIndex
sequence
itemType
destinationId nullable
arrivalPointId nullable
startTime nullable
endTime nullable
metadata JSON
```

### ItineraryEvent

```text
id
tripId
itineraryId
version
eventType
reason
oldValue JSON
newValue JSON
triggeredBy
createdAt
```

### Provider

```text
id
type
name
latitude
longitude
serviceArea
verificationStatus
contactData
availabilityMetadata
metadata JSON
createdAt
updatedAt
```

### VerificationRecord

```text
id
providerId/entityId
entityType
status
evidenceType
evidenceReference
decidedBy
validFrom
expiresAt
createdAt
updatedAt
```

Sensitive verification evidence should not be exposed through ordinary public provider APIs.

### Review

```text
id
userId
providerId nullable
destinationId nullable
eligibilityId
text
rating
verificationState
moderationState
createdAt
updatedAt
```

### ReviewEligibility

```text
id
userId
providerId / destinationId
experienceReference
eligibleAt
status
createdAt
```

### ReviewAudit

```text
id
reviewId
eventType
previousHash
currentHash
payloadDigest
createdAt
```

The exact cryptographic design should remain an implementation detail behind a tamper-evident audit abstraction. Do not build an unnecessary full blockchain for the MVP.

### TransportOption

```text
id
providerSource
mode
origin
 destination
departureTime
arrivalTime
duration
fare
metadata
observedAt
expiresAt
```

### ArrivalPoint

```text
id
destinationId
name
latitude
longitude
pointType
accessibilityMetadata
facilityMetadata
transportMetadata
metadata JSON
```

### Vehicle

```text
id
providerId
vehicleType
availabilityStatus
capacity
terrainSuitability
priceMetadata
pickupLocation
returnLocation
metadata
```

### Mechanic

Usually modeled as a provider subtype. A dedicated table is only necessary if the domain requires mechanic-specific attributes that would otherwise become unwieldy.

### AssistanceEvent

```text
id
tripId nullable
userId
type
latitude nullable
longitude nullable
providerId nullable
status
consentState
createdAt
resolvedAt nullable
```

Types:

```text
SOS
MECHANIC
EMERGENCY_SUPPORT
```

### OfflinePack

```text
id
tripId
version
status
manifest JSON
generatedAt
expiresAt nullable
```

### Feedback

```text
id
userId
tripId nullable
predictionId
actualExperience JSON
delta JSON
createdAt
```

### YatraPoint / rewards

Use a transaction ledger rather than only a mutable balance.

```text
YatraPointTransaction
id
userId
sourceType
sourceReference
points
direction
createdAt
```

Current balance can be derived or maintained with transactional safeguards.

---

# 8. Database rules

## 8.1 Index principles

Index by actual query patterns.

Expected indexes include combinations similar to:

```text
Destination:
  slug
  region
  coordinates / geospatial index

DestinationObservation:
  destinationId + signalType
  destinationId + observed/collected time
  expiresAt

Trip:
  userId + status
  userId + startDate

Itinerary:
  tripId + version

Provider:
  type + verificationStatus
  geospatial index

Review:
  destinationId + moderationState
  providerId + moderationState

AssistanceEvent:
  userId + createdAt
  tripId + createdAt
```

Do not add every possible index. Each index has write and storage cost.

## 8.2 Geospatial queries

Use database-supported spatial queries where they materially improve proximity searches.

Required use cases:

- nearby mechanic,
- nearby hospital,
- nearby fuel,
- nearby providers,
- arrival point ranking,
- remote-area support lookup.

## 8.3 Connection management

Use connection pooling / pooler support appropriate to the chosen PostgreSQL provider.

Never create a database connection per request manually.

The DB client must be safe for the deployment environment and existing Next.js runtime model.

---

# 9. API architecture

## 9.1 Versioning

Preferred external contract:

```text
/api/v1/...
```

Internal service interfaces may evolve independently.

## 9.2 API response envelope

Use a consistent response convention. Example:

```json
{
  "data": {},
  "meta": {
    "requestId": "..."
  }
}
```

Error:

```json
{
  "error": {
    "code": "DESTINATION_DATA_STALE",
    "message": "Current destination data is unavailable.",
    "retryable": false,
    "requestId": "..."
  }
}
```

Do not leak provider internals or stack traces to clients.

## 9.3 Authentication

Protected endpoint classes:

- profile,
- personal recommendations,
- trip data,
- emergency contacts,
- SOS,
- feedback,
- review eligibility/review submission,
- operator dashboard,
- tourism dashboard.

Public or limited-access endpoint classes may include destination discovery, public destination metadata, and public provider listings depending on product decisions.

## 9.4 Authorization

Minimum roles:

```text
TRAVELLER
LOCAL_OPERATOR
TOURISM_AUTHORITY
ADMIN
```

Authorization must happen at the service/resource level, not only in UI logic.

---

# 10. API catalog

The conceptual API set should be implemented as versioned contracts.

## 10.1 Auth

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

Use the existing auth architecture where possible.

## 10.2 Traveller profile

```text
GET   /api/v1/profile
POST  /api/v1/profile
PATCH /api/v1/profile
```

Validation:

- budget is valid,
- party size positive,
- dates valid,
- preference enum values valid,
- accessibility fields normalized,
- emergency contacts valid when supplied.

## 10.3 Travel intent

```text
POST /api/v1/intents/normalize
GET  /api/v1/intents/:id
```

Input can contain natural language such as:

```text
"I want a peaceful heritage trip with photography and architecture, not too crowded."
```

Output should be normalized into structured intent.

Example:

```json
{
  "experience": {
    "history": 0.9,
    "photography": 0.8,
    "architecture": 0.9,
    "peace": 0.95
  },
  "constraints": {
    "crowdPreference": "low"
  }
}
```

## 10.4 Destination discovery

```text
POST /api/v1/discovery/search
POST /api/v1/discovery/recommend
```

Flow:

```text
profile
+
intent
+
geo/date/budget constraints
   ↓
coarse deterministic filtering
   ↓
experience similarity
   ↓
reality filtering
   ↓
suitability ranking
   ↓
top candidate set
```

AI should not be called for every candidate.

## 10.5 Destination

```text
GET /api/v1/destinations/:id
GET /api/v1/destinations/:id/reality
GET /api/v1/destinations/:id/experiences
```

Reality response should include evidence metadata:

```json
{
  "weather": {
    "value": {},
    "source": "provider-x",
    "observedAt": "...",
    "confidence": 0.94,
    "status": "FRESH"
  }
}
```

Supported freshness states:

```text
FRESH
STALE
UNKNOWN
UNAVAILABLE
```

## 10.6 Decision

```text
POST /api/v1/decisions/evaluate
```

Input:

```json
{
  "destinationId": "...",
  "travelDate": "...",
  "tripContext": {}
}
```

Response:

```json
{
  "decision": "MODIFY",
  "suitability": 74,
  "confidence": 0.88,
  "ruleVersion": "suitability-v1",
  "reasons": [
    "Good weather window",
    "High crowd expected later",
    "Transport available"
  ],
  "modifications": [
    "Visit before 11:00 AM"
  ]
}
```

## 10.7 Alternatives

```text
POST /api/v1/alternatives/search
```

Input:

```text
experience intent
origin/location
budget
travel date
constraints
excluded destination
```

Output:

```text
candidate
experienceSimilarity
suitability
reasons
currentReality
mobility summary
```

## 10.8 Mobility

```text
GET /api/v1/mobility/options
GET /api/v1/mobility/transport
GET /api/v1/arrival-points
```

## 10.9 Trips

```text
POST /api/v1/trips
GET  /api/v1/trips
GET  /api/v1/trips/:id
PATCH /api/v1/trips/:id
```

## 10.10 Itinerary

```text
POST /api/v1/trips/:id/itinerary/generate
PATCH /api/v1/trips/:id/itinerary
POST /api/v1/trips/:id/itinerary/replan
GET  /api/v1/trips/:id/itinerary/history
```

## 10.11 Safety

```text
GET  /api/v1/safety/indicator
GET  /api/v1/safety/remote-context
POST /api/v1/safety/sos
GET  /api/v1/safety/emergency-contacts
```

## 10.12 Mechanic

```text
GET  /api/v1/mechanics/nearby
POST /api/v1/mechanics/request
GET  /api/v1/mechanics/:id
```

## 10.13 Vehicle rental

```text
GET /api/v1/vehicles/nearby
GET /api/v1/vehicles/search
POST /api/v1/vehicles/:id/request
```

Use a listing/lead/deep-link model initially if live booking inventory is unavailable.

## 10.14 Offline

```text
POST /api/v1/trips/:id/offline-pack
GET  /api/v1/trips/:id/offline-pack
GET  /api/v1/trips/:id/offline-pack/manifest
```

## 10.15 Trust and reviews

```text
GET  /api/v1/providers
GET  /api/v1/providers/:id
GET  /api/v1/providers/:id/verification
GET  /api/v1/reviews/eligibility
POST /api/v1/reviews
GET  /api/v1/reviews/:id
```

## 10.16 Feedback

```text
POST /api/v1/feedback
GET  /api/v1/feedback/history
```

## 10.17 Operator / authority analytics

```text
GET /api/v1/operator/dashboard
GET /api/v1/tourism/dashboard
GET /api/v1/tourism/demand
```

Analytics endpoints must return aggregated/anonymized data appropriate to the requesting role.

---

# 11. Validation strategy

Every external request must pass schema validation before business logic.

Preferred pattern:

```text
Request
 ↓
Schema validation
 ↓
Normalization
 ↓
Authorization
 ↓
Business logic
```

Validate:

- IDs,
- enums,
- dates,
- coordinates,
- numeric ranges,
- array size limits,
- text lengths,
- JSON structures,
- provider query parameters.

Never trust client-provided:

- userId,
- role,
- verification state,
- review eligibility,
- trip ownership,
- emergency authority.

Derive privileged values from authenticated server context.

---

# 12. Destination Reality Engine

## 12.1 Purpose

Provide normalized, contextual destination state.

## 12.2 Reality pipeline

```text
Provider API / public source / user report
       ↓
Provider adapter
       ↓
Normalize
       ↓
Validate
       ↓
Evidence classification
       ↓
Confidence assignment
       ↓
DestinationObservation
       ↓
Redis cache
       ↓
Decision engine
```

## 12.3 Evidence hierarchy

Preferred hierarchy:

1. Official government/destination source.
2. Verified provider source.
3. Multiple independent observations.
4. Individual user report.
5. Model inference, explicitly labeled as inference.

Do not silently transform model inference into verified fact.

## 12.4 Freshness model

Every dynamic signal must support:

```text
collectedAt
expiresAt / freshness window
source
confidence
status
```

Example:

```text
Weather:
FRESH
observed 4 min ago

Crowd:
STALE
observed 2 hours ago

Road status:
UNKNOWN
```

The user interface must receive enough information to represent uncertainty correctly.

---

# 13. Weather integration

Create a provider contract:

```ts
interface WeatherProvider {
  getCurrent(input: WeatherRequest): Promise<WeatherResult>;
  getForecast(input: ForecastRequest): Promise<ForecastResult>;
}
```

Adapter responsibilities:

- map provider response to internal schema,
- normalize units,
- validate provider data,
- attach source metadata,
- map provider errors to internal error codes.

Cache by geographic/destination key and forecast horizon.

Do not request fresh provider data on every frontend refresh when cached data is still valid.

---

# 14. Crowd intelligence

Crowd is a special signal because universally reliable real-time data may not exist.

The system should support:

```text
official feed
permitted signal
historical pattern
verified user reports
inference
```

Store provenance and confidence.

Do not claim universal real-time crowd measurement when the source does not provide it.

Possible normalized state:

```text
LOW
MEDIUM
HIGH
UNKNOWN
```

A historical or inferred estimate must be marked accordingly.

---

# 15. Operations intelligence

Operations can include:

- open/closed,
- temporary closure,
- restrictions,
- event conflict,
- route disruption,
- access limitation.

Operational restrictions may become **hard constraints**.

Example:

```text
Destination closed
   ↓
GO prohibited
   ↓
MODIFY or ALTERNATIVE
```

Do not allow an LLM to override a verified hard restriction.

---

# 16. Suitability Engine

## 16.1 Responsibility

Convert:

```text
Traveller
+
Intent
+
Destination
+
Reality
+
Mobility
+
Support
```

into:

```text
suitability
confidence
factors
GO/MODIFY/ALTERNATIVE
```

## 16.2 Hard constraints first

Examples:

```text
closed
critical restriction
incompatible date
mandatory accessibility conflict
impossible transport window
```

Hard constraints must be evaluated before soft ranking.

## 16.3 Weighted soft scoring

The prototype baseline can use configurable categories similar to:

```text
Interest Match
Weather
Crowd Preference
Accessibility
Transport
Operational Status
Safety/Support
```

Do not hard-code business weights into frontend components.

Store the ruleset version:

```text
suitability-v1
```

The exact weights should remain configurable and empirically testable.

## 16.4 Example score

```text
Interest match       0.90
Weather              0.80
Crowd fit             0.50
Accessibility         1.00
Transport             0.80
Operations            1.00
Support               0.80
```

The scoring layer should produce factor-level outputs so the explanation can identify why the result occurred.

## 16.5 GO / MODIFY / ALTERNATIVE

### GO

Use when:

- hard constraints pass,
- context is compatible,
- no material modification is required.

### MODIFY

Use when:

- destination remains viable,
- timing, route, arrival point or activity can materially improve the outcome.

### ALTERNATIVE

Use when:

- hard constraints fail, or
- destination is materially incompatible,
- and an experience-equivalent alternative can preserve the traveller's intent.

---

# 17. Decision explainability

The explanation must be grounded in the actual decision inputs.

Preferred structure:

```text
Decision
Suitability
Confidence
Major factors
Evidence freshness
Recommended action
Limitations / unknowns
```

Example:

```text
MODIFY
Suitability: 74/100
Confidence: 0.88

Why:
- Strong match for heritage interest.
- Afternoon crowd is expected to be high.
- Weather is favorable in the morning.
- Transport remains available.

Recommended action:
Visit earlier in the day.

Data note:
Crowd estimate is based on the latest available observation.
```

The LLM may produce the wording, but the facts and factors must originate from structured backend state.

---

# 18. Experience-equivalent alternative engine

## 18.1 Core rule

The alternative is chosen for **experience preservation**, not nearest-coordinate optimization.

## 18.2 Pipeline

```text
Traveller intent
    ↓
Experience representation
    ↓
Candidate retrieval
    ↓
Hard constraint filter
    ↓
Experience similarity
    ↓
Current reality filter
    ↓
Mobility / distance
    ↓
Support / resilience
    ↓
Suitability
    ↓
Alternative ranking
```

## 18.3 Experience representation

Example:

```json
{
  "history": 0.9,
  "photography": 0.8,
  "architecture": 0.9,
  "peace": 0.95
}
```

## 18.4 Candidate ranking

Conceptual components:

```text
experience similarity
current suitability
constraint fit
mobility quality
support/resilience
sustainability/de-congestion relevance
```

The final ranking should remain explainable.

---

# 19. Discovery architecture

Discovery should be multi-stage.

```text
All destinations
    ↓
Geo filter
    ↓
Date/budget filter
    ↓
Capability/accessibility filter
    ↓
Experience similarity
    ↓
Reality screening
    ↓
Suitability scoring
    ↓
Top candidates
```

This prevents expensive AI calls against the entire destination universe.

The backend should aim to make the AI operate on a **small candidate set**, not as the primary search engine over all destinations.

---

# 20. Mobility architecture

## 20.1 Provider abstraction

```ts
interface RouteProvider {
  getRoute(input: RouteRequest): Promise<RouteResult>;
}

interface TransportProvider {
  search(input: TransportRequest): Promise<TransportResult[]>;
}
```

Adapters normalize source-specific responses.

## 20.2 Mobility request pipeline

```text
Origin
Destination
Travel date/time
Traveller constraints
      ↓
Provider layer
      ↓
Route candidates
      ↓
Normalize
      ↓
Operational scoring
      ↓
Return options
```

## 20.3 Smart Arrival Point

Score arrival points using:

- distance,
- walking difficulty,
- accessibility,
- transit connectivity,
- parking,
- hotel proximity,
- medical access,
- toilet availability,
- food/services,
- remote-area support.

Core principle:

```text
Nearest ≠ Best
```

The final response should expose the major reason for the chosen point.

---

# 21. Vehicle rental

Initial architecture:

```text
Vehicle Provider
    ↓
Verification
    ↓
Availability
    ↓
Trip fit
    ↓
Location proximity
    ↓
Rental option
```

Trip-fit factors:

- vehicle type,
- number of travellers,
- terrain,
- distance,
- budget,
- remote area context.

For the SIH MVP, a curated/verified provider listing with contact or booking path is acceptable where full live inventory is unavailable.

Do not fake live inventory in production.

---

# 22. Mechanic assistance

## 22.1 Lookup flow

```text
User / trip context
    ↓
Vehicle type
Location
Issue category
    ↓
Geo search
    ↓
Capability filter
    ↓
Availability
    ↓
Verification
    ↓
Distance/ranking
    ↓
Assistance options
```

## 22.2 Fallback

If no verified provider exists:

```text
No verified mechanic nearby
    ↓
Fallback contact path
    ↓
Show limitation clearly
```

Do not invent emergency providers.

---

# 23. Safety Indicator

The Safety Indicator is a contextual support summary, not a guarantee.

Possible inputs:

```text
connectivity
emergency facility access
road/route constraints
assistance provider distance
verified user reports
remote-area context
freshness/confidence
```

Output should distinguish:

```text
known safe-context factors
unknown factors
stale factors
confidence
```

Avoid language that implies absolute safety.

---

# 24. Remote Area Intelligence

## 24.1 Detection

Use configured thresholds and available spatial/support data.

Possible factors:

- distance to populated area,
- connectivity availability,
- emergency support distance,
- hospital distance,
- mechanic/fuel availability,
- accommodation coverage,
- transport coverage.

## 24.2 Output

```json
{
  "isRemote": true,
  "connectivity": "LIMITED",
  "nearestHospitalKm": 31.2,
  "nearestMechanicKm": 24.1,
  "nearestFuelKm": 18.4,
  "offlineRecommended": true
}
```

Values are examples only; the actual schema should be typed and validated.

---

# 25. SOS architecture

SOS must be independent from AI availability.

```text
SOS button
    ↓
Authenticated request
    ↓
Consent check
    ↓
Create AssistanceEvent
    ↓
Last-known location
    ↓
Emergency contacts
    ↓
Nearby support
    ↓
Permitted notifications
```

## 25.1 Important safeguards

- Do not expose precise location to unrelated actors.
- Show what data will be shared.
- Log sensitive actions.
- Make emergency sharing time-bounded where practical.
- Clearly distinguish simulated versus truly integrated emergency escalation.
- Do not claim guaranteed emergency-service dispatch if not actually integrated.

---

# 26. Offline architecture

## 26.1 Offline pack contents

```text
Trip metadata
Itinerary
Saved destination data
Essential route/map assets where legally permitted
Emergency contacts
Saved hotel/provider information
Rental information
Mechanic information
Safety information
Last-known reality snapshot
```

## 26.2 Generation pipeline

```text
POST offline-pack
    ↓
Authorize trip ownership
    ↓
Gather pack assets
    ↓
Filter sensitive data
    ↓
Generate manifest
    ↓
Store package/version
    ↓
Return download metadata
```

## 26.3 Offline freshness

Live weather/crowd cannot remain live offline.

Represent:

```text
lastSyncedAt
source
staleness
```

The client must not display cached dynamic state as current.

---

# 27. Trip engine

## 27.1 Trip state machine

Suggested states:

```text
DRAFT
PLANNED
READY
ACTIVE
PAUSED
COMPLETED
CANCELLED
```

## 27.2 Itinerary versioning

```text
Trip
 ├── Itinerary v1
 ├── Itinerary v2
 └── Itinerary v3
```

Never mutate the historical plan in a way that prevents explaining what changed.

## 27.3 Adaptation flow

```text
Active trip
    ↓
New reality observation
    ↓
Conflict detector
    ↓
Decision / alternatives
    ↓
Replan
    ↓
Create new itinerary version
    ↓
Create ItineraryEvent
    ↓
Notify user
```

Possible triggers:

- weather,
- closure,
- crowd change,
- transport disruption,
- accessibility issue,
- route issue.

---

# 28. AI architecture

## 28.1 AI responsibilities

Use AI for:

- natural language intent extraction,
- experience classification,
- review sentiment/topic analysis,
- complaint clustering,
- semantic similarity,
- alternative reasoning support,
- itinerary drafting,
- multilingual/voice understanding,
- natural-language explanations.

## 28.2 Non-AI responsibilities

Keep deterministic:

- distance,
- geospatial filtering,
- routing,
- schedule matching,
- hard constraints,
- budget checks,
- opening/closure logic,
- verification state,
- safety/SOS workflow,
- offline synchronization,
- persistence.

## 28.3 AI output contracts

LLM outputs must be schema-constrained where possible.

Example intent extraction output:

```json
{
  "experience": {
    "history": 0.9,
    "photography": 0.8,
    "architecture": 0.9,
    "peace": 0.95
  },
  "constraints": {
    "crowdPreference": "LOW"
  }
}
```

The server validates it before use.

## 28.4 Grounded explanation rule

The LLM must never invent:

- weather,
- crowd state,
- operating status,
- provider availability,
- medical support,
- safety facts,
- transport schedules.

It should receive structured evidence and produce wording from those facts.

## 28.5 AI failure mode

If the AI provider fails:

```text
Intent already structured → continue
Review analysis delayed → queue/retry
Explanation generation fails → deterministic explanation template
SOS → unaffected
Suitability engine → unaffected
```

AI must be an enhancement layer, not a single point of failure for safety or core deterministic decisions.

---

# 29. Redis architecture

Redis responsibilities:

1. cache,
2. rate limiting,
3. short-lived state where appropriate,
4. queue support if selected queue technology uses Redis.

## 29.1 Cache key conventions

Use namespaced keys:

```text
destination:{id}
destination:{id}:reality
weather:{geoHash}:{window}
crowd:{destinationId}
transport:{originHash}:{destinationHash}:{date}
arrival:{destinationId}:{profileHash}
providers:{category}:{geoHash}
experience:{destinationId}
recommendation:{profileHash}:{destinationId}:{date}:{rulesVersion}
```

## 29.2 TTL guidance

Initial starting points must be empirically tuned:

| Data | Example starting window |
|---|---|
| Stable destination metadata | hours to days |
| Experience metadata | days |
| Weather | minutes |
| Crowd | minutes to tens of minutes |
| Transport schedule | hours / schedule-dependent |
| Nearby mechanic availability | short TTL |
| Public provider listing | hours |
| AI summary | hours/days depending on source freshness |

Do not treat these as immutable business rules.

## 29.3 Cache-aside pattern

```text
Request
 ↓
Redis
 ├── HIT → return
 └── MISS
      ↓
Database/provider
      ↓
Redis set
      ↓
return
```

## 29.4 Cache invalidation

When a material destination observation changes:

```text
write observation
   ↓
invalidate affected reality cache
   ↓
optionally invalidate dependent recommendation cache
```

Avoid globally deleting unrelated caches.

---

# 30. Rate limiting

Use Redis or platform-supported equivalent.

Rate limits should be classified by endpoint risk.

Suggested classes:

```text
PUBLIC_READ
AUTH
SEARCH
DECISION
AI_EXPENSIVE
REVIEW_WRITE
SENSITIVE_ACTION
```

Do not apply one limit to all endpoints.

Important:

- protect expensive AI endpoints,
- protect provider-proxy endpoints,
- protect write endpoints,
- protect auth flows from abuse.

SOS requires special treatment because aggressive blocking could interfere with a legitimate emergency workflow. The final emergency behavior must be defined in the security review.

---

# 31. Background job architecture

## 31.1 Worker classes

```text
Reality workers
AI workers
Review workers
Itinerary workers
Offline workers
Notification workers
Analytics workers
```

## 31.2 Example jobs

```text
SYNC_WEATHER
SYNC_TRANSPORT
SYNC_OPERATIONS
PROCESS_REVIEW
GENERATE_EXPERIENCE_VECTOR
GENERATE_ITINERARY
REPLAN_TRIP
BUILD_OFFLINE_PACK
SEND_NOTIFICATION
AGGREGATE_DEMAND
COMPUTE_FEEDBACK_DELTA
```

## 31.3 Job requirements

Every meaningful background job should support:

- idempotency,
- retry policy,
- dead-letter/failure path where supported,
- structured logging,
- job ID,
- execution timestamps.

Do not create duplicate side effects on retries.

---

# 32. Provider abstraction

Every external integration should follow:

```text
Internal interface
    ↓
Provider adapter
    ↓
External source
```

Examples:

```ts
interface WeatherProvider { ... }
interface MapProvider { ... }
interface RouteProvider { ... }
interface TransportProvider { ... }
interface NotificationProvider { ... }
interface AIProvider { ... }
```

The rest of YatraSetu should depend on the internal interface, not a provider-specific response shape.

Provider adapters must:

- normalize data,
- handle provider-specific errors,
- enforce provider limits,
- attach source metadata,
- avoid violating provider terms,
- support fallback where a second permitted source exists.

---

# 33. External API protection

Never implement external calls as unbounded fan-out.

Bad:

```text
1 user request
   ↓
20 provider requests
```

Better:

```text
cache
 ↓
normalized existing observation
 ↓
only required provider calls
```

Use:

- caching,
- batching where supported,
- concurrency limits,
- timeouts,
- retries with backoff,
- circuit breakers,
- provider-specific rate limits.

When a provider fails, use the most recent valid observation where the product semantics allow it, and surface staleness.

---

# 34. External provider timeout/circuit pattern

```text
Service request
 ↓
Cache check
 ↓
Provider call
 ├── success → normalize → cache
 ├── timeout → fallback / stale observation
 ├── rate limited → retry/backoff / fallback
 └── repeated failure → circuit open
```

Circuit state can be:

```text
CLOSED
OPEN
HALF_OPEN
```

Do not let one provider outage cascade into API-wide failure.

---

# 35. Trust and verification architecture

## 35.1 Verification states

```text
PENDING
UNDER_REVIEW
VERIFIED
SUSPENDED
EXPIRED
```

Entities:

- stays,
- guides,
- vehicle rentals,
- mechanics.

## 35.2 Review eligibility

```text
Booking / interaction
    ↓
Completion / check-in event
    ↓
Eligibility record
    ↓
Review enabled
```

A client must never be trusted to declare itself eligible.

## 35.3 Moderation

Separate:

```text
verification state
```

from:

```text
review moderation state
```

A verified reviewer can still submit a review that requires moderation.

## 35.4 Tamper-evident review history

Use a hash-chain/audit abstraction:

```text
Review event N
    ↓
previous hash
    ↓
current event digest
    ↓
current hash
```

The objective is to make alteration detectable, not to introduce blockchain complexity solely for branding.

---

# 36. Review processing pipeline

```text
POST review
 ↓
Validate
 ↓
Verify eligibility
 ↓
Store review
 ↓
Create audit event
 ↓
Queue analysis
 ↓
Moderation / sentiment / topics
 ↓
Update derived fields
```

Review analytics should not block the user-facing creation request unless product requirements specifically require synchronous moderation.

---

# 37. Feedback and learning loop

The product should preserve:

```text
prediction
actual experience
difference
```

Example:

```text
Predicted crowd = MEDIUM
Actual crowd = HIGH
```

Store the difference so the system can later evaluate:

- provider accuracy,
- crowd prediction quality,
- recommendation usefulness,
- alternative relevance.

Do not silently overwrite historical predictions.

---

# 38. Notifications

Notifications should be event-driven.

Events may include:

```text
TRIP_CREATED
TRIP_ADAPTED
DESTINATION_CHANGED
OFFLINE_PACK_READY
MECHANIC_REQUEST_UPDATED
SOS_EVENT_CREATED
REVIEW_ELIGIBLE
VERIFICATION_CHANGED
```

The notification service receives an internal event and routes it to permitted channels.

Do not call every notification provider directly from domain logic.

---

# 39. Tourism-board and operator data boundaries

The backend must separate:

```text
traveller private data
```

from:

```text
aggregated ecosystem analytics
```

Tourism dashboards should operate on appropriately aggregated/anonymized demand signals.

Do not expose precise individual travel histories or personal location trails unless explicitly required, authorized and consented.

Potential dashboard outputs:

- aggregate demand distribution,
- popular vs underutilized destination patterns,
- sustainability/de-congestion indicators,
- aggregated trends,
- provider participation metrics.

---

# 40. Security baseline

## 40.1 Security layers

```text
HTTPS
 ↓
WAF / platform protection
 ↓
Rate limiting
 ↓
Authentication
 ↓
Authorization
 ↓
Request validation
 ↓
Service logic
 ↓
Database authorization / least privilege
```

## 40.2 Secrets

Never store secrets in:

- frontend bundle,
- source code,
- Git history,
- logs,
- client payloads.

Required secrets/config should exist only in the deployment environment / approved secrets store.

## 40.3 Location privacy

Location is sensitive operational data for this application.

Requirements:

- explicit purpose,
- minimal collection,
- least-privilege access,
- limited retention where practical,
- user-visible sharing behavior,
- audit sensitive access.

## 40.4 Admin protection

Administrative endpoints must have:

- explicit role checks,
- audit events,
- strong authentication requirements appropriate to the deployment,
- narrow query/data scope.

---

# 41. Responsible AI

Mandatory rules:

1. AI cannot silently override hard constraints.
2. AI explanations must be grounded in structured backend facts.
3. Unknown data remains unknown.
4. Stale data must be labeled stale.
5. Model/version identifiers should be stored for reproducibility where relevant.
6. User plans remain editable.
7. High-impact safety actions do not depend solely on generated language.
8. Human review remains available for verification and safety escalation workflows.

---

# 42. Observability

## 42.1 Structured logs

Each backend request should have a request ID.

Recommended fields:

```text
requestId
userId nullable
route
method
status
latencyMs
service
errorCode nullable
provider nullable
```

Never log secrets or sensitive location data unnecessarily.

## 42.2 Metrics

Track:

```text
requests/sec
p50 latency
p95 latency
p99 latency
error rate
DB latency
DB connection utilization
Redis hit ratio
queue depth
worker latency
AI latency
external provider error rate
```

## 42.3 Domain metrics

Track:

```text
decisions evaluated
GO/MODIFY/ALTERNATIVE distribution
alternative acceptance/selection
replanning events
offline-pack generation success
SOS events
mechanic requests
verified reviews
reality freshness
```

---

# 43. Resilience design

## 43.1 Failure hierarchy

When a dependency fails, prefer graceful degradation.

Example:

```text
Weather provider down
    ↓
Use valid cached observation
    ↓
mark stale
    ↓
lower confidence if required
```

## 43.2 Core product availability

The following should remain useful even when AI is unavailable:

- destination lookup,
- profile,
- stored reality observations,
- deterministic suitability,
- GO/MODIFY/ALTERNATIVE logic,
- saved trips,
- offline information,
- SOS event creation where network/communication permits.

---

# 44. Caching strategy for the 10k-user target

The main objective is to prevent the database and external providers from becoming the bottleneck.

## 44.1 Hot data

Potential high-read data:

- destination metadata,
- reality snapshots,
- experience metadata,
- public provider listings,
- route results where safely reusable,
- AI summaries.

These are strong cache candidates.

## 44.2 Private user data

User-specific profile/trip data should not be globally cached as public content.

Use appropriately scoped cache keys and short TTLs where caching helps.

## 44.3 Recommendation cache

A recommendation can be cached only when the relevant inputs are represented in the key:

```text
user/profile version
intent hash
 destination
travel date
rules version
reality version/fingerprint
```

If critical reality changes, invalidate dependent recommendation cache or version it out.

---

# 45. Load and scale architecture

## 45.1 Request path

```text
Client
 ↓
CDN / WAF
 ↓
Load balancer
 ↓
Stateless API instance
 ↓
Redis
 ↓
Application service
 ├── PostgreSQL
 ├── Provider adapter
 └── Queue
```

## 45.2 Horizontal scaling

The API layer should scale by adding instances:

```text
1 instance
2 instances
4 instances
8 instances
...
```

The exact scaling threshold must be load-tested.

## 45.3 Database scaling

Start with:

```text
PostgreSQL primary
+
connection pooling
+
indexes
+
Redis
```

Add read replicas only when measured read load justifies them.

Do not introduce active-active multi-region database writes for the MVP merely to appear globally scalable.

---

# 46. Global deployment strategy

## Phase A — Pilot / India

```text
Global client traffic
      ↓
CDN
      ↓
Primary application region
      ↓
PostgreSQL + Redis
```

## Phase B — International API edge

```text
Users
 ↓
Global CDN / edge
 ↓
Regional stateless API instances
 ↓
Centralized data layer / selected read distribution
```

## Phase C — Multi-region evolution

Only introduce more complex multi-region data strategies after measured need.

Possible future evolution:

```text
Region A API
Region B API
Region C API
      ↓
Data replication strategy
      ↓
Region-aware caches
```

The architecture must not claim active-active global consistency unless it is actually implemented and tested.

---

# 47. CI/CD

Preferred path:

```text
Feature branch
   ↓
Pull Request
   ↓
Lint
   ↓
Typecheck
   ↓
Unit tests
   ↓
Integration tests
   ↓
Build
   ↓
Staging deployment
   ↓
Smoke tests
   ↓
Production deployment
```

Database migrations must be reviewed and applied through controlled deployment steps.

Never rely on destructive database reset commands in production.

---

# 48. Environment configuration

Create a typed server-side configuration layer.

Conceptual variables:

```text
DATABASE_URL
DIRECT_DATABASE_URL if required by provider pattern
REDIS_URL
AUTH configuration
AI provider key
MAP provider key/config
WEATHER provider key/config
TRANSPORT configuration
NOTIFICATION configuration
OBJECT_STORAGE configuration
LOGGING / OBSERVABILITY configuration
```

The actual names must match the repository's existing conventions.

Rules:

- validate required env variables on server startup/build as appropriate,
- never expose server-only secrets to client code,
- maintain separate values for local/staging/production,
- document which variables are required versus optional.

---

# 49. Seed data strategy

The agent should create deterministic seed data for development and demo testing.

Minimum seed dataset:

```text
multiple destinations
multiple experience vectors
weather/reality observations
crowd states
transport options
arrival points
verified/unverified providers
vehicles
mechanics
review eligibility records
sample reviews
sample trip
sample itinerary versions
```

Seed data should support the core demo scenarios.

Do not use fake data in production without a clear source/label.

---

# 50. Mock provider strategy

A mock provider should implement the same interface as a real provider.

Example:

```text
WeatherProvider
 ├── RealWeatherProvider
 └── MockWeatherProvider
```

This enables deterministic tests and SIH demonstrations without requiring every external service to be live.

Mock providers must be clearly marked and must not be accidentally enabled in production.

---

# 51. Core end-to-end scenario

The primary backend integration test should be:

```text
Create account
 ↓
Create traveller profile
 ↓
Create travel intent
 ↓
Discover destinations
 ↓
Select destination
 ↓
Retrieve destination reality
 ↓
Evaluate decision
 ↓
Receive GO/MODIFY/ALTERNATIVE
 ↓
Generate/select alternative if required
 ↓
Get mobility options
 ↓
Select Smart Arrival Point
 ↓
Create trip
 ↓
Generate itinerary
 ↓
Generate offline pack
 ↓
Start trip
 ↓
Inject reality change
 ↓
Replan itinerary
 ↓
Create feedback
```

This is the core vertical slice.

---

# 52. Acceptance scenario matrix

## Scenario A — crowded destination

```text
Intent:
peaceful heritage + photography

Destination:
experience match = high
crowd = high

Expected:
MODIFY or ALTERNATIVE
```

Alternative must preserve intended experience; it must not simply be the nearest destination.

## Scenario B — bad weather but recoverable

```text
Weather currently poor
Future weather favorable
Destination otherwise viable

Expected:
MODIFY
```

## Scenario C — destination closure

```text
Destination closed

Expected:
No GO
ALTERNATIVE / itinerary adaptation
```

## Scenario D — Smart Arrival

```text
Point A = 200 m
poor support

Point B = 500 m
better accessibility + facilities

Expected:
Point B can win
```

## Scenario E — remote travel

```text
Trip enters configured remote context

Expected:
remote-area card
safety context
offline prompt
```

## Scenario F — vehicle breakdown

```text
Trip active
Vehicle issue

Expected:
Nearby compatible verified mechanics
or explicit fallback
```

## Scenario G — offline mode

```text
Offline pack downloaded
Network disabled

Expected:
itinerary available
saved provider info available
emergency information available
live state clearly marked unavailable/stale
```

## Scenario H — review eligibility

```text
No completed/verified interaction

Expected:
review submission blocked
```

## Scenario I — stale dynamic data

```text
Observation expired

Expected:
stale/unknown state shown
no fake real-time claim
```

---

# 53. Testing pyramid

## 53.1 Unit tests

Required high-value units:

```text
constraint evaluator
suitability scorer
decision resolver
experience similarity
alternative ranking
arrival ranking
remote-area detection
safety factor calculation
cache key generation
freshness calculation
review eligibility
verification state transitions
```

## 53.2 Integration tests

```text
API + PostgreSQL
API + Redis
service + mock provider
queue + worker
review + audit
trip + itinerary versioning
```

## 53.3 E2E tests

Run at least the acceptance scenario matrix.

## 53.4 Contract tests

Provider adapters should have tests ensuring normalized output matches internal interfaces.

---

# 54. Load testing plan

The goal is to validate the architecture, not to manufacture a number.

## Stage 1

```text
1,000 concurrent users
```

Validate:

- API latency,
- DB queries,
- cache behavior,
- worker queue.

## Stage 2

```text
5,000 concurrent users
```

Identify first bottlenecks.

## Stage 3

```text
10,000 concurrent users
```

Run realistic traffic mix.

## Stage 4

```text
15,000 concurrent users
```

Optional stress test to determine failure behavior and scaling headroom.

### Traffic mix example

```text
30% destination browsing
20% discovery
15% decision evaluations
10% mobility
10% trip/itinerary
5% provider search
5% reviews/feedback
5% other
```

This is a test-design starting point, not a measured prediction of real traffic.

Do not use this mix as a product KPI without actual usage evidence.

---

# 55. Performance budgets

Initial engineering objectives:

| Area | Starting objective |
|---|---|
| Simple cached read | very low latency / edge-cache friendly |
| Normal API | p95 under ~500 ms target |
| Decision evaluation | p95 under ~1 s target where external data is already normalized/cached |
| AI generation | asynchronous where not required inline |
| DB query | monitor and optimize slow queries |
| Error rate | <1% initial production objective |
| Availability | 99.9% target for mature production path |

These are engineering goals, not guarantees. They must be measured under the actual deployment configuration.

---

# 56. Performance optimization order

When load testing exposes a problem, optimize in this order:

```text
1. Slow query analysis
2. Missing/incorrect indexes
3. N+1 queries
4. Excessive provider calls
5. Redis caching
6. Payload size
7. expensive synchronous AI work
8. concurrency limits
9. worker scaling
10. API instance scaling
11. database scaling
```

Do not immediately increase server size without identifying the bottleneck.

---

# 57. N+1 query prevention

Common danger:

```text
Get 50 destinations
 ↓
50 individual queries for experiences
 ↓
50 individual queries for reality
```

Preferred:

```text
One destination query
Bulk load related data
Batch queries
Cache shared data
```

Prisma queries should be designed around actual access patterns, not accidental loops.

---

# 58. Transaction rules

Use database transactions when multiple writes must remain consistent.

Examples:

- create booking interaction + eligibility,
- verification state change + audit event,
- itinerary adaptation + itinerary event,
- YatraPoint ledger update + balance update if one exists,
- SOS assistance record + related event state.

Do not wrap slow external API calls inside long database transactions.

Bad:

```text
BEGIN
 ↓
call external API for 8 seconds
 ↓
write DB
COMMIT
```

Prefer:

```text
external operation
 ↓
validate result
 ↓
short DB transaction
```

---

# 59. Idempotency

Required for retryable write operations such as:

- creating service requests,
- offline pack creation,
- notification dispatch,
- payment/booking integrations if later added,
- SOS-trigger side effects,
- review submission if client retries.

Example:

```text
Idempotency-Key
```

The server should prevent duplicate side effects for the same idempotency key.

---

# 60. Data lifecycle

Dynamic observations should expire according to signal type.

Potential lifecycle:

```text
COLLECTED
 ↓
FRESH
 ↓
STALE
 ↓
ARCHIVED
```

Historical observations may remain useful for analytics while no longer being eligible as current state.

Do not delete historical observations solely because they are stale if they are needed for model evaluation or audit.

---

# 61. API security checklist

For each endpoint verify:

```text
[ ] Authentication required?
[ ] Role required?
[ ] Resource ownership checked?
[ ] Input validated?
[ ] Rate limited?
[ ] Sensitive data minimized?
[ ] Errors sanitized?
[ ] Audit event required?
[ ] Idempotency required?
[ ] External provider limits handled?
```

---

# 62. Frontend-backend contract discipline

The existing `web/DESIGN_HANDOVER.md` is explicitly concerned with preserving React data bindings. Backend changes therefore must not casually rename fields consumed by `.tsx` components.

Before changing a response:

```text
Search API consumer
 ↓
Search field usage
 ↓
Assess compatibility
 ↓
Update both sides
 ↓
Run type/build/E2E checks
```

Prefer additive fields or versioned contracts when practical.

---

# 63. Backend-to-wireframe mapping

The final wireframe journey maps to these backend capabilities:

```text
LANDING
  → mostly client

LOGIN
  → Auth

PROFILE
  → Profile

TRAVEL INTENT
  → Intent + AI normalization

DISCOVER
  → Discovery

CHECK DESTINATION
  → Destination + Reality + Decision

DESTINATION REALITY
  → Reality Engine

PERSONAL SUITABILITY
  → Decision Engine

GO / MODIFY / ALTERNATIVE
  → Decision + Experience Alternative

TRAVEL PLAN
  → Trip + Itinerary

MOBILITY
  → Mobility

SMART ARRIVAL
  → Arrival ranking

REMOTE AREA?
  → Remote Area Intelligence

SAFETY CHECK
  → Safety Indicator

OFFLINE PACK
  → Offline

LIVE / ADAPTIVE TRIP
  → Trip monitoring + Adaptation

SOS
  → Safety

MECHANIC
  → Mechanic assistance

TRIP END
  → Feedback

SYSTEM LEARNING
  → Feedback + Analytics
```

This mapping should be preserved when implementing the frontend and backend together.

---

# 64. MVP prioritization

## P0 — must work end-to-end

```text
Auth
Traveller profile
Travel intent
Destination data
Destination reality
Decision engine
GO/MODIFY/ALTERNATIVE
Experience-equivalent alternatives
Basic mobility
Smart Arrival Point
Trip
Basic itinerary
Offline pack
SOS simulation
```

## P1 — strong supporting capability

```text
Safety Indicator
Remote-area intelligence
Mechanic discovery
Vehicle rental listing
Verified reviews
Operator verification
Feedback loop
```

## P2 — broader ecosystem / scale

```text
Tourism dashboard
Richer transport integrations
Expanded provider network
Advanced multilingual/voice
Richer demand analytics
Expanded rewards
```

This ordering reflects the established MVP principle: demonstrate the decision engine and end-to-end adaptive travel journey first, then broaden ecosystem capabilities progressively.

---

# 65. Implementation phases

## Phase 0 — Repository and architecture audit

Tasks:

```text
[ ] Read AGENTS.md
[ ] Read context index
[ ] Read architecture context
[ ] Read AI/decision context
[ ] Read trust/safety/mobility context
[ ] Read MVP context
[ ] Read decision log
[ ] Read learnings
[ ] Inspect package.json
[ ] Inspect src/
[ ] Inspect Prisma
[ ] Inspect existing auth
[ ] Inspect current routes
[ ] Inspect frontend API consumers
[ ] Detect existing providers/utilities
```

Deliverable:

`REPOSITORY_AUDIT.md` or the project's existing equivalent.

Do not start major implementation until the audit is complete.

---

## Phase 1 — Backend foundation

Implement:

```text
config
logging
errors
validation
DB client
Redis client
queue foundation
API versioning
request IDs
health checks
```

Health endpoints:

```text
GET /api/v1/health
GET /api/v1/health/dependencies
```

The dependency health endpoint should not expose secrets.

---

## Phase 2 — Auth and roles

Implement:

```text
User
session/auth integration
role resolution
resource authorization
```

Verify protected endpoints before moving onward.

---

## Phase 3 — Traveller profile and intent

Implement:

```text
TravellerProfile
EmergencyContact
TravellerIntent
intent normalization
```

Tests:

- profile creation,
- update,
- validation,
- unauthorized access,
- intent normalization.

---

## Phase 4 — Destination foundation

Implement:

```text
Destination
DestinationExperience
DestinationObservation
geospatial search
```

Seed pilot-region data.

---

## Phase 5 — Reality Engine

Implement provider interfaces first.

Then:

```text
Weather
Operations
Crowd
Transport
Support
Connectivity
```

Implement:

- normalized observation schema,
- source metadata,
- freshness,
- confidence,
- caching,
- sync jobs.

---

## Phase 6 — Discovery and Decision

Implement:

```text
Discovery search
candidate filtering
experience matching
suitability scoring
GO/MODIFY/ALTERNATIVE
explanations
```

This phase is the highest-priority product intelligence layer.

---

## Phase 7 — Alternatives

Implement:

```text
experience vector representation
candidate retrieval
similarity
reality screening
alternative ranking
```

Demonstrate that the nearest location is not automatically selected.

---

## Phase 8 — Mobility and Smart Arrival

Implement:

```text
route provider interface
transport provider interface
mobility options
arrival point ranking
last-mile planning
```

---

## Phase 9 — Trip and adaptive itinerary

Implement:

```text
Trip
Itinerary
ItineraryItem
ItineraryEvent
versioning
adapt/replan
notifications
```

Test closure/weather/crowd disruption scenarios.

---

## Phase 10 — Safety and resilience

Implement:

```text
Safety Indicator
Remote Area Intelligence
SOS
Offline Pack
Mechanic discovery
```

Safety and offline behavior should be testable without AI.

---

## Phase 11 — Rental and provider ecosystem

Implement:

```text
Provider
Vehicle
Mechanic provider
verified listing
service request
```

Prefer curated data initially.

---

## Phase 12 — Trust

Implement:

```text
VerificationRecord
ReviewEligibility
Review
ReviewAudit
moderation state
```

Verify the complete review lifecycle.

---

## Phase 13 — Feedback and analytics

Implement:

```text
Feedback
PredictionOutcome / references
aggregate analytics
YatraPoint ledger
```

---

## Phase 14 — Production hardening

Implement:

```text
Redis tuning
rate limiting
provider timeout/circuit logic
queue retries
DB indexes
connection pooling
observability
backup verification
security review
```

---

## Phase 15 — Load testing

Run:

```text
1k
5k
10k
optional 15k
```

Fix bottlenecks.

Repeat.

---

## Phase 16 — Deployment

Promote:

```text
local
 ↓
staging
 ↓
production
```

Production checklist must pass before public rollout.

---

# 66. Detailed task breakdown for the coding agent

The following task IDs should become the initial implementation backlog.

## FOUNDATION

```text
BE-001 Repository audit
BE-002 Environment/config system
BE-003 Structured logger
BE-004 Error system
BE-005 Request ID middleware/util
BE-006 Validation system
BE-007 Prisma database foundation
BE-008 Redis foundation
BE-009 Queue foundation
BE-010 Health endpoints
```

## AUTH

```text
BE-020 Auth audit
BE-021 User model integration
BE-022 Session/auth helpers
BE-023 RBAC
BE-024 Protected route utilities
```

## PROFILE / INTENT

```text
BE-030 TravellerProfile
BE-031 EmergencyContact
BE-032 Profile APIs
BE-033 TravellerIntent
BE-034 Intent normalization
BE-035 Intent tests
```

## DESTINATION

```text
BE-040 Destination schema
BE-041 Experience taxonomy
BE-042 Geospatial queries
BE-043 Destination APIs
BE-044 Destination seed data
```

## REALITY

```text
BE-050 Observation schema
BE-051 Freshness model
BE-052 Evidence/confidence model
BE-053 Weather adapter
BE-054 Operations adapter
BE-055 Crowd adapter
BE-056 Transport adapter
BE-057 Support-facility provider
BE-058 Reality cache
BE-059 Reality workers
```

## DECISION

```text
BE-060 Constraint engine
BE-061 Suitability scorer
BE-062 Decision resolver
BE-063 Decision API
BE-064 Decision persistence
BE-065 Explanation builder
BE-066 Decision tests
```

## EXPERIENCE / ALTERNATIVE

```text
BE-070 Experience representation
BE-071 Similarity service
BE-072 Candidate alternative search
BE-073 Alternative ranking
BE-074 Alternative API
BE-075 Alternative benchmark tests
```

## MOBILITY

```text
BE-080 Route interface
BE-081 Transport interface
BE-082 Mobility options
BE-083 ArrivalPoint
BE-084 Smart Arrival ranker
BE-085 Vehicle provider interface
BE-086 Vehicle listing
```

## TRIP

```text
BE-090 Trip model
BE-091 Itinerary model
BE-092 Itinerary versioning
BE-093 Itinerary generator
BE-094 Trip adaptation engine
BE-095 Trip event log
BE-096 Notification integration
```

## SAFETY / RESILIENCE

```text
BE-100 Safety Indicator
BE-101 Remote Area Intelligence
BE-102 Emergency Contact integration
BE-103 SOS workflow
BE-104 Mechanic search
BE-105 Mechanic request
BE-106 OfflinePack model
BE-107 OfflinePack generator
```

## TRUST

```text
BE-110 Provider model
BE-111 Verification state machine
BE-112 Verification API
BE-113 ReviewEligibility
BE-114 Review submission
BE-115 Review moderation state
BE-116 Review audit/hash chain
BE-117 Review analysis worker
```

## FEEDBACK / ANALYTICS

```text
BE-120 Feedback model
BE-121 Feedback API
BE-122 Prediction/actual comparison
BE-123 Demand aggregation
BE-124 Tourism dashboard API
BE-125 YatraPoint ledger
```

## HARDENING

```text
BE-130 Rate limits
BE-131 Cache optimization
BE-132 DB indexes
BE-133 N+1 query audit
BE-134 Provider timeouts
BE-135 Circuit breakers
BE-136 Retry/idempotency
BE-137 Observability dashboard
BE-138 Security audit
BE-139 Backup/restore test
BE-140 Load testing
BE-141 Production deployment
```

---

# 67. Recommended implementation order within each task

For each BE task:

```text
1. Inspect existing code
2. Identify relevant PRD requirement(s)
3. Check decision-log / learnings
4. Define contract
5. Define schema change if needed
6. Implement domain logic
7. Implement repository/provider integration
8. Implement API
9. Add validation/errors
10. Add tests
11. Run verification workflow
12. Update traceability
```

Do not jump directly from requirement → huge code generation.

---

# 68. Definition of done for major modules

## Destination Reality

```text
[ ] normalized observations
[ ] source
[ ] freshness
[ ] confidence
[ ] cache
[ ] worker
[ ] provider abstraction
[ ] stale handling
[ ] tests
```

## Decision Engine

```text
[ ] hard constraints
[ ] configurable weights
[ ] versioned rules
[ ] suitability
[ ] GO
[ ] MODIFY
[ ] ALTERNATIVE
[ ] explainability
[ ] deterministic repeatability
[ ] tests
```

## Alternative Engine

```text
[ ] experience representation
[ ] candidate filtering
[ ] similarity
[ ] current reality
[ ] mobility
[ ] ranking
[ ] explanation
[ ] benchmark tests
```

## Trip Adaptation

```text
[ ] current itinerary
[ ] trigger
[ ] conflict detection
[ ] replacement
[ ] new itinerary version
[ ] event audit
[ ] notification
[ ] tests
```

## Offline

```text
[ ] manifest
[ ] version
[ ] essential data
[ ] offline metadata
[ ] network-disabled test
[ ] stale dynamic-data representation
```

## Trust

```text
[ ] provider state
[ ] verification state
[ ] evidence
[ ] review eligibility
[ ] moderation
[ ] audit/hash
[ ] tests
```

---

# 69. Agent prompts / task execution template

When delegating a task to another coding agent, use this style:

```text
Implement BE-XXX.

Before coding:
- read AGENTS.md
- read relevant context files
- read relevant workflow skill
- inspect existing implementation
- inspect decision-log and learnings

Goal:
<one precise goal>

Required behavior:
<acceptance criteria>

Constraints:
- preserve existing working behavior
- use existing abstractions where available
- do not introduce a new library without justification
- do not bypass provider abstraction
- do not put business logic in route handlers
- add tests

Deliver:
- implementation
- tests
- migration if required
- traceability update
- concise implementation summary
- remaining risks/blockers
```

For large tasks, split them into smaller tasks rather than issuing one huge implementation request.

---

# 70. Technical decision rules

A technical choice is considered settled only when recorded in the project's decision log.

Before reopening a decision, ask:

```text
What new evidence exists?
What requirement changed?
What production bottleneck was measured?
What security/legal/provider constraint changed?
```

Avoid reopening architecture because a different tool is fashionable.

---

# 71. Product decision rules affecting backend

If a backend implementation encounters an unresolved product choice, do not silently invent one.

Examples:

```text
real booking vs deep link vs simulation
emergency integration vs demo simulation
exact safety scoring inputs
offline map licensing
operator verification method
pilot geography
actual transport provider
```

Use the project's decision workflow, then record the decision.

---

# 72. Data quality rules

Every dynamic data source should answer:

```text
What is the value?
Where did it come from?
When was it observed?
When should it expire?
How confident are we?
Is it observed or inferred?
```

If any critical item is unknown:

```text
Do not invent it.
```

The system should degrade to:

```text
UNKNOWN
```

where appropriate.

---

# 73. Recommendation reproducibility

To reproduce an important decision, persist enough metadata to identify:

```text
rules version
model version when relevant
input context or stable reference
reality observation versions
createdAt
```

This is needed for debugging and feedback analysis.

---

# 74. Data and API anti-patterns

Never implement:

```text
LLM decides all logic
```

Never implement:

```text
route handler contains 300+ lines of business logic
```

Never implement:

```text
every request calls every external API
```

Never implement:

```text
one global Redis key for all users
```

Never implement:

```text
frontend sends role=true / verified=true
```

Never implement:

```text
stale weather displayed as current
```

Never implement:

```text
SOS depends on LLM response
```

Never implement:

```text
nearest destination automatically treated as best alternative
```

Never implement:

```text
provider-specific response format spread across the entire codebase
```

---

# 75. SIH demo reliability mode

The SIH demo needs deterministic behavior even when external providers are unavailable.

The agent should build a clearly controlled demo mode that can use mock/seeded providers for:

- weather,
- crowd,
- operations,
- transport,
- mechanic availability.

Demo mode must be:

```text
explicitly enabled
clearly separated from production
repeatable
```

The demo should be able to demonstrate:

1. normal destination → GO,
2. crowded destination → MODIFY/ALTERNATIVE,
3. closure → ALTERNATIVE/replan,
4. remote trip → offline/safety,
5. breakdown → mechanic,
6. verified review lifecycle.

Do not fake that a mock provider is live data.

---

# 76. Production readiness checklist

## Architecture

```text
[ ] stateless API
[ ] horizontal scaling supported
[ ] provider abstraction
[ ] queue/workers
[ ] Redis
[ ] PostgreSQL pooling
```

## Data

```text
[ ] migrations controlled
[ ] indexes reviewed
[ ] backup configured
[ ] restore tested
[ ] location retention reviewed
```

## API

```text
[ ] versioned routes
[ ] schema validation
[ ] consistent errors
[ ] auth
[ ] RBAC
[ ] rate limits
[ ] idempotency where needed
```

## Reality

```text
[ ] source metadata
[ ] freshness
[ ] confidence
[ ] stale handling
[ ] provider failure handling
```

## AI

```text
[ ] structured outputs
[ ] grounded explanations
[ ] versioning
[ ] fallback behavior
[ ] no AI-only safety dependency
```

## Safety

```text
[ ] consent
[ ] emergency contacts
[ ] SOS event logging
[ ] location privacy
[ ] explicit integration limits
```

## Testing

```text
[ ] unit
[ ] integration
[ ] e2e
[ ] contract
[ ] load test
```

## Observability

```text
[ ] logs
[ ] metrics
[ ] error tracking
[ ] request IDs
[ ] provider monitoring
```

---

# 77. 10,000-user readiness checklist

The phrase “supports 10,000 users” should only be used after these categories are validated.

```text
[ ] API is stateless
[ ] multiple API instances have been tested
[ ] DB connection pooling configured
[ ] hot reads cached
[ ] cache hit ratio measured
[ ] expensive AI operations controlled
[ ] background jobs isolated
[ ] external providers have timeouts
[ ] external provider rate limits respected
[ ] circuit/fallback strategy tested
[ ] slow queries identified and optimized
[ ] N+1 audit completed
[ ] load test at 10k concurrent users completed
[ ] p95/p99 recorded
[ ] error rate recorded
[ ] failure behavior documented
```

The result should be recorded in a load-test report rather than asserted from architecture alone.

---

# 78. Deployment sequence

## Local

```text
Docker/services or approved local equivalents
PostgreSQL
Redis
Next.js
Worker process
```

## Staging

```text
staging DB
staging Redis
staging provider credentials
staging AI configuration
staging object storage
```

## Production

```text
CDN/WAF
stateless API instances
auto scaling
managed PostgreSQL
Redis
workers
observability
backups
```

Keep production and staging credentials completely separate.

---

# 79. Database migration policy

Every schema change should follow:

```text
Schema change proposal
 ↓
Migration
 ↓
Local validation
 ↓
Integration tests
 ↓
Staging
 ↓
Production
```

Avoid destructive changes that require downtime unless explicitly planned.

For large migrations:

```text
add new field/table
 ↓
backfill
 ↓
switch reads/writes
 ↓
remove old structure later
```

---

# 80. Disaster recovery thinking

At minimum document:

```text
What happens if PostgreSQL is unavailable?
What happens if Redis is unavailable?
What happens if AI provider is unavailable?
What happens if weather provider is unavailable?
What happens if transport provider is unavailable?
What happens if a worker crashes?
What happens if an API instance crashes?
```

Expected general behavior:

```text
API instance down → traffic shifts
Redis down → degraded cache, DB load increases; application should fail safely
AI down → deterministic fallback
Provider down → cache/stale/unknown fallback
Worker down → queue retains retryable jobs
DB down → writes/read-dependent actions fail clearly; safety behavior must respect actual connectivity constraints
```

Do not pretend the system is fully available during a total database outage.

---

# 81. Monitoring alerts

Initial alert categories:

```text
5xx error spike
p95 latency spike
DB connection saturation
DB slow query spike
Redis unavailable
Redis hit-rate collapse
queue backlog
worker failure rate
provider error spike
AI error/latency spike
storage failure
```

Alert thresholds should be tuned from staging and production baselines.

---

# 82. Cost-control principles

The architecture should avoid unnecessary cost as well as unnecessary complexity.

Primary cost controls:

```text
cache before provider
batch provider requests
avoid LLM calls for deterministic work
background expensive work
reuse embeddings
limit candidate set before semantic ranking
avoid oversized payloads
use appropriate log retention
```

Do not sacrifice correctness merely to reduce API cost.

---

# 83. Data-source governance

Before integrating any external source, record:

```text
provider/source name
what data is used
access method
license / permitted use
rate limits
storage limits
attribution requirements
freshness
fallback
```

The agent must never assume that because data is visible on a website it is permitted to scrape or store.

---

# 84. Pilot geography strategy

The first implementation should use a **small curated pilot geography** rather than attempting national completeness.

The exact pilot geography remains a product decision unless already settled in the project decision log.

The backend must therefore make the destination dataset configurable.

```text
PILOT_REGIONS
PILOT_DESTINATIONS
PILOT_PROVIDERS
```

Do not hard-code the system around one specific city unless the project decision log settles that choice.

---

# 85. Architecture evolution rules

The system can evolve from:

```text
Modular monolith
```

toward:

```text
modular monolith
      ↓
worker isolation
      ↓
independent heavy domains
```

Possible future extraction candidates:

- AI processing,
- reality synchronization,
- analytics,
- notifications.

Only extract when measured reasons exist.

---

# 86. Future multi-region data strategy

Potential future pattern:

```text
regional API
regional cache
        ↓
primary transactional DB
        ↓
read replicas / regional read layers
```

The decision engine should not assume database locality beyond its abstraction layer.

This keeps the architecture evolvable without prematurely creating distributed consistency problems.

---

# 87. Traceability requirements

Every major implementation should be mapped to product requirements.

Example:

```text
FR-DEC-01
 ↓
BE-060 constraint engine
BE-061 suitability scorer
BE-062 decision resolver
BE-063 decision API
 ↓
unit + integration + e2e tests
```

Update `logs/traceability.md` after meaningful completion.

Suggested entry:

```text
Requirement: FR-DEC-01
Implementation: modules/decision/*
API: POST /api/v1/decisions/evaluate
Tests: tests/unit/decision/*, tests/e2e/decision/*
Status: IMPLEMENTED
```

---

# 88. Learning log requirements

When an agent discovers:

- a bug,
- failed architecture approach,
- provider limitation,
- surprising framework behavior,
- migration issue,
- scaling bottleneck,

capture it using the project's `capture-learning.md` workflow and `logs/learnings.md`.

Do not make the team rediscover the same issue later.

---

# 89. Decision log requirements

When a technical decision becomes settled, record:

```text
Decision
Context
Options considered
Chosen approach
Why
Tradeoffs
Date/version
```

Examples:

```text
Use modular monolith for MVP
Use Redis for cache/rate limiting
Use provider abstraction
Use deterministic suitability rules first
Use versioned itinerary
Use tamper-evident audit instead of full blockchain for MVP
```

Only record a decision after the project's decision workflow has been followed where required.

---

# 90. Suggested first implementation sprint

Do not ask the agent to implement the entire document in one task.

The first sprint should be:

```text
BE-001 Repository audit
BE-002 Environment/config
BE-003 Logger
BE-004 Errors
BE-005 Request IDs
BE-006 Validation
BE-007 Prisma foundation
BE-008 Redis foundation
BE-010 Health endpoints
```

Then stop and verify.

Second sprint:

```text
BE-020 Auth audit
BE-021 User
BE-023 RBAC
BE-030 TravellerProfile
BE-032 Profile API
```

Then verify.

Third sprint:

```text
BE-033 TravellerIntent
BE-034 Intent normalization
BE-040 Destination
BE-041 Experience taxonomy
BE-043 Destination API
```

Then verify.

This staged strategy prevents architectural drift and makes agent work auditable.

---

# 91. First complete vertical slice target

The first major product slice should be:

```text
Login
 ↓
Profile
 ↓
Intent
 ↓
Destination
 ↓
Reality snapshot
 ↓
Decision
 ↓
GO/MODIFY/ALTERNATIVE
```

A successful completion of this slice proves the central architecture.

Only then add mobility and trip adaptation.

---

# 92. Second complete vertical slice

```text
Decision
 ↓
Alternative
 ↓
Mobility
 ↓
Smart Arrival
 ↓
Trip creation
 ↓
Itinerary
```

---

# 93. Third complete vertical slice

```text
Trip
 ↓
Remote-area context
 ↓
Offline pack
 ↓
SOS
 ↓
Mechanic
 ↓
Adaptive replan
```

---

# 94. Fourth complete vertical slice

```text
Provider
 ↓
Verification
 ↓
Eligibility
 ↓
Review
 ↓
Audit
 ↓
Sentiment/feedback
```

This naturally completes the core platform loop.

---

# 95. Final architectural picture

```text
                                  USERS
                                    │
                                    ▼
                           CDN / WAF / HTTPS
                                    │
                                    ▼
                              Load Balancer
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
                  API #1          API #2          API #N
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
               ┌────────────────────┼────────────────────┐
               ▼                    ▼                    ▼
            Redis              Application             Queue
        cache/rate-limit          modules              workers
                                    │                    │
                ┌───────────────────┼────────────┐       │
                ▼                   ▼            ▼       │
          PostgreSQL           Providers       AI      │
          + PostGIS            adapters       service  │
                │                   │            │      │
                │          ┌────────┼───────┐    │      │
                │          ▼        ▼       ▼    │      │
                │       Weather   Maps   Transport │     │
                │                                    │     │
                └────────────────────────────────────┘     │
                                                           │
              ┌────────────────────────────────────────────┘
              ▼
       Reality / AI / Review /
       Notification / Offline
       background processing
```

---

# 96. Final product loop

The backend must preserve this conceptual flow throughout implementation:

```text
UNDERSTAND
    ↓
DISCOVER
    ↓
ASSESS REALITY
    ↓
DECIDE
    ↓
REACH
    ↓
SUPPORT
    ↓
ADAPT
    ↓
LEARN
```

This is the backend's organizing principle.

The supporting features — hotels, guides, rentals, mechanics, SOS, offline, trust, rewards and tourism analytics — should strengthen this loop rather than turn YatraSetu into a collection of unrelated features.

---

# 97. Explicit non-goals for the implementation agent

Do not attempt to build all of these during the first MVP unless explicitly approved:

```text
nationwide real-time crowd sensing network
full OTA replacement
full airline/railway/bus replacement
restricted-platform scraping
full blockchain infrastructure
absolute safety guarantees
universal live data coverage
full transaction marketplace
active-active multi-region database
microservice fleet without measured need
```

The PRD establishes these as outside the core MVP scope or non-goals.

---

# 98. Open decisions to preserve

Do not silently decide unresolved items. Current decision candidates include:

```text
[ ] pilot geography
[ ] permitted weather provider
[ ] permitted maps/places provider
[ ] transport data sources
[ ] review data source / first-party strategy
[ ] exact suitability weights
[ ] exact hard constraints
[ ] provider verification workflow
[ ] offline map strategy/licensing
[ ] booking: live vs deep-link vs simulated
[ ] emergency escalation: simulated vs actual
[ ] location retention policy
[ ] alternative benchmark methodology
```

If these are already settled in `logs/decision-log.md`, follow the recorded decision instead of reopening them.

---

# 99. Final instructions to the AI coding agent

Before making any major YatraSetu backend change, the agent should be able to answer:

```text
What requirement am I implementing?
What does the wireframe expect?
What existing code handles this?
What data does it need?
What API contract does it expose?
What are the security implications?
What happens if the dependency fails?
What is cached?
What is asynchronous?
What is deterministic?
What is AI-driven?
How is freshness represented?
How is this tested?
How is this traced back to the requirement?
```

If these questions cannot be answered, inspect the repository/context first rather than guessing.

### The agent must optimize for

```text
Correctness
Traceability
Maintainability
Security
Resilience
Observability
Scalability
Cost awareness
```

not merely:

```text
number of files created
number of endpoints created
```

### Final implementation principle

Build YatraSetu as:

```text
A reliable deterministic backend
        +
AI where semantics actually help
        +
real-world data with evidence/freshness
        +
resilient provider integrations
        +
stateful trip intelligence stored outside API instances
        +
background processing for expensive work
        +
clear safety/privacy boundaries
        +
measured horizontal scalability
```

---

# 100. Reference basis

This implementation specification is based on the project's existing YatraSetu PRD and the previously established product/wireframe architecture.

Core product journey and principles are defined in the existing PRD: decision over listing, reality awareness, personalized suitability, experience-equivalent alternatives, explainability, trust by design, contextual safety, offline resilience, provider agnosticism and human override.

The PRD also defines the functional requirements for traveller profile, destination reality, GO/MODIFY/ALTERNATIVE, mobility, Smart Arrival, safety, offline, verification and reviews, as well as its AI/non-AI split, conceptual API requirements, security/privacy rules, MVP phases and acceptance scenarios.

This file adds the engineering execution layer required to turn those requirements into a production-oriented backend that an AI coding agent can implement incrementally.

---

# 101. End state

The intended end state is not “many APIs.”

It is this:

```text
                         YatraSetu Backend
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
        Decision Intelligence                Travel Resilience
              │                                   │
       ┌──────┼──────┐                      ┌─────┼─────┐
       ▼      ▼      ▼                      ▼     ▼     ▼
   Reality  Suit. Alternatives          Mobility Safety Offline
       │      │      │                      │     │     │
       └──────┴──────┘                      └─────┴─────┘
              │                                   │
              └─────────────────┬─────────────────┘
                                ▼
                           Trip + Adapt
                                │
                                ▼
                             Feedback
                                │
                                ▼
                            Improvement
```

**Core rule:** the system should help the traveller make a better decision when reality changes, while remaining honest about what the system actually knows.

---

## Appendix A — Quick agent bootstrap checklist

When starting implementation in a new session:

```text
[ ] Read AGENTS.md
[ ] Read context/00_index.md
[ ] Load only relevant context files
[ ] Inspect logs/decision-log.md
[ ] Inspect logs/learnings.md
[ ] Inspect logs/traceability.md
[ ] Inspect repository
[ ] Confirm current branch/state
[ ] Check package manager and scripts
[ ] Check Prisma schema/migrations
[ ] Check current auth
[ ] Check current API structure
[ ] Check frontend API consumers
[ ] Select one BE task
[ ] Read the corresponding workflow skill
[ ] Plan
[ ] Implement
[ ] Test
[ ] Verify
[ ] Update traceability/logs where needed
```

---

## Appendix B — One-line task prioritization rule

When uncertain which backend feature to implement next:

```text
Choose the smallest task that moves the canonical journey forward,
reduces a known technical risk, or unlocks the next vertical slice.
```
