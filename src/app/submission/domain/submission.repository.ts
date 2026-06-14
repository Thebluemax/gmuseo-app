import { NewGraffiti } from './models/submission.model';

export abstract class SubmissionRepository {
  /** Creates a graffiti, returns its new id. */
  abstract create(graffiti: NewGraffiti): Promise<string>;
  /** Uploads one or more pictures to an existing graffiti (multipart files[]). */
  abstract uploadPictures(graffitiId: string, files: Blob[]): Promise<void>;
}
