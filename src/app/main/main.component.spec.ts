import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { MainComponent } from './main.component';
import { MainGraffitiComponent } from '../components/main-graffiti/main-graffiti.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CategoryNavComponent } from '../components/category-nav/category-nav.component';
import { RouterTestingModule } from '@angular/router/testing';
import { MonthlyComponent } from '../components/monthly/monthly.component';

describe('MainComponent', () => {
  let component: MainComponent;
  let fixture: ComponentFixture<MainComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MainComponent,  MainGraffitiComponent, CategoryNavComponent, MonthlyComponent],
      imports: [IonicModule.forRoot(), RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(MainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
