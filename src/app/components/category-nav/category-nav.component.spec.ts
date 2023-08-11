import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { CategoryNavComponent } from './category-nav.component';
import { CategoryMock } from 'src/app/mocks/category.mock';
import { Router, RouterModule } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

describe('CategoryNavComponent', () => {
  let component: CategoryNavComponent;
  let fixture: ComponentFixture<CategoryNavComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CategoryNavComponent, ],
      imports: [IonicModule.forRoot(), RouterModule.forRoot([]) ],
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
    component.ngOnInit();
    fixture.detectChanges();
    expect(component.listProcessed).toBeTruthy();
    const app = fixture.nativeElement;
    const buttons = app.querySelectorAll('ion-col');
    expect(buttons.length).toEqual(component.categories.length);
   });

   it("should order list by columns", () => {
    component.categories = new CategoryMock().getCategoryList();
    component.ngOnInit();
    fixture.detectChanges();
    const app = fixture.nativeElement;
    const rows = app.querySelectorAll('ion-row');
    const buttons = app.querySelectorAll('ion-col');
    expect(buttons.length).toEqual(component.categories.length);
    expect(component.listProcessed.length).toEqual(rows.length);
    expect(component.listProcessed.length).toEqual(Math.ceil(component.categories.length/2));
   });
});
