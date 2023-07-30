import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { MonthlyComponent } from './monthly.component';
import { Graffiti } from 'src/app/models/graffiti';

fdescribe('MonthlyComponent', () => {
  let component: MonthlyComponent;
  let fixture: ComponentFixture<MonthlyComponent>;

  let monthlyList: Graffiti[] = [
    {
      name: 'Main Graffiti',
      description: 'This is the main graffiti',
      image:
        'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_350.jpg',
      id: 1,
    },
    {
      name: 'Main Graffiti',
      description: 'This is the main graffiti',
      image:
        'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_350.jpg',
      id: 12,
    },
    {
      name: 'Main Graffiti',
      description: 'This is the main graffiti',
      image:
        'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_350.jpg',
      id: 13,
    },
    {
      name: 'Main Graffiti',
      description: 'This is the main graffiti',
      image:
        'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_350.jpg',
      id: 14,
    },
    {
      name: 'Main Graffiti',
      description: 'This is the main graffiti',
      image:
        'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_350.jpg',
      id: 15,
    },
  ];

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
