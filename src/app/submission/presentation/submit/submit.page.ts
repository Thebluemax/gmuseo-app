import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'gm-submit',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Subir graffiti</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>Próximamente: cámara + geolocalización.</p>
    </ion-content>
  `,
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
})
export class SubmitPage {}
