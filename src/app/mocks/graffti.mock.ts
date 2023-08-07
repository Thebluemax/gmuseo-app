import { Graffiti } from "../models/graffiti";

export class GraffitiMock {
  public getGraffiti(): Graffiti
   {
    {
      return {
        name: 'Main Graffiti',
        description: 'This is the main graffiti',
        image:
          'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_700.jpg',
        id: 1,
      };
    }
  }
  public getGraffitiList() {
    return [
        {
          name: 'Main Graffiti',
          description: 'This is the main graffiti',
          image:
            'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_350.jpg',
          id: 1,
        },
        {
          name: 'Main Graffiti',
          description: 'This is the main graffiti',
          image:
            'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_350.jpg',
          id: 12,
        },
        {
          name: 'Main Graffiti',
          description: 'This is the main graffiti',
          image:
            'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_350.jpg',
          id: 13,
        },
        {
          name: 'Main Graffiti',
          description: 'This is the main graffiti',
          image:
            'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_350.jpg',
          id: 14,
        },
        {
          name: 'Main Graffiti',
          description: 'This is the main graffiti',
          image:
            'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_350.jpg',
          id: 15,
        },
      ];
    }
}
