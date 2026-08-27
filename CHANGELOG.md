# Changelog

All notable changes to the G-Museo app are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

The shared Graffiti / Sighting / Photo contract lives in the `gmuseo` OpenSpec
store — see [CLAUDE.md](CLAUDE.md#shared-contract).

## [Unreleased]

### Added
- `CategoryRepository.getCoverImage()` — derives a category cover from one of its
  graffitis (`GET /v1/graffitis?category=<uuid>`, `sm` variant), because the API
  carries no category image
- `assets/category-cover-fallback.svg` — bundled cover for a category with no
  graffiti yet
- `CategoryService.loadCovers()` / `loadOne()`, plus loading and error state on
  both category screens
- Adapter tests pinning the real API shapes: the bare array from
  `GET /v1/categories`, and a graffiti mapping that exposes no `title`, `name`
  or `slug`
- `category` and `category/:category` routes under the tab shell — the module
  had been left unrouted by the DDD migration
- This CHANGELOG

### Changed
- **BREAKING (internal):** `category/` reads from the API through the `catalog`
  context instead of `src/app/mocks/`
- `src/app/mocks/` is now test fixtures only, typed against the domain models
- Every legacy spec migrated to standalone `TestBed` with
  `provideZonelessChangeDetection()`; the suite compiles and passes again
- `CLAUDE.md`: corrected the API section against `routes/api.php` — the alta is
  `POST /api/v1/graffitis`, one multipart request, no `title`, `files[]`
  required; `sightings`/`photos` replace `galleries`/`pictures`; pagination is
  `per_page` on graffitis and `rows` on categories; documented the `category`,
  `artist` and `sort` filters. Also corrected the Data layer, Models,
  Architecture and token-storage descriptions, which still described the
  pre-DDD app

### Removed
- **BREAKING (internal):** `src/app/models/graffiti.ts` and
  `src/app/models/category.ts` — a second definition of the domain types that
  had drifted from the API (`id: number`, `name`, `image`). The context domains
  are the single source of truth
- `src/app/components/` and `src/app/main/` — unrouted pre-DDD views that
  rendered `graffiti.name` and `category.image`, fields the model no longer has
