import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { CameraPort } from '../domain/ports/camera.port';
import { CapturedPhoto } from '../domain/models/submission.model';

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
    const blob = await (await fetch(webPath)).blob();
    return [
      {
        blob,
        previewUrl: webPath,
        fileName: `graffiti.${photo.format ?? 'jpg'}`,
      },
    ];
  }
}
