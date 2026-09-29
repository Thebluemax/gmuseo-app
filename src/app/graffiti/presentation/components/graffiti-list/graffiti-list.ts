import { Component, computed, input, output } from '@angular/core';
import {
  IonGrid, IonRow, IonCol, IonSpinner, IonText, IonRefresher, IonRefresherContent, IonVirtualScroll,
} from '@ionic/angular/standalone';
import { GraffitiCardComponent } from '../graffiti-card/graffiti-card';
import type { Graffiti } from '../../../domain/models/graffiti.model';

@Component({
  selector: 'gm-graffiti-list',
  templateUrl: './graffiti-list.html',
  styleUrls: ['./graffiti-list.scss'],
  imports: [
    IonGrid, IonRow, IonCol, IonSpinner, IonText, IonRefresher, IonRefresherContent, IonVirtualScroll,
    GraffitiCardComponent,
  ],
})
export class GraffitiListComponent {
  readonly graffitis = input.required<Graffiti[]>();
  readonly loading = input.required<boolean>();
  readonly error = input.required<string | null>();

  readonly refreshRequested = output<void>();

  readonly useVirtualScroll = computed(() => this.graffitis().length > 100);

  onRefresh(event: any): void {
    this.refreshRequested.emit();
    event.detail.complete();
  }
}
