import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SubmissionRepository } from '../domain/submission.repository';
import { NewGraffiti } from '../domain/models/submission.model';
import { API_BASE_URL } from '../../shared/infrastructure/api.config';

// TODO(backend): confirm create response shape + picture field name. Assumed:
//   - create returns the new resource under `data` (matches the auth refactor's
//     "all payloads under data" convention); we read `data.id`.
//   - pictures endpoint accepts multipart `files[]`.
interface CreatedGraffiti {
  id: string;
}

@Injectable()
export class HttpSubmissionRepository extends SubmissionRepository {
  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);

  async create(graffiti: NewGraffiti): Promise<string> {
    const res = await firstValueFrom(
      this.http.post<{ data?: CreatedGraffiti } & Partial<CreatedGraffiti>>(
        `${this.baseUrl}/v1/graffiti/create`,
        {
          category: graffiti.category,
          latitude: graffiti.latitude,
          longitude: graffiti.longitude,
        }
      )
    );
    const id = res.data?.id ?? res.id;
    if (!id) {
      throw new Error('La respuesta de creación no incluyó un id.');
    }
    return id;
  }

  async uploadPictures(graffitiId: string, files: Blob[]): Promise<void> {
    const form = new FormData();
    files.forEach((file, i) => form.append('files[]', file, `graffiti-${i}.jpg`));
    // NOTE: multipart via HttpClient. On web this works as-is. On native,
    // CapacitorHttp (enabled globally) mangles FormData — TODO: route this one
    // request around CapacitorHttp (or use a native upload) once a device
    // platform is added. No Content-Type set on purpose: the browser adds the
    // multipart boundary.
    await firstValueFrom(
      this.http.post<void>(`${this.baseUrl}/v1/graffitis/${graffitiId}/pictures`, form)
    );
  }
}
