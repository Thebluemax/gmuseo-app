import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CategoryPage } from './category.page';
import { IonicModule } from '@ionic/angular';

describe('CategoryPage', () => {
  let component: CategoryPage;
  let fixture: ComponentFixture<CategoryPage>;

  beforeEach(waitForAsync(() => {
   TestBed.configureTestingModule({
      declarations: [ CategoryPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();
    fixture = TestBed.createComponent(CategoryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('should have a categories', () => {
    expect(component.getCategories()).not.toEqual([]);
  });

  it("should order list by columns", () => {
    component.ngOnInit();
    fixture.detectChanges();
    const app = fixture.nativeElement;
    const rows = app.querySelectorAll('ion-row');
    const cols = app.querySelectorAll('ion-col');
    expect(rows.length).toEqual(component.getCategories().length);
    expect(cols.length).toEqual(component.getCategories().length * 6);
   });
});
