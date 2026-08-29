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
- **DDD structure**: bounded contexts `auth`, `catalog`, `graffiti`, `artists`, `submission`, `shared`

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

The application layer injects the interface only. Platform selection via Angular DI token + `Capacitor.isNativePlatform()` in the `bootstrapApplication` providers in `src/main.ts`. Never import Capacitor plugins directly in application or presentation layers.

## Architecture (current state — being migrated)

**Routed application** (`src/app/app.routes.ts`), all routes lazy-load a standalone component:
- `tabs/` — `TabsPage` shell (`shell/tabs.page.ts`)
  - `catalog` — `GraffitiPage`, the reels home screen
  - `categories` — `CategoriesPage` (`catalog/presentation/categories`), plain category list
  - `category` / `category/:category` — `CategoryPage` grid and `CategoryMainComponent` detail
  - `artist/:id` — `ArtistCollectionPage`, everything attributed to one artist
  - `submit` — `SubmitPage`, behind `authGuard`
  - `profile` — `ProfilePage`, behind `authGuard`
- `auth/login`, `auth/register`
- `''` and `**` redirect to `/tabs/catalog`

**Not routed (pre-DDD leftovers):** `dashboard/`, `folder/`, `login/`. They still
compile and have specs, but nothing reaches them. Superseded by the tab shell and
`auth/presentation/`. `src/app/components/` and `src/app/main/` were removed for
the same reason.

**Models:** each bounded context owns its own types under `<context>/domain/`.
There is no global `src/app/models/` — it was deleted because a second
definition of `Graffiti`/`Category` drifted away from the API.
- `graffiti/domain/models/graffiti.model.ts` — `Graffiti` (`id` UUID, `category`,
  `artist`, `latitude`, `longitude`, `vote`, `active`, `cover`, `sightings`), plus
  `GraffitiSighting` and `GraffitiPhoto`. **A graffiti has no title, name or
  slug** — free text lives on the sighting. `artist` is `{id, name} | null`;
  `null` means unknown authorship, which is the majority case and a real answer,
  not a missing value.
- `artists/domain/artist.model.ts` — `Artist` (`id` UUID, `name`, `bio`,
  `instagram`, `website`, `graffitiCount`) and `ArtistRef` (`id`, `name`). **An
  artist is not an account**: no username, avatar or socials taken from a user
  profile, and no link to one. The API publishes no artist-account link and the
  client must not reintroduce one.
- `catalog/domain/category.model.ts` — `Category` (`id` UUID, `name`,
  `description`). No image field: the API carries none.

**Data layer:** repositories per context, abstract class in `domain/`, HTTP
implementation in `infrastructure/`, bound by DI in `src/main.ts`
(`GraffitiRepository`, `CategoryRepository`, `AuthRepository`,
`SubmissionRepository`). Pages consume application services/use cases
(`CategoryService`, `GraffitiService`, `LoadGraffitiListUseCase`), never
`HttpClient` directly. `src/app/mocks/` is test fixtures only — typed against
the domain models, never imported by production code.

**Category covers:** the API has no category image, so `CategoryService`
resolves one per category from `GET /v1/graffitis?category=<uuid>` and falls
back to `assets/category-cover-fallback.svg`. Covers load out of band: the grid
renders on the category list alone.

## API

Base URL: `http://localhost/api` (local dev, through the nginx front). Routes are
versioned under `/api/v1/` — `environment.apiUrl` is `/api` in dev (the
`proxy.conf.json` ng-serve proxy forwards it, avoiding CORS) and repositories
append `/v1/...` per endpoint. `environment.mediaUrl` roots photo URLs on the
media host, because the API still returns absolute URLs to a legacy bucket.
Docs: `http://localhost/docs/api-docs.json`

**Auth — Laravel Sanctum, access + refresh token pair:**
- `POST /api/v1/auth/register` — 201, no tokens
- `POST /api/v1/auth/login` — body `{email, password}`, response wrapped in `data`
- `POST /api/v1/auth/refresh` — authorized with the **refresh** token, ability
  `refresh`; using it elsewhere returns 403
- `POST /api/v1/auth/logout` — revokes the token (bearer required)
- `GET /api/v1/auth/userinfo` — current user

Protected endpoints require `Authorization: Bearer <access token>`, attached by
`authInterceptor`, which also forces `Accept: application/json` (without it the
API 302-redirects instead of returning JSON). Tokens live in `SecureTokenStorage`:
Keychain/Keystore on device, **in-memory on web** — never `localStorage`, which
is XSS-readable.

**Categories** (`/api/v1/categories`):
- `GET` — bare array, **no** `{data, meta}` wrapper; param `rows` (default 50).
  There is no `page` param on this endpoint.
- `GET /{id}` — by UUID
- Response fields: `id` (UUID), `name`, `description`

**Graffitis** (`/api/v1/graffitis`):
- `GET` — paginated `{data, links, meta}`; params `page`, `per_page` (default 20),
  `category` (UUID), `artist` (UUID), `sort` (`latest` | `oldest`). `q` is
  accepted but currently ignored — `graffitis` has no searchable text column.
  Filtering by `artist` is what feeds `ArtistCollectionPage`.
- `GET /{id}` — one graffiti
- `GET /{id}/sightings` — sightings of a graffiti
- `POST /api/v1/graffitis` — **the alta**: auth + `create entry` permission, one
  `multipart/form-data` request that creates graffiti, first sighting and photos
  together. Fields: `category` (UUID, required), `artist_id` (UUID, **optional**
  — omit it for unknown authorship; a user id is rejected with 422),
  `latitude` / `longitude` (float, required, in range), `state` (optional:
  `intact` | `damaged` | `painted_over` | `removed`), `description` (optional,
  lands on the sighting), `files[]` (required, 1–10 images, 10 MB each).
  **There is no `title` field** — do not send one.
- `POST /{id}/sightings` — adds a later sighting (`state`, `description`,
  `files[]`) to an existing graffiti; auth required
- `POST /{id}/vote` — auth required

Response fields per graffiti: `id` (UUID), `category` (UUID), `artist`
(`{id, name}` or `null` — there is no `artist_id` field), `latitude`,
`longitude`, `vote`, `active`, `cover`, `sightings`. Each sighting carries
`spotted_by`, `spotted_at`, `state`, `description`, `photos`; each photo carries
`files` with the `lg`, `md`, `sm` and `thumb` variants generated server-side.
The names `galleries` and `pictures` are retired — they are `sightings` and
`photos`.

**Sightings** (`/api/v1/sightings`): `GET` — latest sightings, param `per_page`
(default 6).

**Artists** (`/api/v1/artists`): the catalogue of who painted what, not a user
directory.
- `GET` — paginated `{data, links, meta}`; params `page`, `per_page` (clamped to
  1–100, default 20). Fields: `id`, `name`, `bio`, `instagram`, `website`,
  `graffiti_count`. No account data is published: no `username`, `avatar`,
  `about_me`, `twitter`, and no indication of whether the entry is linked to an
  account.
- `GET /{id}` — one artist
- `POST` / `PUT /{id}` / `DELETE /{id}` — auth + `manage artists` permission,
  which the app does not use today. Deleting an artist does not delete their
  work: those graffitis become unattributed.

**Meta:** `GET /api/v1/version`, `GET /api/v1/health` — public.

## Shared contract

The Graffiti / Sighting / Photo contract shared with the `GMuseo` backend lives
in the `gmuseo` OpenSpec store, at
`/home/max/workspace/src/gitlab.com/specs/gmuseo-specs`. It is the source of
truth when this file and the backend disagree. Consult it with:

```bash
openspec list --specs --store gmuseo
```

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
