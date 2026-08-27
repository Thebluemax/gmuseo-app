import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { CategoryPage } from './category.page';
import { CategoryRepository } from 'src/app/catalog/domain/category.repository';
import { CATEGORY_COVER_FALLBACK } from 'src/app/catalog/application/category.service';
import { Category } from 'src/app/catalog/domain/category.model';
import { CategoryMock } from 'src/app/mocks/category.mock';

const CATEGORIES = new CategoryMock().getCategoryList();

class CategoryRepositoryDouble extends CategoryRepository {
  list: Category[] = CATEGORIES;
  failure: unknown = null;
  covers: Record<string, string | null> = {};
  /** Resolved by the test, so a pending cover can be observed mid-flight. */
  releaseCover: (() => void) | null = null;

  override async getList(): Promise<Category[]> {
    if (this.failure) throw this.failure;

    return this.list;
  }

  override async getById(id: string): Promise<Category> {
    return this.list.filter((c) => c.id === id)[0];
  }

  override async getCoverImage(categoryId: string): Promise<string | null> {
    if (this.releaseCover) {
      await new Promise<void>((resolve) => (this.releaseCover = resolve));
    }

    return this.covers[categoryId] ?? null;
  }
}

describe('CategoryPage', () => {
  let component: CategoryPage;
  let fixture: ComponentFixture<CategoryPage>;
  let repo: CategoryRepositoryDouble;

  beforeEach(async () => {
    repo = new CategoryRepositoryDouble();
    await TestBed.configureTestingModule({
      imports: [CategoryPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: CategoryRepository, useValue: repo },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the categories the API returns, not a hardcoded list', async () => {
    await component.ngOnInit();
    await fixture.whenStable();

    expect(component.categories()).toEqual(CATEGORIES);
    const cells = (fixture.nativeElement as HTMLElement).querySelectorAll('ion-col');
    expect(cells.length).toBe(CATEGORIES.length);
  });

  it('links each cell to the category detail by UUID', async () => {
    await component.ngOnInit();
    await fixture.whenStable();

    const link = (fixture.nativeElement as HTMLElement).querySelector('a.category-link');
    expect(link?.getAttribute('href')).toBe(`/tabs/category/${CATEGORIES[0].id}`);
  });

  it('renders the grid before any cover has resolved', async () => {
    repo.releaseCover = () => undefined;
    repo.covers = { [CATEGORIES[0].id]: 'http://media.test/photo_350.jpg' };

    await component.ngOnInit();
    await fixture.whenStable();

    // Covers are still in flight: the grid is already on screen and every cell
    // carries the bundled fallback rather than an undefined URL.
    const cells = (fixture.nativeElement as HTMLElement).querySelectorAll('ion-col');
    expect(cells.length).toBe(CATEGORIES.length);
    for (const category of CATEGORIES) {
      expect(component.coverFor(category.id)).toBe(CATEGORY_COVER_FALLBACK);
    }
  });

  it('swaps in each cover as it arrives', async () => {
    repo.covers = { [CATEGORIES[0].id]: 'http://media.test/photo_350.jpg' };

    await component.ngOnInit();
    await fixture.whenStable();

    expect(component.coverFor(CATEGORIES[0].id)).toBe('http://media.test/photo_350.jpg');
    expect(component.coverFor(CATEGORIES[1].id)).toBe(CATEGORY_COVER_FALLBACK);
  });

  it('leaves no cell with an undefined cover', async () => {
    await component.ngOnInit();
    await fixture.whenStable();

    for (const category of CATEGORIES) {
      expect(component.coverFor(category.id)).toBeTruthy();
    }
  });

  it('shows an error instead of an empty page when the API is down', async () => {
    repo.failure = new Error('backend down');

    await component.ngOnInit();
    await fixture.whenStable();

    expect(component.error()).toBeTruthy();
    expect(component.loading()).toBe(false);
    const message = (fixture.nativeElement as HTMLElement).querySelector('ion-text p');
    expect(message?.textContent?.trim()).toBe(component.error() ?? '');
  });
});
