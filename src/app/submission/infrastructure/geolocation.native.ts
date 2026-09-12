import { inject, Injectable, InjectionToken } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { GeolocationPort } from '../domain/ports/geolocation.port';
import { Coordinates, LocationError } from '../domain/models/submission.model';
import { POSITION_TIMEOUT_MS } from './geolocation.web';

/** The three plugin calls this adapter makes. */
export type GeolocationPlugin = Pick<
  typeof Geolocation, 'checkPermissions' | 'requestPermissions' | 'getCurrentPosition'
>;

/**
 * The Capacitor plugin behind a token, so the error mapping can be exercised
 * off-device: the plugin object is a proxy that cannot be spied on.
 */
export const GEOLOCATION_PLUGIN = new InjectionToken<GeolocationPlugin>('GEOLOCATION_PLUGIN', {
  providedIn: 'root',
  factory: () => Geolocation,
});

@Injectable()
export class GeolocationNative extends GeolocationPort {
  private plugin = inject(GEOLOCATION_PLUGIN);

  async getCurrentPosition(): Promise<Coordinates> {
    let status = await this.plugin.checkPermissions();
    if (status.location !== 'granted') {
      status = await this.plugin.requestPermissions({ permissions: ['location'] });
    }
    if (status.location !== 'granted') {
      throw new LocationError('permission_denied', 'Location permission denied');
    }

    // The plugin's `timeout` option tunes the update interval on Android but
    // never rejects, so the wait is bounded here: a fix that does not arrive in
    // time is its own case, and the person is told to try again.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new LocationError('timeout', 'No position within the time limit')),
        POSITION_TIMEOUT_MS
      );
    });

    try {
      const pos = await Promise.race([
        this.plugin.getCurrentPosition({ enableHighAccuracy: true, timeout: POSITION_TIMEOUT_MS }),
        timeout,
      ]);
      return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    } catch (err) {
      throw err instanceof LocationError ? err : toLocationError(err);
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * The plugin rejects with a message, not a code. The strings are the plugin's
 * own ("Location services are not enabled", "location disabled", "Location
 * permission was denied"); anything else means no position could be obtained.
 */
function toLocationError(err: unknown): LocationError {
  const message = err instanceof Error ? err.message : String(err);
  if (/permission/i.test(message)) return new LocationError('permission_denied', message);
  return new LocationError('unavailable', message);
}
