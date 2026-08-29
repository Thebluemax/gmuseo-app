import { ArtistRef } from '../../../artists/domain/artist.model';

export interface PhotoFiles {
  lg: string;
  md: string;
  sm: string;
  thumb: string;
}

export interface GraffitiPhoto {
  id: string;
  files: PhotoFiles;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

export type SightingState = 'painted_over' | 'visible' | string;

export interface GraffitiSighting {
  id: string;
  spottedBy: string;
  spottedAt: string;
  state: SightingState;
  description: string | null;
  photos: GraffitiPhoto[];
}

export interface Graffiti {
  id: string;
  category: string;
  /**
   * Who painted it, or `null` when authorship is unknown — the majority case in
   * street art. `null` is the real answer, not a missing value: never render a
   * placeholder artist for it.
   */
  artist: ArtistRef | null;
  latitude: number;
  longitude: number;
  vote: number;
  active: boolean;
  cover: string;
  sightings: GraffitiSighting[];
}
