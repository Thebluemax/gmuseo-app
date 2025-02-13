import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { MonthlyComponent } from './monthly.component';
import { Graffiti } from 'src/app/models/graffiti';
import { GraffitiMock } from 'src/app/mocks/graffti.mock';

describe('MonthlyComponent', () => {
  let component: MonthlyComponent;
  let fixture: ComponentFixture<MonthlyComponent>;

  let monthlyList: Graffiti[] = new GraffitiMock().getGraffitiList();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MonthlyComponent],
      imports: [IonicModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(MonthlyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('must create all given graffitis', () => {
    component.graffitiList = monthlyList;
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelectorAll('.item-container').length).toEqual(
      monthlyList.length
    );
  });
});
