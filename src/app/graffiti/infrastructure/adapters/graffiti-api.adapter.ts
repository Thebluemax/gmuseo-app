import { Graffiti, GraffitiGallery } from '../../domain/models/graffiti.model';

export interface GraffitiGalleryDto {
  id: string;
  url: string;
  size: string;
}

export interface GraffitiDto {
  id: string;
  title: string;
  description: string;
  type: string;
  latitude: string;
  longitude: string;
  galleries: GraffitiGalleryDto[];
}

export function toGraffiti(dto: GraffitiDto): Graffiti {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    type: dto.type,
    latitude: dto.latitude,
    longitude: dto.longitude,
    galleries: dto.galleries.map(toGallery),
  };
}

function toGallery(dto: GraffitiGalleryDto): GraffitiGallery {
  return { id: dto.id, url: dto.url, size: dto.size };
}
