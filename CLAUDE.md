# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start           # dev server (ng serve)
npm run build       # development build → www/
npm run build:prod  # production AOT build → www/
npm test            # Karma/Jasmine watch mode
npm run test:prod   # headless Chrome, single run, with coverage
npm run test:coverage  # watch mode + coverage
npm lint            # ESLint via angular-eslint
```

Run a single spec file:
```bash
npx ng test --include='**/category-nav.component.spec.ts'
```

## What this app does

G-Museo is a graffiti museum — a mobile-first app where users can browse a curated collection of graffiti by category, find graffiti in the real world, photograph it, and share it. When a user shares a found graffiti, **GPS coordinates are saved** with the submission for map-based visualization later. Core flows: browse collection → view by category → find in wild → photo + share → location stored.

## Stack

Angular 18 + Ionic 8 + Capacitor 5 (web/mobile hybrid). NgRx 18 is installed but not yet wired up. Build output goes to `www/` (not `dist/`). Capacitor provides native camera and geolocation access on iOS/Android.

## Architectural decisions

- **Zoneless**: `provideZonelessChangeDetection()` — no `zone.js`
- **Reactivity**: Signals only — no NgRx, no RxJS observables for state (HTTP calls can return observables but state lives in signals)
- **Components**: All standalone — no NgModules
- **i18n**: Two languages, English + Spanish. API fields `_en`/`_es` only (ignore `_cat` for now)
- **DDD structure**: bounded contexts `auth`, `catalog`, `submission`, `artists`, `shared`

Each context follows:
```
<context>/
  domain/          ← interfaces, value objects (no Angular deps)
  application/     ← use cases as @Injectable services, inject()
  infrastructure/  ← HTTP repository implementations
  presentation/    ← standalone pages + components
```

Shared UI components in `shared/ui/`, shared domain types in `shared/domain/`.

## Architecture (current state — being migrated)

**Feature modules (lazy-loaded):**
- `login/` — unauthenticated entry point
- `dashboard/` — shell with sidebar nav; children: `main/` (home view) and `folder/:id`
- `category/` — list (`CategoryPage`) and detail (`CategoryMainComponent`)
- `graffiti/` — list (`GraffitiMainComponent`), show (`GraffitiShowComponent`), create (`GraffitiNewComponent`)

**Routing:**
- Root redirects `''` → `dashboard`
- `dashboard` is behind `AuthGuard`, which currently **always redirects to `/login`** (`if (true)` stub — not functional auth)
- All top-level routes lazy-load their module

**Shared components** (`src/app/components/`) use the `gm-` selector prefix (not `app-`):
- `gm-main-graffiti` — hero graffiti display, takes `@Input() graffiti: Graffiti`
- `gm-monthly-graffitis` — grid list, takes `@Input() graffitiList`
- `gm-category-nav` — two-column category grid, takes `@Input() categories: Category[]`

**Models** (`src/app/models/`): `Graffiti` (`id, name, image, description`) and `Category` (`id, name, description, image, graffitis?`).

**Data layer:** No services yet — all data is hardcoded in `src/app/mocks/` (`CategoryMock`, `GraffitiMock`) and inline in `MainComponent`. Mock URLs point to `http://localhost:9444` (local backend).

## API

Base URL: `http://localhost` (local dev). All endpoints under `/api/v1/`.

**Auth — Laravel Sanctum bearer token:**
- `POST /api/v1/auth/login` — body `{email, password}` → `{token}`
- `POST /api/v1/auth/logout` — revokes token (bearer required)

Protected endpoints require `Authorization: Bearer <token>` header.

**Categories** (`/api/v1/categories`):
- `GET` — paginated (`page`, `rows`)
- `GET /{id}` — by UUID
- `POST` / `PUT /{id}` / `DELETE /{id}` — auth required
- Body fields: `name_en` (required), `name_es`, `name_cat`, `description_en` (required), `description_es`, `description_cat` — **multilingual: English, Spanish, Catalan**
- IDs are **UUIDs** (current frontend model uses `number` — needs fixing)

**Graffitis** (`/api/v1/graffitis`):
- `GET` — paginated (`page`, `rows`)
- `GET /last` — last 4 graffitis
- `GET /last-galleries` — last 6 gallery entries
- `GET /{id}/galleries` — galleries for a graffiti
- `POST /api/v1/graffiti/create` — auth + `create entry` permission; body requires `title`, `description`, `category` (UUID), `artist_id`, **`latitude`** (float), **`longitude`** (float)
- `POST /{id}/pictures` — upload multiple files (`files[]`), auth required
- `POST /graffitis/store/picture` — upload single picture; server generates `lg`, `md`, `sm`, `thumb` variants

**Artists** (`/api/v1/artists`):
- `GET` — paginated

**Key gaps between current frontend and API:**
- `Graffiti` model missing: `latitude`, `longitude`, `artist_id`, `title` (uses `name`)
- `Category` model IDs must be UUID strings, not numbers; fields are `name_en`/`name_es`/`name_cat` not `name`
- `AuthGuard` stub must store/read Sanctum token from storage and send as bearer

## Deployment

- **Firebase Hosting**: `firebase deploy` — serves `www/`, SPA rewrites all paths to `index.html`
- **Docker**: multi-stage build, copies `www/` into nginx:alpine
- **Environment**: `src/environments/environment.ts` (dev) / `environment.prod.ts` (prod), currently only `appName` differs
