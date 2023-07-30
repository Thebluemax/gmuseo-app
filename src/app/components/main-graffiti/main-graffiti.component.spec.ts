import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonImg, IonicModule } from '@ionic/angular';

import { MainGraffitiComponent } from './main-graffiti.component';

fdescribe('MainGraffitiComponent', () => {
  let component: MainGraffitiComponent;
  let fixture: ComponentFixture<MainGraffitiComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MainGraffitiComponent, IonImg ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(MainGraffitiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it("should haven't a graffiti", () => {
    expect(component.graffiti).toBeFalsy();
  });

  it("should have a graffiti", async () => {
    component.graffiti = {
      name: 'Main Graffiti',
      description: 'This is the main graffiti',
      image: 'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_700.jpg',
      id: 1
    } 
    fixture.detectChanges();
    expect(component.graffiti).toBeTruthy();
    const app = fixture.nativeElement;
    const image = app.querySelectorAll('ion-img');
    console.log(image[0]);
   await expect(image[0].getAttribute('ng-reflect-src')).toContain('http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_700.jpg');
    expect(image[0].getAttribute('ng-reflect-alt')).toContain('This is the main graffiti');
  });
});
