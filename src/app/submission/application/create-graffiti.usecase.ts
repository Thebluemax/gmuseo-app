import { inject, Injectable } from '@angular/core';
import { SubmissionRepository } from '../domain/submission.repository';
import { CapturedPhoto, Coordinates } from '../domain/models/submission.model';

export interface CreateGraffitiInput {
  category: string;
  coordinates: Coordinates;
  photos: CapturedPhoto[];
}

export interface CreateGraffitiResult {
  id: string;
  /** false when the graffiti was created but the picture upload failed. */
  uploaded: boolean;
}

@Injectable({ providedIn: 'root' })
export class CreateGraffitiUseCase {
  private repo = inject(SubmissionRepository);

  async execute(input: CreateGraffitiInput): Promise<CreateGraffitiResult> {
    const id = await this.repo.create({
      category: input.category,
      latitude: input.coordinates.latitude,
      longitude: input.coordinates.longitude,
    });
    try {
      await this.repo.uploadPictures(id, input.photos.map((p) => p.blob));
      return { id, uploaded: true };
    } catch {
      // Graffiti exists; only the upload failed — let the page offer a retry.
      return { id, uploaded: false };
    }
  }
}
