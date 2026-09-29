import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonCard, IonCardContent } from '@ionic/angular/standalone';
import type { Graffiti } from '../../../domain/models/graffiti.model';
import { LazyLoadDirective } from '../../../../shared/directives/lazy-load.directive';

@Component({
  selector: 'gm-graffiti-card',
  templateUrl: './graffiti-card.html',
  styleUrls: ['./graffiti-card.scss'],
  imports: [IonCard, IonCardContent, RouterLink, LazyLoadDirective],
})
export class GraffitiCardComponent {
  readonly graffiti = input.required<Graffiti>();
  readonly placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3C/svg%3E';
}
