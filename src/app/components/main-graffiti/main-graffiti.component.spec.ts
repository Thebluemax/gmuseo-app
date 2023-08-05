import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonImg, IonicModule } from '@ionic/angular';
import { GraffitiMock } from "../../mocks/graffti.mock";

import { MainGraffitiComponent } from './main-graffiti.component';
import { Graffiti } from 'src/app/models/graffiti';

describe('MainGraffitiComponent', () => {
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
    const graffitiMock:Graffiti = new GraffitiMock().getGraffiti();
    component.graffiti = graffitiMock;
    fixture.detectChanges();
    expect(component.graffiti).toBeTruthy();
    const app = fixture.nativeElement;
    const image = app.querySelectorAll('img');
    console.log(image[0]);
   await expect(image[0].getAttribute('src')).toContain(graffitiMock.image);
    expect(image[0].getAttribute('alt')).toContain(graffitiMock.description);
    expect(image[0].getAttribute('title')).toContain(graffitiMock.name);
  });
});
