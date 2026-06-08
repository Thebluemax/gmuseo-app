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

Angular 21 + Ionic 8 + Capacitor 5 (web/mobile hybrid). Build output goes to `www/` (not `dist/`). Capacitor bridges to native iOS/Android; the same `www/` bundle also runs as a PWA in the browser.

**Platform targets:** web (Firebase Hosting / PWA) + native (iOS + Android via Capacitor). Both must work. Feature detection via `Capacitor.isNativePlatform()` — never assume native-only.

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
  infrastructure/  ← HTTP + platform implementations (web vs native)
  presentation/    ← standalone pages + components
```

Shared UI components in `shared/ui/`, shared domain types in `shared/domain/`.

**Platform abstraction rule:** any hardware capability (camera, geolocation) must be defined as an interface in `domain/` and implemented twice in `infrastructure/`:
- `*.web.ts` — browser APIs (`navigator.geolocation`, `<input type="file">`, etc.)
- `*.native.ts` — Capacitor plugins (`@capacitor/camera`, `@capacitor/geolocation`)

The application layer injects the interface only. Platform selection via Angular DI token + `Capacitor.isNativePlatform()` in `app.config.ts` (or per-context providers). Never import Capacitor plugins directly in application or presentation layers.

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

Base URL: `http://localhost/api` (local dev). **Note:** OpenAPI docs reference `/api/v1/` but actual routes are at `/api/` — use `/api/` in all requests.
Docs: `http://localhost/docs/api-docs.json`

**Auth — Laravel Sanctum bearer token (pure token, no CSRF):**
- `POST /api/auth/login` — body `{email, password}` → `{token: string}`
- `POST /api/auth/logout` — revokes token (bearer required)

Protected endpoints require `Authorization: Bearer <token>` header. Token stored in `localStorage` key `gm_token`.

**Categories** (`/api/categories`):
- `GET` — returns simple array (no pagination wrapper), params: `page`, `rows`
- `GET /{id}` — by UUID
- Response fields: `id` (UUID), `name`, `description`

**Graffitis** (`/api/graffitis`):
- `GET` — paginated `{data, links, meta}`, params: `page`, `rows`
- `GET /last` — array of last 4 graffitis (no pagination wrapper)
- `GET /last-galleries` — last 6 gallery entries
- `GET /{id}/galleries` — galleries for a graffiti
- `POST /api/graffiti/create` — auth required; body: `title`, `description`, `category` (UUID), `artist_id`, `latitude` (float), `longitude` (float)
- `POST /{id}/pictures` — upload multiple files (`files[]`), auth required
- `POST /graffitis/store/picture` — upload single picture; server generates `lg`, `md`, `sm`, `thumb` variants

Response fields per graffiti: `id` (UUID), `title`, `description`, `type` (category UUID), `latitude` (string), `longitude` (string), `galleries` (array)

**Artists** (`/api/artists`):
- `GET` — paginated

## Native capabilities (Capacitor plugins installed)

| Plugin | Web fallback |
|---|---|
| `@capacitor/camera` | `<input type="file" accept="image/*" capture>` |
| `@capacitor/geolocation` | `navigator.geolocation.getCurrentPosition()` |
| `@capacitor/haptics` | no-op |
| `@capacitor/keyboard` | no-op |
| `@capacitor/status-bar` | no-op |

Camera and geolocation are **core domain features** (submission flow). Haptics/keyboard/status-bar are UI enhancements — safe to no-op on web.

## Deployment

- **Web/PWA**: `firebase deploy` — serves `www/`, SPA rewrites all paths to `index.html`
- **Native**: `npx cap sync && npx cap open ios|android` after `npm run build:prod`
- **Docker**: multi-stage build, copies `www/` into nginx:alpine
- **Environment**: `src/environments/environment.ts` (dev) / `environment.prod.ts` (prod), currently only `appName` differs
