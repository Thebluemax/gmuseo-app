import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { GeolocationPort } from '../domain/ports/geolocation.port';
import { Coordinates } from '../domain/models/submission.model';

@Injectable()
export class GeolocationNative extends GeolocationPort {
  async getCurrentPosition(): Promise<Coordinates> {
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  }
}
