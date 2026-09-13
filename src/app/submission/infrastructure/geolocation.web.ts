import { Injectable } from '@angular/core';
import { GeolocationPort } from '../domain/ports/geolocation.port';
import { Coordinates, LocationError } from '../domain/models/submission.model';

/** How long to wait for a fix before telling the person to try again. */
export const POSITION_TIMEOUT_MS = 10000;

@Injectable()
export class GeolocationWeb extends GeolocationPort {
  getCurrentPosition(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new LocationError('unavailable', 'Geolocalización no disponible en este dispositivo.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => reject(toLocationError(err)),
        { enableHighAccuracy: true, timeout: POSITION_TIMEOUT_MS }
      );
    });
  }
}

/**
 * The browser reports the three cases as numeric codes. They map one to one:
 * denied by the person, no position obtainable (location switched off, no
 * provider), or no fix within the timeout.
 */
function toLocationError(err: GeolocationPositionError): LocationError {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return new LocationError('permission_denied', err.message);
    case err.TIMEOUT:
      return new LocationError('timeout', err.message);
    default:
      return new LocationError('unavailable', err.message);
  }
}
