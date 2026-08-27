import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { CategoryMainComponent } from './category-main.component';
import { CategoryRepository } from 'src/app/catalog/domain/category.repository';
import { Category } from 'src/app/catalog/domain/category.model';
import { GraffitiRepository } from 'src/app/graffiti/domain/repositories/graffiti.repository';
import { Graffiti } from 'src/app/graffiti/domain/models/graffiti.model';
import { GraffitiFilters } from 'src/app/graffiti/domain/models/graffiti-filters.model';
import { PaginatedResponse } from 'src/app/shared/domain/pagination.model';
import { CategoryMock } from 'src/app/mocks/category.mock';
import { GraffitiMock } from 'src/app/mocks/graffti.mock';

const CATEGORY = new CategoryMock().getCategoryList()[3];
const GRAFFITIS = new GraffitiMock().getGraffitiList();

function page(data: Graffiti[]): PaginatedResponse<Graffiti> {
  return {
    data,
    links: { first: null, last: null, prev: null, next: null },
    meta: {
      current_page: 1, from: 1, last_page: 1,
      per_page: 20, to: data.length, total: data.length,
    },
  };
}

class CategoryRepositoryDouble extends CategoryRepository {
  failure: unknown = null;

  override async getList(): Promise<Category[]> {
    return new CategoryMock().getCategoryList();
  }

  override async getById(id: string): Promise<Category> {
    if (this.failure) throw this.failure;

    return new CategoryMock().getCategory(id);
  }

  override async getCoverImage(): Promise<string | null> {
    return 'http://media.test/cover_350.jpg';
  }
}

class GraffitiRepositoryDouble extends GraffitiRepository {
  list: Graffiti[] = GRAFFITIS;
  failure: unknown = null;
  lastFilters: GraffitiFilters | undefined;

  override async getList(filters?: GraffitiFilters): Promise<PaginatedResponse<Graffiti>> {
    this.lastFilters = filters;
    if (this.failure) throw this.failure;

    return page(this.list);
  }

  override async getById(id: string): Promise<Graffiti> {
    return this.list.filter((g) => g.id === id)[0];
  }
}

describe('CategoryMainComponent', () => {
  let component: CategoryMainComponent;
  let fixture: ComponentFixture<CategoryMainComponent>;
  let categories: CategoryRepositoryDouble;
  let graffitis: GraffitiRepositoryDouble;

  beforeEach(async () => {
    categories = new CategoryRepositoryDouble();
    graffitis = new GraffitiRepositoryDouble();

    await TestBed.configureTestingModule({
      imports: [CategoryMainComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: CategoryRepository, useValue: categories },
        { provide: GraffitiRepository, useValue: graffitis },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ category: CATEGORY.id }) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryMainComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the category named in the route, from the API', async () => {
    await component.ngOnInit();
    await fixture.whenStable();

    expect(component.category()).toEqual(CATEGORY);
    expect(component.category()?.id).toBe(CATEGORY.id);
    expect(typeof component.category()?.id).toBe('string');
  });

  it('asks the API only for graffitis of that category', async () => {
    await component.ngOnInit();
    await fixture.whenStable();

    expect(graffitis.lastFilters).toEqual({ category: CATEGORY.id });
    expect(component.graffitis().length).toBe(GRAFFITIS.length);
  });

  it('renders the category name in the banner', async () => {
    await component.ngOnInit();
    await fixture.whenStable();

    const banner = (fixture.nativeElement as HTMLElement).querySelector('.banner span');
    expect(banner?.textContent?.trim()).toBe(CATEGORY.name);
  });

  it('shows each graffiti through its grid photo variant', async () => {
    await component.ngOnInit();
    await fixture.whenStable();

    const images = (fixture.nativeElement as HTMLElement).querySelectorAll('.graffiti-thumb img');
    expect(images.length).toBe(GRAFFITIS.length);
    expect(images[0].getAttribute('src')).toBe(GRAFFITIS[0].sightings[0].photos[0].files.sm);
  });

  it('falls back to the graffiti cover when a sighting carries no photo', () => {
    const bare: Graffiti = { ...GRAFFITIS[0], sightings: [] };

    expect(component.thumbnail(bare)).toBe(bare.cover);
  });

  it('says so when the category has no graffiti yet', async () => {
    graffitis.list = [];

    await component.ngOnInit();
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('.graffiti-thumb').length).toBe(0);
    expect(host.querySelector('.state')?.textContent).toContain('Todavía no hay graffitis');
  });

  it('shows an error instead of a blank page when the API is down', async () => {
    categories.failure = new Error('backend down');
    graffitis.failure = new Error('backend down');

    await component.ngOnInit();
    await fixture.whenStable();

    expect(component.error()).toBeTruthy();
    expect(component.loading()).toBe(false);
    const message = (fixture.nativeElement as HTMLElement).querySelector('ion-text p');
    expect(message?.textContent?.trim()).toBe(component.error() ?? '');
  });
});
