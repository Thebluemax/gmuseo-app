import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { GeolocationPort } from '../domain/ports/geolocation.port';
import { Coordinates } from '../domain/models/submission.model';

@Injectable()
export class GeolocationNative extends GeolocationPort {
  async getCurrentPosition(): Promise<Coordinates> {
    let status = await Geolocation.checkPermissions();
    if (status.location !== 'granted') {
      status = await Geolocation.requestPermissions({ permissions: ['location'] });
    }
    if (status.location !== 'granted') {
      throw new Error('Location permission denied');
    }
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  }
}
