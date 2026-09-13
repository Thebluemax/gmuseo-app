export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Thrown when the API rejects a write with 401 — the session is dead. */
export class UnauthorizedError extends Error {
  constructor(message = 'Sesión expirada.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Thrown when the API answers 422: the request was understood and refused for
 * a reason it states. `message` is that reason, ready to show; `errors` keeps
 * the per-field detail for anyone who needs it.
 */
export class ValidationError extends Error {
  constructor(message: string, readonly errors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Why the device gave no position. Each case is resolved by a different action
 * — grant the permission, switch location on, or simply try again — so the
 * form must tell them apart instead of showing one generic failure.
 */
export type LocationFailure = 'permission_denied' | 'unavailable' | 'timeout';

export class LocationError extends Error {
  constructor(readonly reason: LocationFailure, message?: string) {
    super(message ?? reason);
    this.name = 'LocationError';
  }
}

/**
 * What one upload accepts, as `graffiti/subida-de-fotos` fixes it: up to five
 * files of up to 10 MB each. Checked here before sending so a selection the
 * server would refuse never leaves the device; the server still has the last
 * word.
 */
export const UPLOAD_LIMITS = {
  maxFiles: 5,
  maxBytesPerFile: 10 * 1024 * 1024,
} as const;

/**
 * A photo captured from the device. `blob` is what gets uploaded (multipart);
 * `previewUrl` is an object URL for showing it in the form.
 */
export interface CapturedPhoto {
  blob: Blob;
  previewUrl: string;
  fileName: string;
}

export interface Artist {
  id: string;
  name: string;
}

export type GraffitiState = 'intact' | 'damaged' | 'painted_over' | 'removed';

/**
 * Payload to record a new graffiti. The API creates the graffiti, its first
 * sighting and the photos in a single multipart request, so artist + state +
 * description live alongside category/coordinates.
 */
export interface NewGraffiti {
  category: string; // UUID
  /**
   * Catalogue artist, or absent for unknown authorship — the majority case.
   * Anonymous is *not* sending an artist: there is no anonymous artist to point
   * at, and inventing one would be a placeholder for the absence of data.
   */
  artistId?: string; // UUID
  latitude: number;
  longitude: number;
  state?: GraffitiState;
  description?: string;
}
