import { Injectable } from '@angular/core';
import { GeolocationPort } from '../domain/ports/geolocation.port';
import { Coordinates } from '../domain/models/submission.model';

@Injectable()
export class GeolocationWeb extends GeolocationPort {
  getCurrentPosition(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no disponible en este dispositivo.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => reject(new Error(err.message || 'No se pudo obtener la ubicación.')),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }
}
