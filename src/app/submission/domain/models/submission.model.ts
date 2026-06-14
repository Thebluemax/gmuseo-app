export interface Coordinates {
  latitude: number;
  longitude: number;
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

/**
 * Payload to create a graffiti. Per the confirmed write contract the SPA sends
 * only category + coordinates; the photo is uploaded in a second step.
 */
export interface NewGraffiti {
  category: string; // UUID
  latitude: number;
  longitude: number;
}
