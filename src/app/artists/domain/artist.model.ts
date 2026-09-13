/**
 * A catalogue artist: whoever painted a piece. Not an account — an artist has
 * no credentials and may be a real person, a crew, a historical tag or an
 * invented name. Unknown authorship is the absence of an artist, never a
 * placeholder one, so nothing here is ever a stand-in for "unknown".
 *
 * The API deliberately publishes no link between an artist and a platform
 * account, so this model carries no account field of any kind.
 */
export interface Artist {
  id: string;
  name: string;
  bio: string | null;
  instagram: string | null;
  website: string | null;
  graffitiCount: number;
}

/** The artist of a piece as it travels inside a graffiti: label and link, nothing else. */
export interface ArtistRef {
  id: string;
  name: string;
}
