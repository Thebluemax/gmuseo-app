import { environment } from 'src/environments/environment';
import { GraffitiDto, toGraffiti } from './graffiti-api.adapter';

function dto(overrides: Partial<GraffitiDto> = {}): GraffitiDto {
  return {
    id: 'a20c46cf-836b-42d8-9a96-67189aa8490f',
    category: 'a20c46cf-596c-4481-a214-ec3f025b83a8',
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

  it('survives a graffiti with no sightings', () => {
    const graffiti = toGraffiti(dto({ sightings: [] }));

    expect(graffiti.sightings).toEqual([]);
  });
});
