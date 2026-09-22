import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { AuthService } from './auth.service';
import { ServerConfig } from '../../shared/application/server-config';
import { normalizeServerUrl, ServerUrlError } from '../../shared/domain/server-url';
import { skipAuth } from '../infrastructure/auth.http-context';

/** How long the new server gets to answer the probe before it is refused. */
export const PROBE_TIMEOUT_MS = 8000;

/**
 * Point the app at another API server.
 *
 * The URL is validated, then proved live with `GET /v1/version` — the public
 * endpoint every G-Museo server answers — and only then saved. A session open
 * against the previous server is closed and its tokens wiped before the app
 * restarts on the new one, so nothing issued by one server is ever presented
 * to another. The probe itself carries no token by construction (`skipAuth`).
 */
@Injectable({ providedIn: 'root' })
export class ChangeServerUseCase {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private config = inject(ServerConfig);

  /**
   * Resolves once the server is saved and the restart has been requested.
   * Rejects with a `ServerUrlError` naming why nothing was saved.
   */
  async execute(input: string): Promise<void> {
    const url = normalizeServerUrl(input);
    if (url === this.config.apiUrl()) return;

    await this.probe(url);

    if (this.auth.isAuthenticated()) {
      await this.auth.logout();
    }
    await this.config.save(url);
    this.config.restart();
  }

  private async probe(url: string): Promise<void> {
    const versionUrl = `${url}/v1/version`;
    try {
      await firstValueFrom(
        this.http
          .get(versionUrl, { context: skipAuth(), headers: { Accept: 'application/json' } })
          .pipe(timeout(PROBE_TIMEOUT_MS))
      );
    } catch (err) {
      throw new ServerUrlError('unreachable', `${versionUrl} ${describe(err)}. No se ha guardado.`);
    }
  }
}

function describe(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'no responde';
    return `responde ${err.status}${err.status === 404 ? ' (no es una API de G-Museo)' : ''}`;
  }
  if (err instanceof Error && err.name === 'TimeoutError') {
    return `no responde en ${PROBE_TIMEOUT_MS / 1000} s`;
  }
  return 'no responde';
}
