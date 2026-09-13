import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { Observable, catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from '../application/auth.service';
import { API_BASE_URL } from '../../shared/infrastructure/api.config';
import { RETRIED, SKIP_REFRESH, SKIP_TOKEN } from './auth.http-context';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const apiBase = inject(API_BASE_URL);

  // Only touch requests aimed at the API (leave media/asset requests alone).
  if (!req.url.startsWith(apiBase)) {
    return next(req);
  }

  // Force Accept on every API call — without it the backend 302-redirects
  // instead of returning JSON (known bug).
  let apiReq = req.clone({ setHeaders: { Accept: 'application/json' } });

  // Two separate decisions: whether to attach the token, and whether a 401 may
  // be recovered by refreshing. Logout wants the first and not the second.
  const skipToken = apiReq.context.get(SKIP_TOKEN);
  const skipRefreshOn401 = apiReq.context.get(SKIP_REFRESH);
  if (!skipToken) {
    const token = auth.accessToken();
    if (token) {
      apiReq = apiReq.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }
  }

  return next(apiReq).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse)) {
        return throwError(() => err);
      }
      // Auth endpoints (login/register/refresh/logout) handle their own failures
      // (422 bad-creds, refresh 401, logout on an already-dead token, etc.).
      if (skipRefreshOn401) {
        return throwError(() => err);
      }
      // 403 = token lacks the required ability (dead/invalid session). Not
      // recoverable by refresh — tear the session down, do not retry.
      if (err.status === 403) {
        return from(auth.forceLogout()).pipe(switchMap(() => throwError(() => err)));
      }
      if (err.status !== 401) {
        return throwError(() => err);
      }
      // Already retried once after a refresh → token still rejected → logout.
      if (apiReq.context.get(RETRIED)) {
        return from(auth.forceLogout()).pipe(switchMap(() => throwError(() => err)));
      }
      return handle401(apiReq, next, auth, err);
    })
  );
};

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  auth: AuthService,
  originalError: HttpErrorResponse
): Observable<HttpEvent<unknown>> {
  // Single-flight: concurrent 401s all await the same refresh promise.
  return from(auth.refresh()).pipe(
    switchMap((newToken) => {
      if (!newToken) {
        // Refresh failed; AuthService.forceLogout already ran.
        return throwError(() => originalError);
      }
      req.context.set(RETRIED, true);
      const retried = req.clone({
        setHeaders: { Authorization: `Bearer ${newToken}` },
      });
      return next(retried);
    })
  );
}
