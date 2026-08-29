import { Coordinates } from '../models/submission.model';

/**
 * Geolocation capability. Implemented twice: `.web.ts` (navigator.geolocation)
 * and `.native.ts` (@capacitor/geolocation). The application layer injects this
 * only.
 */
export abstract class GeolocationPort {
  abstract getCurrentPosition(): Promise<Coordinates>;
}
