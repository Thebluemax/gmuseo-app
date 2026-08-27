import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, map } from 'rxjs';
import { SubmissionRepository } from '../domain/submission.repository';
import { Artist, NewGraffiti, UnauthorizedError } from '../domain/models/submission.model';
import { API_BASE_URL } from '../../shared/infrastructure/api.config';
import { SecureTokenStorage } from '../../auth/domain/token-storage';

interface CreatedGraffiti {
  id: string;
}

interface ArtistDto {
  id: string;
  name: string;
}

@Injectable()
export class HttpSubmissionRepository extends SubmissionRepository {
  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);
  private tokenStorage = inject(SecureTokenStorage);

  async create(graffiti: NewGraffiti, files: Blob[]): Promise<string> {
    const form = new FormData();
    form.append('category', graffiti.category);
    // Omit artist_id when unset: the /artists list can be unavailable, and the
    // server assigns the anonymous artist when it is absent.
    if (graffiti.artistId) form.append('artist_id', graffiti.artistId);
    form.append('latitude', String(graffiti.latitude));
    form.append('longitude', String(graffiti.longitude));
    if (graffiti.state) form.append('state', graffiti.state);
    if (graffiti.description) form.append('description', graffiti.description);
    files.forEach((file, i) => form.append('files[]', file, `graffiti-${i}.jpg`));

    // Single multipart create (graffiti + first sighting + photos).
    //
    // CapacitorHttp (enabled globally) serializes request bodies as strings on
    // native, which corrupts the binary image parts of a multipart FormData.
    // Bypass it for this upload by using the WebView's original fetch, which
    // CapacitorHttp preserves as `CapacitorWebFetch`. On web that global is
    // absent, so we fall back to the real `fetch`. The API sends CORS headers
    // for the app origin (https://localhost), so the cross-origin upload from
    // the WebView is allowed. No Content-Type is set: fetch adds the multipart
    // boundary itself.
    const rawFetch: typeof fetch =
      (globalThis as unknown as { CapacitorWebFetch?: typeof fetch }).CapacitorWebFetch ??
      globalThis.fetch;

    const headers: Record<string, string> = { Accept: 'application/json' };
    const token = await this.tokenStorage.getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await rawFetch(`${this.baseUrl}/v1/graffitis`, {
      method: 'POST',
      headers,
      body: form,
    });
    // The bypass fetch skips authInterceptor, so surface a dead session as a
    // typed error the page can turn into a forced logout.
    if (response.status === 401) {
      throw new UnauthorizedError();
    }
    if (!response.ok) {
      throw new Error(`La creación del graffiti falló (HTTP ${response.status}).`);
    }
    const body = (await response.json()) as { data?: CreatedGraffiti };
    const id = body.data?.id;
    if (!id) throw new Error('La respuesta de creación no incluyó un id.');
    return id;
  }

  listArtists(): Promise<Artist[]> {
    return firstValueFrom(
      this.http
        .get<ArtistDto[] | { data: ArtistDto[] }>(`${this.baseUrl}/v1/artists`)
        .pipe(map((res) => (Array.isArray(res) ? res : res.data)))
    );
  }
}
