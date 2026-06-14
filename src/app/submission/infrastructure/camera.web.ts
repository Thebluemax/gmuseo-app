import { Injectable } from '@angular/core';
import { CameraPort } from '../domain/ports/camera.port';
import { CapturedPhoto } from '../domain/models/submission.model';

/** Web capture via a hidden file input (`capture` hints the rear camera on mobile web). */
@Injectable()
export class CameraWeb extends CameraPort {
  capturePhotos(): Promise<CapturedPhoto[]> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.setAttribute('capture', 'environment');
      input.onchange = () => {
        const files = Array.from(input.files ?? []);
        if (files.length === 0) {
          reject(new Error('No se seleccionó ninguna imagen.'));
          return;
        }
        resolve(
          files.map((file) => ({
            blob: file,
            previewUrl: URL.createObjectURL(file),
            fileName: file.name || 'graffiti.jpg',
          }))
        );
      };
      input.click();
    });
  }
}
