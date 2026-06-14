import { Injectable } from '@angular/core';
import { CameraPort } from '../domain/ports/camera.port';
import { CapturedPhoto } from '../domain/models/submission.model';
import { compressImage } from './image.util';

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
      input.onchange = async () => {
        const files = Array.from(input.files ?? []);
        if (files.length === 0) {
          reject(new Error('No se seleccionó ninguna imagen.'));
          return;
        }
        try {
          const photos = await Promise.all(
            files.map(async (file) => {
              const blob = await compressImage(file);
              return {
                blob,
                previewUrl: URL.createObjectURL(blob),
                fileName: 'graffiti.jpg',
              };
            })
          );
          resolve(photos);
        } catch (err) {
          reject(err instanceof Error ? err : new Error('No se pudo procesar la imagen.'));
        }
      };
      input.click();
    });
  }
}
