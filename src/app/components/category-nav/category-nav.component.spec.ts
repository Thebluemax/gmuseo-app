import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { CategoryNavComponent } from './category-nav.component';
import { CategoryMock } from 'src/app/mocks/category.mock';

fdescribe('CategoryNavComponent', () => {
  let component: CategoryNavComponent;
  let fixture: ComponentFixture<CategoryNavComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CategoryNavComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it("should haven't a categories", () => {
    expect(component.categories).toEqual([]);
  });

  it("should have a categories", () => { 
    component.categories = new CategoryMock().getCategoryList();
    fixture.detectChanges();
    expect(component.categories).toBeTruthy();
    const app = fixture.nativeElement;
    const buttons = app.querySelectorAll('ion-col');
    expect(buttons.length).toEqual(component.categories.length);
   });
});
