import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.gmuseo.app',
  appName: 'gmuseo',
  webDir: 'www',
  server: {
    // Serve the app from https://localhost. Prod API + media are HTTPS
    // (api.gmuseo.maximilianofernandez.net, self-signed cert trusted via
    // res/xml/network_security_config.xml), so same-scheme, no mixed content.
    // https by default: production API and media are HTTPS, so page and assets
    // share a scheme and nothing is mixed content.
    //
    // GMUSEO_LAN=1 drops the page to http for LAN development only, where MinIO
    // serves media over plain http from the developer's machine. Serving the
    // page over https there makes every image blockable mixed content, and the
    // WebView blocks it even with allowMixedContent on — verified on a device.
    // Same scheme on both sides is the fix; the hosts involved are the only ones
    // whitelisted for cleartext in res/xml/network_security_config.xml.
    // Set by `npm run sync:lan`; never set for a release build.
    androidScheme: process.env['GMUSEO_LAN'] === '1' ? 'http' : 'https'
  },
  android: {
    // Belongs here, not under `server` — putting it there is silently ignored,
    // and the WebView then blocks every http asset as mixed content because the
    // page itself is served over https. Needed only for LAN development, where
    // MinIO serves media over plain http from the developer's machine; those
    // hosts are the only ones whitelisted for cleartext in
    // res/xml/network_security_config.xml.
    allowMixedContent: true
  },
  plugins: {
    // Route HttpClient requests through the native HTTP layer (outside the
    // WebView). XSS in the WebView cannot intercept these requests, and CORS
    // is bypassed so the API's `Accept: application/json` requirement holds.
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
