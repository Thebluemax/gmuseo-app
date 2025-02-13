import { Graffiti } from "./graffiti";

export  interface Category {
    id: number;
    name: string;
    description: string;
    image: string;
    graffitis?: Graffiti[];
}