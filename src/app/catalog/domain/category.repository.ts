import { Category } from './category.model';

export abstract class CategoryRepository {
  abstract getList(): Promise<Category[]>;
  abstract getById(id: string): Promise<Category>;
}
