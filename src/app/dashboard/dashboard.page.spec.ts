import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DashboardPage } from './dashboard.page';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('DashboardPage', () => {
  let component: DashboardPage;
  let fixture: ComponentFixture<DashboardPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
          schemas: [CUSTOM_ELEMENTS_SCHEMA],
          imports: [],
        }).compileComponents();
    
      }));
      
      it('should create', () => {
        const fixture = TestBed.createComponent(DashboardPage);
     fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
