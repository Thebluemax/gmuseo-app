import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.gmuseo.app',
  appName: 'gmuseo',
  webDir: 'www',
  server: {
    // Serve the app from https://localhost. Prod API + media are HTTPS
    // (api.gmuseo.maximilianofernandez.net, self-signed cert trusted via
    // res/xml/network_security_config.xml), so same-scheme, no mixed content.
    // allowMixedContent stays on only for LAN dev over http (MinIO/local API);
    // those hosts are whitelisted for cleartext in the network security config.
    androidScheme: 'https',
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
