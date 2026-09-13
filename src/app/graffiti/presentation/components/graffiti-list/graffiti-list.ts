import { Component, input } from '@angular/core';
import {
  IonGrid, IonRow, IonCol, IonSpinner, IonText,
} from '@ionic/angular/standalone';
import { GraffitiCardComponent } from '../graffiti-card/graffiti-card';
import type { Graffiti } from '../../../domain/models/graffiti.model';

@Component({
  selector: 'gm-graffiti-list',
  templateUrl: './graffiti-list.html',
  imports: [IonGrid, IonRow, IonCol, IonSpinner, IonText, GraffitiCardComponent],
})
export class GraffitiListComponent {
  readonly graffitis = input.required<Graffiti[]>();
  readonly loading = input.required<boolean>();
  readonly error = input.required<string | null>();
}
