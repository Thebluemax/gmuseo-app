import { CapturedPhoto } from '../models/submission.model';

/**
 * Photo capture capability. Implemented twice: `.web.ts` (file input) and
 * `.native.ts` (@capacitor/camera). The application layer injects this only.
 */
export abstract class CameraPort {
  /** Returns one or more photos (web allows multi-select; native yields one). */
  abstract capturePhotos(): Promise<CapturedPhoto[]>;
}
