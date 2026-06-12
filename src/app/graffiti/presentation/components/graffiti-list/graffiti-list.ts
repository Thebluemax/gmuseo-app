import { Component, input } from '@angular/core';
import {
  IonGrid, IonRow, IonCol, IonSpinner, IonText,
} from '@ionic/angular/standalone';
import { GraffitiCard } from '../graffiti-card/graffiti-card';
import type { Graffiti } from '../../../domain/models/graffiti.model';

@Component({
  selector: 'gm-graffiti-list',
  templateUrl: './graffiti-list.html',
  imports: [IonGrid, IonRow, IonCol, IonSpinner, IonText, GraffitiCard],
})
export class GraffitiList {
  readonly graffitis = input.required<Graffiti[]>();
  readonly loading = input.required<boolean>();
  readonly error = input.required<string | null>();
}
