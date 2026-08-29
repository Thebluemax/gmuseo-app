/**
 * LAN build: the app runs on a phone and talks to the backend running on the
 * developer's machine. `localhost` cannot be used here — on a device it means
 * the device itself — so both hosts are the machine's LAN address.
 *
 * The IP must match the one whitelisted for cleartext in
 * `android/app/src/main/res/xml/network_security_config.xml`; Android blocks
 * plain HTTP everywhere else. Change both together when the machine's address
 * changes.
 */
export const environment = {
  production: true,
  appName: "Gmuseo",
  apiUrl: "http://192.168.0.154/api",
  mediaUrl: "http://192.168.0.154:9000",
};
