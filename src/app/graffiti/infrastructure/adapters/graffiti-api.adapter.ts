import {
  Graffiti, GraffitiDetail, GraffitiPhoto, GraffitiSighting, PhotoFiles, SightingPhoto,
} from '../../domain/models/graffiti.model';
import { ArtistRef } from '../../../artists/domain/artist.model';

export interface PhotoFilesDto {
  lg: string;
  md: string;
  sm: string;
  thumb: string;
}

export interface GraffitiPhotoDto {
  id: string;
  files: PhotoFilesDto;
  created_at: string;
}

export interface SightingPhotoDto extends GraffitiPhotoDto {
  owner: string;
  updated_at: string;
}

export interface GraffitiSightingDto {
  id: string;
  spotted_by: string;
  spotted_at: string;
  state: string;
  description: string | null;
  photos: SightingPhotoDto[];
}

export interface ArtistRefDto {
  id: string;
  name: string;
}

/** An element of GET /graffitis. */
export interface GraffitiDto {
  id: string;
  category: string;
  artist: ArtistRefDto | null;
  latitude: number;
  longitude: number;
  created_at: string | null;
  vote: number;
  active: boolean;
  cover: string;
  photos: GraffitiPhotoDto[];
  photos_count: number;
}

/** The body of GET /graffitis/{id}: the listing element plus its sightings. */
export interface GraffitiDetailDto extends GraffitiDto {
  sightings: GraffitiSightingDto[];
}

/**
 * Photo URLs are copied as the API publishes them. The backend decides where
 * its media lives (`AWS_URL` → `Storage::url()`), so the same build follows
 * whichever server it is pointed at; the client must not re-root them on a host
 * of its own. A relative path stays relative — inventing a host here would be
 * the old bug back.
 */
export function toGraffiti(dto: GraffitiDto): Graffiti {
  return {
    id: dto.id,
    category: dto.category,
    artist: toArtistRef(dto.artist),
    latitude: dto.latitude,
    longitude: dto.longitude,
    // Absent and null both mean "no date recorded": one value for the screen
    // to branch on, never undefined or an empty string.
    createdAt: dto.created_at ?? null,
    vote: dto.vote,
    active: dto.active,
    cover: dto.cover,
    photos: (dto.photos ?? []).map(toPhoto),
    photosCount: dto.photos_count,
  };
}

export function toGraffitiDetail(dto: GraffitiDetailDto): GraffitiDetail {
  return {
    ...toGraffiti(dto),
    sightings: (dto.sightings ?? []).map(toSighting),
  };
}

/**
 * Unknown authorship stays `null`. An absent or malformed artist collapses to
 * the same thing rather than to `undefined`, so a template only ever branches
 * on one value.
 */
function toArtistRef(dto: ArtistRefDto | null | undefined): ArtistRef | null {
  if (!dto?.id) return null;

  return { id: dto.id, name: dto.name };
}

function toSighting(dto: GraffitiSightingDto): GraffitiSighting {
  return {
    id: dto.id,
    spottedBy: dto.spotted_by,
    spottedAt: dto.spotted_at,
    state: dto.state,
    description: dto.description,
    photos: (dto.photos ?? []).map(toSightingPhoto),
  };
}

function toPhoto(dto: GraffitiPhotoDto): GraffitiPhoto {
  return {
    id: dto.id,
    files: toFiles(dto.files),
    createdAt: dto.created_at,
  };
}

function toSightingPhoto(dto: SightingPhotoDto): SightingPhoto {
  return {
    ...toPhoto(dto),
    owner: dto.owner,
    updatedAt: dto.updated_at,
  };
}

function toFiles(dto: PhotoFilesDto): PhotoFiles {
  return {
    lg: dto.lg,
    md: dto.md,
    sm: dto.sm,
    thumb: dto.thumb,
  };
}
