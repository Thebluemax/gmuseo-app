import { inject, Injectable } from '@angular/core';
import { SubmissionRepository } from '../domain/submission.repository';
import { CapturedPhoto, Coordinates, GraffitiState } from '../domain/models/submission.model';

export interface CreateGraffitiInput {
  category: string;
  /** Absent for unknown authorship, which is how most pieces are filed. */
  artistId?: string;
  coordinates: Coordinates;
  photos: CapturedPhoto[];
  state?: GraffitiState;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class CreateGraffitiUseCase {
  private repo = inject(SubmissionRepository);

  /** Creates the graffiti (with sighting + photos) in one request; returns its id. */
  execute(input: CreateGraffitiInput): Promise<string> {
    return this.repo.create(
      {
        category: input.category,
        artistId: input.artistId,
        latitude: input.coordinates.latitude,
        longitude: input.coordinates.longitude,
        state: input.state,
        description: input.description,
      },
      input.photos.map((p) => p.blob)
    );
  }
}
