import { Category } from './category.model';

export abstract class CategoryRepository {
  abstract getList(): Promise<Category[]>;
  abstract getById(id: string): Promise<Category>;

  /**
   * URL of a graffiti photo usable as the category cover in a grid, or `null`
   * when the category has no graffiti yet. The API carries no category image —
   * the cover is presentation, not domain — so it is derived from one of the
   * graffitis filed under the category.
   */
  abstract getCoverImage(categoryId: string): Promise<string | null>;
}
