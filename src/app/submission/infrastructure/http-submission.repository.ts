import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, map } from 'rxjs';
import { SubmissionRepository } from '../domain/submission.repository';
import { Artist, NewGraffiti } from '../domain/models/submission.model';
import { API_BASE_URL } from '../../shared/infrastructure/api.config';

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

  async create(graffiti: NewGraffiti, files: Blob[]): Promise<string> {
    const form = new FormData();
    form.append('category', graffiti.category);
    form.append('artist_id', graffiti.artistId);
    form.append('latitude', String(graffiti.latitude));
    form.append('longitude', String(graffiti.longitude));
    if (graffiti.state) form.append('state', graffiti.state);
    if (graffiti.description) form.append('description', graffiti.description);
    files.forEach((file, i) => form.append('files[]', file, `graffiti-${i}.jpg`));

    // Single multipart create (graffiti + first sighting + photos). No
    // Content-Type set: the browser adds the multipart boundary.
    // NOTE: CapacitorHttp (enabled globally) mangles FormData on device —
    // TODO route this around CapacitorHttp once a native platform is added.
    const res = await firstValueFrom(
      this.http.post<{ data: CreatedGraffiti }>(`${this.baseUrl}/v1/graffitis`, form)
    );
    const id = res.data?.id;
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
