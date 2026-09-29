/**
 * LAN build: the app runs on a phone and talks to the backend running on the
 * developer's machine. `localhost` cannot be used here — on a device it means
 * the device itself — so the host is the machine's LAN address.
 *
 * The IP must match the one whitelisted for cleartext in
 * `android/app/src/main/res/xml/network_security_config.xml`; Android blocks
 * plain HTTP everywhere else. Change both together when the machine's address
 * changes.
 *
 * Since the app can pick its server at runtime this build is no longer needed
 * to point at the LAN — the production APK can be switched to
 * `http://192.168.0.154/api` from the login screen. It is kept only because
 * the cleartext whitelist and the `http` page scheme (`npm run sync:lan`) live
 * in the Android project, not in the bundle.
 *
 * Photos: no media host here. The local backend publishes them under its own
 * `AWS_URL` (`http://<ip>/media/...` once its nginx proxies MinIO).
 */
export const environment = {
  production: true,
  appName: "Gmuseo",
  apiUrl: "http://192.168.0.154/api",
};
