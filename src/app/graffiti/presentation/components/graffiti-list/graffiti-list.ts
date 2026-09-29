import { Component, input, output } from '@angular/core';
import {
  IonGrid, IonRow, IonCol, IonSpinner, IonText, IonRefresher, IonRefresherContent,
} from '@ionic/angular/standalone';
import { GraffitiCardComponent } from '../graffiti-card/graffiti-card';
import type { Graffiti } from '../../../domain/models/graffiti.model';

@Component({
  selector: 'gm-graffiti-list',
  templateUrl: './graffiti-list.html',
  imports: [
    IonGrid, IonRow, IonCol, IonSpinner, IonText, IonRefresher, IonRefresherContent,
    GraffitiCardComponent,
  ],
})
export class GraffitiListComponent {
  readonly graffitis = input.required<Graffiti[]>();
  readonly loading = input.required<boolean>();
  readonly error = input.required<string | null>();

  readonly refreshRequested = output<void>();

  onRefresh(event: any): void {
    this.refreshRequested.emit();
    event.detail.complete();
  }
}
