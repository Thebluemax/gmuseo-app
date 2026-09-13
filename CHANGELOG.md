# Changelog

All notable changes to the G-Museo app are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

The shared Graffiti / Sighting / Photo contract lives in the `gmuseo` OpenSpec
store — see [CLAUDE.md](CLAUDE.md#shared-contract).

## [Unreleased]

### Added
- Coverage for the session flow, which had none: `auth.service.spec.ts` and
  `token-storage.spec.ts` are new, and `auth.interceptor.spec.ts` grew the cases
  it was missing. Between them they pin the parts that are easy to break without
  noticing — the rotated refresh token is the one that gets stored, three
  requests expiring together spend a single refresh, a 403 tears the session down
  without renewing, logging out clears the device even when the server call
  fails, and no token ever reaches `localStorage`, `sessionStorage` or cookies

  One test is deliberately **pending** rather than passing or deleted: the client
  is specified to log out when a request retried after a refresh is rejected
  again, and it does not. `handle401` calls `next(retried)` from inside the
  observable the outer `catchError` returns, and RxJS does not route those errors
  back into that `catchError`, so the `RETRIED` branch is unreachable. The loop
  is still broken — no second refresh, and the error reaches the caller — but the
  dead session stays in place while every request answers 401. Recorded, not
  fixed: this work adds coverage, it does not change behaviour


### Fixed
- **Uploading with an expired access token renews the session instead of
  ending it.** The upload never went through `authInterceptor` (it bypasses
  CapacitorHttp, which corrupts multipart bodies on native), so a 401 on
  `POST /v1/graffitis` was turned straight into a forced logout: no
  `auth/refresh`, the photo lost, the person back at the login screen. Seen on
  the device twice, 2026-09-07 and 2026-09-13 (`401`, 0 renewals). The
  renew-and-retry cycle now lives once in `AuthService.withSessionRetry()` and
  both transports go through it: a 401 renews once and sends the body again
  with the new token; a failed renewal or a second 401 ends the session with
  the "session expired" notice. One in-flight renewal is shared across
  transports, so an upload and an interceptor request expiring together spend
  the rotating refresh token once.
- The session is torn down when a request retried after a renewal is rejected
  again, as `identity/renovacion-de-sesion` requires. The RxJS version of the
  cycle could not reach that branch (recorded as a pending test above); the
  promise-based one can, and the test now runs.

### Changed
- The upload leaves over a raw `XMLHttpRequest` (its four patched methods
  restored from `CapacitorWebXMLHttpRequest`) instead of `CapacitorWebFetch`,
  because only XHR reports how much of the body has been sent. The
  `SubmissionRepository.create()` port takes an optional progress listener.
- Publishing shows where it is: "Subiendo fotos… N %" while the body leaves
  the device, then "Procesando en el servidor…" until the answer. Leaving the
  form mid-send asks first and says the send goes on regardless. On success
  the feed reloads from the top with the new piece first and says "¡Graffiti
  publicado!" only once it is on screen — the old toast fired over a feed
  still loading, and the feed never reloaded because Ionic keeps the page
  alive. A dropped connection keeps the photos, category and position and
  offers a retry.
- The feed loads the `md` photo variant (700px, ~112 KB) instead of `lg`
  (1900px, ~536 KB), recreates the `<img>` per photo so a swipe never leaves
  the previous photo on screen, shows a loading state until the photo is in,
  says so in the slot when a photo fails, and preloads the previous/next photo
  and the first photo of the next artwork.

- Logging out revokes the session again — it had never revoked anything. The
  request left without an `Authorization` header, the server answered 401, and
  `AuthService.logout()` swallowed the error inside the `catch` that exists so a
  dead network still clears the device. The user saw a perfectly normal logout
  while the refresh token stayed valid on the server for another 30 days. Found
  on a device: `POST /api/v1/auth/logout` answered 401 on every attempt while the
  access token was still live in `personal_access_tokens`.

  The cause was not the call but the flag it used. `SKIP_AUTH` meant two things
  at once — "do not attach the token" and "do not refresh on a 401". Login,
  register and refresh want both; logout wants only the second, and with a single
  switch it had to pick the wrong one. Simply dropping the flag from logout would
  have been worse than the bug: a 401 would then reach the refresh path and mint
  a fresh token pair at the moment the user asked to have none. The flag is now
  two — `SKIP_TOKEN` and `SKIP_REFRESH` — and logout sets only the latter

### Changed
- **Logging out now ends the session on every device of the account**, not just
  the one you tapped it on. This is a decision, not a side effect: logging out is
  the only control a user has when they lend their phone or think someone saw
  their screen, and a per-device logout leaves open exactly what they meant to
  close. Revoking too much is recoverable by signing in again; revoking too
  little is not. The profile screen says so next to the button


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
- `@aparajita/capacitor-secure-storage` 3.0.2 → 5.2.0, the latest release of the
  line that depends on Capacitor 5. The plugin declares Capacitor in
  `dependencies` rather than `peerDependencies`, so npm was installing a nested
  `@capacitor/core@4.8.2` alongside the project's 5.7.8 and marking the plugin's
  `@capacitor/ios@4.8.2` as `invalid`. The Android side was already fine — the
  plugin's Gradle module compiles against `project(':capacitor-android')`, so the
  APK used Capacitor 5 — but the JavaScript bundle shipped a second copy of
  Capacitor, and generating the iOS platform would have produced a Podfile
  mixing Capacitor 4 and 5. The plugin holds the access and refresh tokens, so
  it is not a dependency to leave drifting. No application code changed: `get`,
  `set` and `remove` keep the same signatures, the new parameters are optional,
  and the key names are untouched. It will drift again the day Capacitor itself
  is upgraded — that upgrade has to include this plugin in its scope from the
  start
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
