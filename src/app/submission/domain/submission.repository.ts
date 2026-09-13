import { Artist, NewGraffiti } from './models/submission.model';

/**
 * How much of the request body has left the device. `sent === total` is the
 * moment the server has everything and the wait becomes its processing; the
 * repository reports it once even when no finer progress is available.
 */
export interface UploadProgress {
  sent: number;
  total: number;
}

export type UploadProgressListener = (progress: UploadProgress) => void;

export abstract class SubmissionRepository {
  /**
   * Creates a graffiti with its first sighting and photos in one multipart
   * request. Returns the new graffiti id. `onProgress`, when given, hears the
   * body leave the device; a real upload takes tens of seconds and the person
   * must be able to tell sending from waiting.
   */
  abstract create(graffiti: NewGraffiti, files: Blob[], onProgress?: UploadProgressListener): Promise<string>;
  /** Artists for the submission picker. */
  abstract listArtists(): Promise<Artist[]>;
}
