import type { Category } from '../catalog/domain/category.model';
import type { Graffiti } from '../graffiti/domain/models/graffiti.model';
import { GraffitiMock } from './graffti.mock';

/**
 * Test fixtures shaped after `GET /api/v1/categories`, which answers with a
 * bare array of `{id, name, description}`. There is no category image: the
 * cover shown in the grid is borrowed from one of the category's graffitis.
 */
export class CategoryMock {
  public getCategoryList(): Category[] {
    return [
      {
        id: 'a20c46cf-57f4-4c1d-b358-df1c0c34e986',
        name: 'Tag',
        description:
          'Tagging is the easiest and simplest style of graffiti; it includes one colour and the artist’s name or identifier. ',
      },
      {
        id: 'a20c46cf-5866-43d8-831f-c1a3d2559d5f',
        name: 'Throw-up',
        description:
          'A throw-up is like a more complicated tag. It usually has two or more colours, and bubble-style lettering. A throw-up can be done quickly and repeatedly, just like a tag.',
      },
      {
        id: 'a20c46cf-58e0-491a-8cea-2e6b2a491be7',
        name: 'Blockbuster',
        description:
          'A blockbuster is like a massive throw-up, usually in blocky letters. Blockbusters are used to cover a large area in a small amount of time.',
      },
      {
        id: 'a20c46cf-596c-4481-a214-ec3f025b83a8',
        name: 'Wildstyle',
        description:
          'Wildstyle is an elaborate version of a throw-up and is particularly hard to read. It often consists of arrows, curves and spikes.',
      },
      {
        id: 'a20c46cf-59f1-4a35-9c0e-7d1b8f2a4c63',
        name: 'Heaven',
        description:
          'A heaven is a tag or artwork in a place that is extremely difficult to get to. An artist who manages to put one up gains a lot of respect.',
      },
      {
        id: 'a20c46cf-5a73-41d2-8b6f-0e9c3d5a71f4',
        name: 'Stencil',
        description:
          'A stencil is an easy way to put up detailed pieces. By spraying over a stencil you can produce a more detailed piece than free hand, and repeat it.',
      },
    ];
  }

  getCategory(id: string): Category {
    const found = this.getCategoryList().filter((category) => category.id === id);

    return found.length > 0 ? found[0] : this.getCategoryList()[0];
  }

  getCategoryGraffitis(): Graffiti[] {
    return new GraffitiMock().getGraffitiList();
  }
}
