// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  appName: "Gmuseo",
  // Relative in dev so the ng-serve proxy (proxy.conf.json) forwards to the API
  // and avoids cross-origin CORS. Prod/native use the absolute URL.
  //
  // No media host: photos come with the URL the backend publishes (its
  // `AWS_URL`), so whichever server this points at decides where its photos
  // live. This is the build default only — the device may override it from
  // the login screen (see `ServerConfig`).
  apiUrl: "/api",
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
