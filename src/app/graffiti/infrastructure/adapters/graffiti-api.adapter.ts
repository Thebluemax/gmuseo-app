import { environment } from 'src/environments/environment';
import {
  Graffiti, GraffitiPhoto, GraffitiSighting, PhotoFiles,
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
  owner: string;
  created_at: string;
  updated_at: string;
}

export interface GraffitiSightingDto {
  id: string;
  spotted_by: string;
  spotted_at: string;
  state: string;
  description: string | null;
  photos: GraffitiPhotoDto[];
}

export interface ArtistRefDto {
  id: string;
  name: string;
}

export interface GraffitiDto {
  id: string;
  category: string;
  artist: ArtistRefDto | null;
  latitude: number;
  longitude: number;
  vote: number;
  active: boolean;
  cover: string;
  sightings: GraffitiSightingDto[];
}

/**
 * Root a media path on the configured media host. The API returns absolute
 * URLs to a legacy bucket host (bucket.gmuseo.com) that no longer serves the
 * files, so we keep only the object path and re-root it on `mediaUrl` (R2). A
 * relative path is prefixed directly.
 */
function mediaUrl(path: string): string {
  if (!path) return '';
  let rel = path;
  if (/^https?:\/\//.test(path)) {
    try {
      const u = new URL(path);
      rel = u.pathname + u.search;
    } catch {
      return path;
    }
  }
  return `${environment.mediaUrl}${rel.startsWith('/') ? '' : '/'}${rel}`;
}

export function toGraffiti(dto: GraffitiDto): Graffiti {
  return {
    id: dto.id,
    category: dto.category,
    artist: toArtistRef(dto.artist),
    latitude: dto.latitude,
    longitude: dto.longitude,
    vote: dto.vote,
    active: dto.active,
    cover: mediaUrl(dto.cover),
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
    photos: (dto.photos ?? []).map(toPhoto),
  };
}

function toPhoto(dto: GraffitiPhotoDto): GraffitiPhoto {
  return {
    id: dto.id,
    files: toFiles(dto.files),
    owner: dto.owner,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function toFiles(dto: PhotoFilesDto): PhotoFiles {
  return {
    lg: mediaUrl(dto.lg),
    md: mediaUrl(dto.md),
    sm: mediaUrl(dto.sm),
    thumb: mediaUrl(dto.thumb),
  };
}
