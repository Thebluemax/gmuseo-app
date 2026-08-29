# Changelog

All notable changes to the G-Museo app are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

The shared Graffiti / Sighting / Photo contract lives in the `gmuseo` OpenSpec
store — see [CLAUDE.md](CLAUDE.md#shared-contract).

## [Unreleased]

### Added
- `artists` bounded context: `Artist` / `ArtistRef` domain models,
  `ArtistRepository` and its HTTP implementation against the paginated
  `GET /v1/artists`, and `ArtistService`. An artist is a catalogue entry, never
  an account: the model carries no username, avatar or profile text, and no link
  to a platform account
- `ArtistCollectionPage` at `/tabs/artist/:id` — everything attributed to one
  artist, fed by `GET /v1/graffitis?artist=<uuid>`. An artist with no work is a
  valid entry and says so, rather than showing an error
- Authorship on the graffiti view: the artist's name, linking to their
  collection, or "Autor desconocido" with no link when authorship is unknown
- Adapter tests pinning the paginated `{data, links, meta}` shape of
  `GET /v1/artists` and asserting the mapped artist exposes no account data

### Changed
- **BREAKING (contract)**: `Graffiti` gains `artist` (`{id, name} | null`). The
  API replaced `artist_id` with the artist object, so a client can label a piece
  without a second request. `null` is unknown authorship — the majority case in
  street art, and a real answer rather than a missing value
- The alta no longer looks up an account named "Anonymous" to attribute a piece
  to. Anonymous is now the absence of `artist_id` in the multipart request,
  which is exactly how the API records unknown authorship. `NewGraffiti.artistId`
  becomes optional, and a catalogue that fails to load no longer blocks an
  upload
- `GET /v1/artists` is read as a paginated envelope instead of a bare array, and
  the fields consumed are `id`, `name`, `bio`, `instagram`, `website` and
  `graffiti_count`

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
