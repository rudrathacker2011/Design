# Root application migration

## Current direction

The root app uses Next.js App Router with React 19. Route groups are under src/app; shared components and browser-side domain state are under src/components and src/modules. The Prisma schema is at prisma/schema.prisma.

## Transitional boundary

- Root Next.js is the active web app. Root scripts run Next.js with the existing Express API workspace.
- Current traveller dashboard/discovery components and their fixture-backed domain state have been relocated into the root component/module tree.
- Next.js route handlers under /api/v1 proxy to the Express backend at YATRASETU_BACKEND_URL. The proxy keeps browser API calls same-origin while the API is migrated in vertical slices.
- Express source remains under backend/ during that migration. It is not copied into src/modules because duplicated business logic would make ownership less clear.
- The legacy Vite workspace is retained temporarily for source recovery; it is no longer part of the root build or dev command.

## Data honesty

The overview/discovery screens are labeled as prototype data. Mobility, SOS, provider verification and tourism analytics routes show structural shells until their API behavior can support truthful UI claims.

## Migration sequence

1. Move remaining active web domain components/state into root ownership and remove stale Vite-only imports.
2. Migrate one Express endpoint group at a time into src/app/api/v1 and src/modules, preserving its contract and tests.
3. Remove the Express workspace only after all required endpoints have migrated and verified.
4. Retire or archive leftover Vite files after checking whether any assets or behavior remain useful.
