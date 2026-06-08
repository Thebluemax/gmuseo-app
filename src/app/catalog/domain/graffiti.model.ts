export interface GraffitiGallery {
  id: string;
  url: string;
  size: string;
}

export interface Graffiti {
  id: string;
  title: string;
  description: string;
  type: string;
  latitude: string;
  longitude: string;
  galleries: GraffitiGallery[];
}
