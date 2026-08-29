import { environment } from 'src/environments/environment';
import { GraffitiDto, toGraffiti } from './graffiti-api.adapter';

function dto(overrides: Partial<GraffitiDto> = {}): GraffitiDto {
  return {
    id: 'a20c46cf-836b-42d8-9a96-67189aa8490f',
    category: 'a20c46cf-596c-4481-a214-ec3f025b83a8',
    artist: { id: 'a20c46cf-2c90-4a40-b83b-d5fa7755a33e', name: 'Artur Artist' },
    latitude: -5.625272,
    longitude: 65.357251,
    vote: 1,
    active: true,
    cover: '/gmuseo/graffitis/cover_700.jpg',
    sightings: [
      {
        id: 'a20c46cf-9586-4703-aa52-fda662272d2e',
        spotted_by: 'Artur Artist',
        spotted_at: '2026-05-17T07:03:35.000000Z',
        state: 'intact',
        description: 'Qui fuga illum dolore nihil.',
        photos: [
          {
            id: 'a20c46cf-9670-4025-82f4-80e63c4accc8',
            files: {
              lg: '/gmuseo/graffitis/photo_1900.jpg',
              md: '/gmuseo/graffitis/photo_700.jpg',
              sm: '/gmuseo/graffitis/photo_350.jpg',
              thumb: '/gmuseo/graffitis/photo_150.jpg',
            },
            owner: 'Artur Artist',
            created_at: '2026-05-17T07:03:35.000000Z',
            updated_at: '2026-05-17T07:03:35.000000Z',
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe('toGraffiti', () => {
  it('maps the fields the API actually returns', () => {
    const graffiti = toGraffiti(dto());

    expect(graffiti.id).toBe('a20c46cf-836b-42d8-9a96-67189aa8490f');
    expect(graffiti.category).toBe('a20c46cf-596c-4481-a214-ec3f025b83a8');
    expect(graffiti.latitude).toBe(-5.625272);
    expect(graffiti.longitude).toBe(65.357251);
    expect(graffiti.vote).toBe(1);
    expect(graffiti.sightings.length).toBe(1);
  });

  /**
   * A graffiti is the work on the wall and has no canonical title. The columns
   * `title`, `description` and `slug` were dropped from `graffitis`; free text
   * belongs to the sighting. Reintroducing any of them on the client is a
   * contract deviation, so the mapped shape is asserted field by field.
   */
  it('exposes no title, name or slug on the graffiti', () => {
    const graffiti = toGraffiti(dto());

    expect(Object.keys(graffiti).sort()).toEqual([
      'active',
      'artist',
      'category',
      'cover',
      'id',
      'latitude',
      'longitude',
      'sightings',
      'vote',
    ]);
  });

  it('drops a title the API might start sending instead of passing it through', () => {
    const rogue = { ...dto(), title: 'Untitled #4', name: 'Untitled #4', slug: 'untitled-4' };

    const graffiti = toGraffiti(rogue as GraffitiDto);

    expect('title' in graffiti).toBe(false);
    expect('name' in graffiti).toBe(false);
    expect('slug' in graffiti).toBe(false);
  });

  it('keeps free text on the sighting, not on the graffiti', () => {
    const graffiti = toGraffiti(dto());

    expect(graffiti.sightings[0].description).toBe('Qui fuga illum dolore nihil.');
    expect('description' in graffiti).toBe(false);
  });

  it('treats identifiers as opaque strings', () => {
    const graffiti = toGraffiti(dto());

    expect(typeof graffiti.id).toBe('string');
    expect(typeof graffiti.category).toBe('string');
    expect(typeof graffiti.sightings[0].id).toBe('string');
  });

  it('re-roots every photo variant on the configured media host', () => {
    const { files } = toGraffiti(dto()).sightings[0].photos[0];

    expect(files.lg).toBe(`${environment.mediaUrl}/gmuseo/graffitis/photo_1900.jpg`);
    expect(files.md).toBe(`${environment.mediaUrl}/gmuseo/graffitis/photo_700.jpg`);
    expect(files.sm).toBe(`${environment.mediaUrl}/gmuseo/graffitis/photo_350.jpg`);
    expect(files.thumb).toBe(`${environment.mediaUrl}/gmuseo/graffitis/photo_150.jpg`);
  });

  it('re-roots an absolute URL pointing at the legacy bucket host', () => {
    const graffiti = toGraffiti(
      dto({ cover: 'http://bucket.gmuseo.com/gmuseo/graffitis/cover_700.jpg' })
    );

    expect(graffiti.cover).toBe(`${environment.mediaUrl}/gmuseo/graffitis/cover_700.jpg`);
  });

  describe('authorship', () => {
    it('maps the artist as a label and a link, nothing else', () => {
      const { artist } = toGraffiti(dto());

      expect(artist).toEqual({
        id: 'a20c46cf-2c90-4a40-b83b-d5fa7755a33e',
        name: 'Artur Artist',
      });
    });

    /**
     * Unknown authorship is the majority case in street art, and it is the real
     * answer, not a missing value. It must land as `null` — never `undefined`,
     * never an invented name — so a template branches on one value only.
     */
    it('resolves unknown authorship to null, never undefined', () => {
      const graffiti = toGraffiti(dto({ artist: null }));

      expect(graffiti.artist).toBeNull();
      expect(graffiti.artist).not.toBeUndefined();
    });

    it('collapses a malformed artist to null instead of a half-built one', () => {
      const graffiti = toGraffiti({ ...dto(), artist: undefined } as unknown as GraffitiDto);

      expect(graffiti.artist).toBeNull();
    });

    /**
     * The API publishes no link between an artist and a platform account. The
     * client must not carry one through even if the payload ever grew it.
     */
    it('carries no account data on the artist', () => {
      const rogue = {
        ...dto(),
        artist: {
          id: 'a20c46cf-2c90-4a40-b83b-d5fa7755a33e',
          name: 'Artur Artist',
          user_id: 'a20c46cf-0000-4000-8000-000000000000',
          username: 'artur',
        },
      };

      const { artist } = toGraffiti(rogue as GraffitiDto);

      expect(Object.keys(artist ?? {}).sort()).toEqual(['id', 'name']);
    });
  });

  it('survives a graffiti with no sightings', () => {
    const graffiti = toGraffiti(dto({ sightings: [] }));

    expect(graffiti.sightings).toEqual([]);
  });
});
