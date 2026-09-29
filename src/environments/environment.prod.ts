/**
 * Production build. The API is the Swarm stack on vps-f53, published by Traefik
 * under `Host(gmuseo.maximilianofernandez.net) && PathPrefix(/api)` — that host
 * and no other. It used to say `api.gmuseo...`, which was the Kubernetes
 * cluster's ingress; that cluster is off and nothing answers there, so a
 * release built before this change could not reach the API at all.
 *
 * The path keeps the `/api` suffix: the proxy strips no prefix and Laravel's
 * routes live at /api/v1/...
 *
 * No media host: photo URLs are used as the API publishes them. The build used
 * to re-root them on `r2.dev`, a Cloudflare address that Spanish operators
 * block on match days; where the photos live is the server's decision
 * (`/media/` behind the same host), not the app's.
 */
export const environment = {
  production: true,
  appName: "Gmuseo",
  apiUrl: "https://gmuseo.maximilianofernandez.net/api",
};
