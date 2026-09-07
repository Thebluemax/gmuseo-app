/**
 * Production build. The API is the Swarm stack on vps-f53, published by Traefik
 * under `Host(gmuseo.maximilianofernandez.net) && PathPrefix(/api)` — that host
 * and no other. It used to say `api.gmuseo...`, which was the Kubernetes
 * cluster's ingress; that cluster is off and nothing answers there, so a
 * release built before this change could not reach the API at all.
 *
 * The path keeps the `/api` suffix: the proxy strips no prefix and Laravel's
 * routes live at /api/v1/...
 */
export const environment = {
  production: true,
  appName: "Gmuseo",
  apiUrl: "https://gmuseo.maximilianofernandez.net/api",
  mediaUrl: "https://pub-4d6737931296461eae081ca6bdb80b9e.r2.dev",
};
