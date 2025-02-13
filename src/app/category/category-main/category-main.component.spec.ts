import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { CategoryMainComponent } from './category-main.component';
import { CategoryMock } from 'src/app/mocks/category.mock';

describe('CategoryMainComponent', () => {
  let component: CategoryMainComponent;
  let fixture: ComponentFixture<CategoryMainComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CategoryMainComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it("should have a category", () => {
    expect(component.category).toBeTruthy();
  });

  it("should have a category with id 1", () => {
    component.category = new CategoryMock().getCategory(1);
    component.ngOnInit();
    const app = fixture.nativeElement;
    const rows = app.querySelectorAll('ion-row');
    const banner = app.querySelectorAll('.banner');
    expect(component.category.id).toEqual(1);
    expect(rows.length).toEqual(1);
    expect(banner.length).toEqual(1);
    expect(banner[0].innerText).toEqual(component.category.name);
  });
});
