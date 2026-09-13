import { ArtistRef } from '../../../artists/domain/artist.model';

export interface PhotoFiles {
  lg: string;
  md: string;
  sm: string;
  thumb: string;
}

/**
 * A photo as the artwork lists it: the capture and its variants. No uploader —
 * the listing is public and names nobody.
 */
export interface GraffitiPhoto {
  id: string;
  files: PhotoFiles;
  createdAt: string;
}

/** A photo inside a sighting, which is where attribution lives. */
export interface SightingPhoto extends GraffitiPhoto {
  owner: string;
  updatedAt: string;
}

export type SightingState = 'painted_over' | 'visible' | string;

export interface GraffitiSighting {
  id: string;
  spottedBy: string;
  spottedAt: string;
  state: SightingState;
  description: string | null;
  photos: SightingPhoto[];
}

/**
 * The artwork as the listing serves it: flattened, with its photos already
 * resolved. This is what the feed renders.
 */
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
  /**
   * When the artwork entered the system, not when anyone saw it on the wall —
   * that date is `spottedAt` on a sighting. `null` for legacy rows with no
   * date recorded; a screen omits it rather than inventing one.
   */
  createdAt: string | null;
  vote: number;
  active: boolean;
  cover: string;
  /** Every photo of the artwork, newest visit first. */
  photos: GraffitiPhoto[];
  /**
   * How many photos there are, as the API counts them. The feed draws its dots
   * from this number and never from `photos.length`.
   */
  photosCount: number;
}

/**
 * The artwork read on its own: everything the listing carries plus its
 * sightings. A separate type on purpose — an artwork from the listing has no
 * sightings, and an empty array there would mean "not loaded", which nothing
 * could tell apart from "never seen".
 */
export interface GraffitiDetail extends Graffiti {
  sightings: GraffitiSighting[];
}
