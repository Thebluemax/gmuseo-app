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
