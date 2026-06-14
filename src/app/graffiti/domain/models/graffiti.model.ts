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
  latitude: number;
  longitude: number;
  vote: number;
  active: boolean;
  cover: string;
  sightings: GraffitiSighting[];
}
