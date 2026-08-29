import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { CameraPort } from '../domain/ports/camera.port';
import { CapturedPhoto } from '../domain/models/submission.model';
import { compressImage } from './image.util';

/** Native capture via @capacitor/camera; the Uri result is read back into a Blob for upload. */
@Injectable()
export class CameraNative extends CameraPort {
  async capturePhotos(): Promise<CapturedPhoto[]> {
    const photo = await Camera.getPhoto({
      source: CameraSource.Camera,
      resultType: CameraResultType.Uri,
      quality: 80,
    });
    const webPath = photo.webPath;
    if (!webPath) {
      throw new Error('La cámara no devolvió ninguna imagen.');
    }
    const raw = await (await fetch(webPath)).blob();
    const blob = await compressImage(raw);
    return [
      {
        blob,
        previewUrl: URL.createObjectURL(blob),
        fileName: 'graffiti.jpg',
      },
    ];
  }
}
