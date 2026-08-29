import type { Graffiti } from '../graffiti/domain/models/graffiti.model';

/**
 * Test fixtures shaped after the real API payload. A graffiti has no title,
 * name or slug: free text lives on the sighting, and every identifier is an
 * opaque UUID string.
 */
export class GraffitiMock {
  public getGraffiti(): Graffiti {
    return this.getGraffitiList()[0];
  }

  public getGraffitiList(): Graffiti[] {
    return [
      'a20c46cf-836b-42d8-9a96-67189aa8490f',
      'a20c46cf-8a12-4a70-9ad1-2f0f6d9c1a53',
      'a20c46cf-8d64-4f2e-b1c7-4a1e0d9a77b2',
      'a20c46cf-9018-4c19-8f3a-6b2d5e7c0f41',
      'a20c46cf-93bd-4d8e-a02b-8c4f1a6e3d90',
    ].map((id, index) => graffiti(id, index));
  }
}

function graffiti(id: string, index: number): Graffiti {
  const base = `http://media.test/gmuseo/graffitis/${id}`;

  return {
    id,
    category: 'a20c46cf-596c-4481-a214-ec3f025b83a8',
    // Half the fixtures are unattributed, like the real catalogue.
    artist: index % 2 === 0
      ? { id: 'a20c46cf-2c90-4a40-b83b-d5fa7755a33e', name: 'Artur Artist' }
      : null,
    latitude: 41.3874 + index / 1000,
    longitude: 2.1686 + index / 1000,
    vote: index,
    active: true,
    cover: `${base}/cover_700.jpg`,
    sightings: [
      {
        id: `a20c46cf-9586-4703-aa52-fda66227${index}d2e`.slice(0, 36),
        spottedBy: 'Artur Artist',
        spottedAt: '2026-05-17T07:03:35.000000Z',
        state: 'intact',
        description: 'Pieza en el muro del taller.',
        photos: [
          {
            id: `a20c46cf-9670-4025-82f4-80e63c4a${index}cc8`.slice(0, 36),
            files: {
              lg: `${base}/photo_1900.jpg`,
              md: `${base}/photo_700.jpg`,
              sm: `${base}/photo_350.jpg`,
              thumb: `${base}/photo_150.jpg`,
            },
            owner: 'Artur Artist',
            createdAt: '2026-05-17T07:03:35.000000Z',
            updatedAt: '2026-05-17T07:03:35.000000Z',
          },
        ],
      },
    ],
  };
}
