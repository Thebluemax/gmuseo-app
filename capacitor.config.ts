import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'gmuseo',
  webDir: 'www',
  server: {
    androidScheme: 'https'
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
