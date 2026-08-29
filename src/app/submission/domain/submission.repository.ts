import { Artist, NewGraffiti } from './models/submission.model';

export abstract class SubmissionRepository {
  /**
   * Creates a graffiti with its first sighting and photos in one multipart
   * request. Returns the new graffiti id.
   */
  abstract create(graffiti: NewGraffiti, files: Blob[]): Promise<string>;
  /** Artists for the submission picker. */
  abstract listArtists(): Promise<Artist[]>;
}
