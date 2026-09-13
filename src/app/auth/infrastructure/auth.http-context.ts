import { HttpContext, HttpContextToken } from '@angular/common/http';

/**
 * Marks a request that must NOT carry the access-token Bearer header — the
 * anonymous endpoints (login, register) and refresh, which authorizes itself
 * with the refresh token it sets by hand.
 */
export const SKIP_TOKEN = new HttpContextToken<boolean>(() => false);

/**
 * Marks a request whose 401 must NOT trigger a refresh. Every auth endpoint
 * needs this: refreshing to refresh loops, and refreshing to log out mints a
 * fresh pair at the exact moment the user asked to have none.
 */
export const SKIP_REFRESH = new HttpContextToken<boolean>(() => false);

/**
 * Set on a request after the interceptor has already retried it once following
 * a refresh. A second 401 then triggers logout instead of another refresh.
 */
export const RETRIED = new HttpContextToken<boolean>(() => false);

/**
 * The two rules used to be one flag, which forced logout to choose between
 * sending its credential and looping on refresh. It chose wrong, and logout
 * silently revoked nothing for as long as the flag existed. Keep them separate.
 */
export function skipAuth(): HttpContext {
  return new HttpContext().set(SKIP_TOKEN, true).set(SKIP_REFRESH, true);
}

/** Send the access token, but never refresh on a 401. Used by logout. */
export function skipRefresh(): HttpContext {
  return new HttpContext().set(SKIP_REFRESH, true);
}
