import { HttpContext, HttpContextToken } from '@angular/common/http';

/**
 * Marks a request as an auth endpoint (login / refresh / logout). The
 * interceptor will NOT attach the access-token Bearer header and will NOT try
 * to refresh on a 401 for these — prevents refresh-on-refresh loops.
 */
export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);

/**
 * Set on a request after the interceptor has already retried it once following
 * a refresh. A second 401 then triggers logout instead of another refresh.
 */
export const RETRIED = new HttpContextToken<boolean>(() => false);

export function skipAuth(): HttpContext {
  return new HttpContext().set(SKIP_AUTH, true);
}
