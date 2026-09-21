[![Testing](https://github.com/Thebluemax/gmuseo-app/actions/workflows/linter-unit-test.yml/badge.svg?branch=main)](https://github.com/Thebluemax/gmuseo-app/actions/workflows/linter-unit-test.yml)

# G-Museo app

Mobile client of G-Museo, a graffiti museum: browse the collection by
category, find a piece in the street, photograph it and share it with its
coordinates. Angular 21 + Ionic 8 + Capacitor 5; the same bundle runs as an
Android/iOS app and in the browser. Architecture and API notes for
contributors live in [CLAUDE.md](CLAUDE.md); what changed and why, in
[CHANGELOG.md](CHANGELOG.md).

```bash
npm start            # dev server through the ng-serve proxy (proxy.conf.json)
npm run build:prod   # production AOT build → www/
npm run test:prod    # headless Chrome, single run, with coverage
npm run lint
npx cap sync && npx cap open android   # after build:prod
```

## Which server the app talks to

The app knows one thing: the origin of the API it is connected to. Every
build carries a default (`environment.apiUrl`: `/api` through the proxy in
dev, `https://gmuseo.maximilianofernandez.net/api` in prod), and the device
may override it from the login screen — **Servidor → Cambiar servidor**. The
choice is persisted in Capacitor Preferences and survives restarts; picking
the build default again drops the entry.

Rules the screen enforces before saving anything:

- absolute URL; the origin is enough, `/api` is appended when missing;
- `https`, except for the cleartext hosts the APK is allowed to reach in
  plain text (`shared/domain/cleartext-hosts.ts`, mirrored from
  `android/app/src/main/res/xml/network_security_config.xml` — change both
  together). An `http` server outside that list is refused, and an active
  `http` server is flagged on screen;
- the server has to answer `GET /api/v1/version`; if it does not, nothing is
  saved and the screen says why.

Changing the server with a session open logs out on the old server and
clears the tokens before the first request to the new one.

## Where the photos come from

The app does not know a media host. Photo URLs (`cover`, `files.lg|md|sm|thumb`)
are used exactly as the API publishes them, absolute or relative, and the
adapter never re-roots them. Where they live is the backend's decision: its
`AWS_URL` is what `Storage::url()` prefixes to every object path.

- Production publishes `https://gmuseo.maximilianofernandez.net/media/…`,
  the API's own host, which reverse-proxies the bucket with a disk cache.
- Pointing the app at a backend on your machine (`lan`, see below), the
  photos come from that backend's `AWS_URL` — `http://<ip>/media/…` once
  its nginx proxies MinIO — and nothing in the app has to change.

There is no host baked into the build for photos and there must not be one
again: when there was, moving the media on the server changed nothing in the
app.

## The `lan` build

`environment.lan.ts` used to be the way to point a phone at the backend on
the developer's machine. It is no longer needed for that: with the
production APK, open the login screen and change the server to
`http://<machine ip>/api`. The build is kept for the two things that live
in the Android project rather than in the bundle:

- the cleartext whitelist in `network_security_config.xml` — Android blocks
  plain `http` to any host not listed there, whatever the app asks;
- the `http` page scheme (`npm run sync:lan` sets `GMUSEO_LAN=1`, which
  `capacitor.config.ts` reads), so that plain-`http` photos are not mixed
  content on the page.

```bash
npm run android:lan   # build:lan + sync:lan
```

If the machine's LAN address changes, update `environment.lan.ts`,
`network_security_config.xml` and `cleartext-hosts.ts` together.
