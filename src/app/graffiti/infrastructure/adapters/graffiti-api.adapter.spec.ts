import { environment } from 'src/environments/environment';
import {
  GraffitiDetailDto, GraffitiDto, GraffitiPhotoDto, toGraffiti, toGraffitiDetail,
} from './graffiti-api.adapter';

function photo(id: string, stem: string): GraffitiPhotoDto {
  return {
    id,
    files: {
      lg: `/gmuseo/graffitis/${stem}_1900.jpg`,
      md: `/gmuseo/graffitis/${stem}_700.jpg`,
      sm: `/gmuseo/graffitis/${stem}_350.jpg`,
      thumb: `/gmuseo/graffitis/${stem}_150.jpg`,
    },
    created_at: '2026-05-17T07:03:35.000000Z',
  };
}

/** A listing element, as GET /graffitis returns it. */
function dto(overrides: Partial<GraffitiDto> = {}): GraffitiDto {
  return {
    id: 'a20c46cf-836b-42d8-9a96-67189aa8490f',
    category: 'a20c46cf-596c-4481-a214-ec3f025b83a8',
    artist: { id: 'a20c46cf-2c90-4a40-b83b-d5fa7755a33e', name: 'Artur Artist' },
    latitude: -5.625272,
    longitude: 65.357251,
    created_at: '2026-05-17T07:03:35.000000Z',
    vote: 1,
    active: true,
    cover: '/gmuseo/graffitis/cover_700.jpg',
    photos: [
      photo('a20c46cf-9670-4025-82f4-80e63c4accc8', 'photo'),
      photo('a20c46cf-9671-4025-82f4-80e63c4accc9', 'older'),
    ],
    photos_count: 2,
    ...overrides,
  };
}

/** The same artwork read on its own, with its sightings. */
function detailDto(overrides: Partial<GraffitiDetailDto> = {}): GraffitiDetailDto {
  return {
    ...dto(),
    sightings: [
      {
        id: 'a20c46cf-9586-4703-aa52-fda662272d2e',
        spotted_by: 'Artur Artist',
        spotted_at: '2026-05-17T07:03:35.000000Z',
        state: 'intact',
        description: 'Qui fuga illum dolore nihil.',
        photos: [
          {
            ...photo('a20c46cf-9670-4025-82f4-80e63c4accc8', 'photo'),
            owner: 'Artur Artist',
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
    expect(graffiti.createdAt).toBe('2026-05-17T07:03:35.000000Z');
    expect(graffiti.vote).toBe(1);
  });

  /**
   * A graffiti is the work on the wall and has no canonical title. The columns
   * `title`, `description` and `slug` were dropped from `graffitis`; free text
   * belongs to the sighting. Reintroducing any of them on the client is a
   * contract deviation, so the mapped shape is asserted field by field.
   *
   * No `sightings` either: a listing element does not carry them, and the type
   * says so instead of leaving an empty array that could mean "not loaded".
   */
  it('exposes the flattened listing shape and nothing else', () => {
    const graffiti = toGraffiti(dto());

    expect(Object.keys(graffiti).sort()).toEqual([
      'active',
      'artist',
      'category',
      'cover',
      'createdAt',
      'id',
      'latitude',
      'longitude',
      'photos',
      'photosCount',
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

  it('treats identifiers as opaque strings', () => {
    const graffiti = toGraffiti(dto());

    expect(typeof graffiti.id).toBe('string');
    expect(typeof graffiti.category).toBe('string');
    expect(typeof graffiti.photos[0].id).toBe('string');
  });

  describe('photos', () => {
    it('keeps every photo in the order the API gives, with the count the API gives', () => {
      const graffiti = toGraffiti(dto());

      expect(graffiti.photos.map((p) => p.id)).toEqual([
        'a20c46cf-9670-4025-82f4-80e63c4accc8',
        'a20c46cf-9671-4025-82f4-80e63c4accc9',
      ]);
      expect(graffiti.photosCount).toBe(2);
    });

    /**
     * The dots are drawn from `photos_count`, so the number must be carried as
     * the API states it and never recomputed here — if the two ever disagree,
     * that is the API's bug to surface, not the client's to hide.
     */
    it('carries photos_count through without deriving it from photos', () => {
      const graffiti = toGraffiti(dto({ photos_count: 7 }));

      expect(graffiti.photosCount).toBe(7);
      expect(graffiti.photos.length).toBe(2);
    });

    it('re-roots every photo variant on the configured media host', () => {
      const { files } = toGraffiti(dto()).photos[0];

      expect(files.lg).toBe(`${environment.mediaUrl}/gmuseo/graffitis/photo_1900.jpg`);
      expect(files.md).toBe(`${environment.mediaUrl}/gmuseo/graffitis/photo_700.jpg`);
      expect(files.sm).toBe(`${environment.mediaUrl}/gmuseo/graffitis/photo_350.jpg`);
      expect(files.thumb).toBe(`${environment.mediaUrl}/gmuseo/graffitis/photo_150.jpg`);
    });

    it('survives an artwork with no photos', () => {
      const graffiti = toGraffiti(dto({ photos: [], photos_count: 0 }));

      expect(graffiti.photos).toEqual([]);
      expect(graffiti.photosCount).toBe(0);
    });

    /** The listing is public: a photo on it names nobody, whatever the payload says. */
    it('carries no uploader on a listing photo', () => {
      const rogue = { ...dto(), photos: [{ ...photo('x', 'x'), owner: 'Artur Artist' }] };

      const { photos } = toGraffiti(rogue as GraffitiDto);

      expect(Object.keys(photos[0]).sort()).toEqual(['createdAt', 'files', 'id']);
    });
  });

  describe('createdAt', () => {
    /**
     * A legacy artwork may have no date. That is `null`, one value the screen
     * branches on — never `undefined`, never an empty string that would render
     * as a blank where a date should be.
     */
    it('resolves an absent created_at to null, never undefined or empty', () => {
      const withoutDate = { ...dto() } as Partial<GraffitiDto>;
      delete withoutDate.created_at;

      const graffiti = toGraffiti(withoutDate as GraffitiDto);

      expect(graffiti.createdAt).toBeNull();
      expect(graffiti.createdAt).not.toBeUndefined();
      expect(graffiti.createdAt).not.toBe('');
    });

    it('keeps an explicit null as null', () => {
      expect(toGraffiti(dto({ created_at: null })).createdAt).toBeNull();
    });
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
});

describe('toGraffitiDetail', () => {
  it('is the listing element plus its sightings', () => {
    const detail = toGraffitiDetail(detailDto());

    expect(detail.photosCount).toBe(2);
    expect(detail.sightings.length).toBe(1);
    expect(detail.sightings[0].photos[0].owner).toBe('Artur Artist');
  });

  it('keeps free text on the sighting, not on the graffiti', () => {
    const detail = toGraffitiDetail(detailDto());

    expect(detail.sightings[0].description).toBe('Qui fuga illum dolore nihil.');
    expect('description' in detail).toBe(false);
  });

  it('survives a graffiti with no sightings', () => {
    expect(toGraffitiDetail(detailDto({ sightings: [] })).sightings).toEqual([]);
  });
});
