import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { Observable, from, lastValueFrom } from 'rxjs';
import { AuthService, SessionRejectedError } from '../application/auth.service';
import { API_BASE_URL } from '../../shared/infrastructure/api.config';
import { SKIP_REFRESH, SKIP_TOKEN } from './auth.http-context';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const apiBase = inject(API_BASE_URL);

  // Only touch requests aimed at the API (leave media/asset requests alone).
  if (!req.url.startsWith(apiBase)) {
    return next(req);
  }

  // Force Accept on every API call — without it the backend 302-redirects
  // instead of returning JSON (known bug).
  const apiReq = req.clone({ setHeaders: { Accept: 'application/json' } });

  // Two separate decisions: whether to attach the token, and whether a 401 may
  // be recovered by refreshing. Logout wants the first and not the second.
  const skipToken = apiReq.context.get(SKIP_TOKEN);
  const skipRefreshOn401 = apiReq.context.get(SKIP_REFRESH);

  const send = (token: string | null): Promise<HttpEvent<unknown>> =>
    lastValueFrom(next(withToken(apiReq, skipToken ? null : token)));

  // Auth endpoints (login/register/refresh/logout) handle their own failures
  // (422 bad-creds, refresh 401, logout on an already-dead token, etc.).
  if (skipRefreshOn401) {
    return from(send(auth.accessToken()));
  }

  // The renew-and-retry cycle lives in AuthService so the raw upload shares
  // it; this interceptor only says what a rejection looks like over HTTP.
  return from(
    auth.withSessionRetry(async (token) => {
      try {
        return await send(token);
      } catch (err: unknown) {
        if (err instanceof HttpErrorResponse) {
          // 403 = token lacks the required ability (dead/invalid session). Not
          // recoverable by refresh — tear the session down, do not retry.
          if (err.status === 403) {
            await auth.forceLogout();
            throw err;
          }
          if (err.status === 401) throw new SessionRejectedError(err);
        }
        throw err;
      }
    })
  ) as Observable<HttpEvent<unknown>>;
};

function withToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
}
