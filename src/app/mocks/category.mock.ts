import { Category } from "../models/category";
import { Graffiti } from "../models/graffiti";

export class CategoryMock {

  public getCategoryList(): Category[] {
    return [
      {
        id: 1,
        name: 'Tag',
        description:
          'Tagging is the easiest and simplest style of graffiti; it includes one colour and the artist’s name or identifier. ',
        image: 'http://localhost:9444/statics/tag.jpg',
      },
      {
        id: 2,
        name: 'Throw-up',
        description:
          'A throw-up is like a more complicated tag. It usually has two or more colours, and bubble-style lettering. A throw-up can be done quickly and repeatedly, just like a tag.',
        image: 'http://localhost:9444/statics/throw-up.jpg',
      },
      {
        id: 3,
        name: 'Blockbuster',
        description:
          'A blockbuster is like a massive throw-up, usually in blocky letters. Blockbusters are used to cover a large area in a small amount of time. Blockbusters can be painted with rollers, which makes them faster and easier to do.',
        image: 'http://localhost:9444/statics/blockbuster.jpg',
      },
      {
        id: 4,
        name: 'Wildstyle',
        description:
          'Wildstyle is an elaborate version of a throw-up and is particularly hard to read. Wildstyle often consists of arrows, curves, spikes and other things that non graffiti artists might not understand.',
        image: 'http://localhost:9444/statics/wildstyle.jpg',
      },
      {
        id: 5,
        name: 'Heaven',
        description:
          'A heaven is a tag or artwork in a place that is extremely difficult to get to. An artist who manages to put one up gains a lot of respect from other artists.',
        image: 'http://localhost:9444/statics/heaven.jpg',
      },
      {
        id: 6,
        name: 'Stencil',
        description:
          'A stencil is an easy (some say ‘lazy’) way to put up detailed pieces. By spraying over a stencil, you can produce a more detailed piece than by doing it free hand. And it’s also repeatable.',
        image: 'http://localhost:9444/statics/stencil.jpg',
      },
      {
        id: 7,
        name: 'Poster (paste-up)',
        description:
          'A poster is a quick and easy way to put up pieces. You just make the piece at home then paste it up where you want.',
        image: 'http://localhost:9444/statics/poster.jpg',
      },
      {
        id: 8,
        name: 'Sticker (slap)',
        description:
          'A sticker is like a downsized poster, and just as easy to execute. Many stickers are simply tags on postage labels, but sometimes they are more elaborate.',
        image: 'http://localhost:9444/statics/sticker.jpg',
      },
      {
        id: 9,
        name: 'Piece',
        description:
          'A piece (short for masterpiece) is a picture that has been painted free hand. They contains at least three colours and take longer to paint. A piece in an obvious place will gain the artist respect from other artists because standing in an obvious place painting on walls where graffiti is illegal is a great risk.',
        image: 'http://localhost:9444/statics/piece.jpg',
      },
    ];
  }

  getCategory(id: number): Category {
    return {
      id: 1,
      name: 'Tag',
      description:
        'Tagging is the easiest and simplest style of graffiti; it includes one colour and the artist’s name or identifier. ',
      image: 'http://localhost:9444/statics/tag.jpg',
    };
  }
  getCategoryGraffitis(): Graffiti[] {
    return  [
      {
          name: 'Main Graffiti',
          description: 'This is the main graffiti',
          image: 'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_350.jpg',
          id: 1
        } ,
      {
        name: 'Main Graffiti',
        description: 'This is the main graffiti',
        image: 'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_350.jpg',
        id: 12
      } ,
      {
      name: 'Main Graffiti',
      description: 'This is the main graffiti',
      image: 'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_350.jpg',
      id: 13
      } ,
      {
      name: 'Main Graffiti',
      description: 'This is the main graffiti',
      image: 'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_350.jpg',
      id: 14
      } ,
      {
      name: 'Main Graffiti',
      description: 'This is the main graffiti',
      image: 'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_350.jpg',
      id: 15
      } 
        ];
  }
}
