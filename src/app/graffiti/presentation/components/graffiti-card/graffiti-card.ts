import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonCard, IonCardContent } from '@ionic/angular/standalone';
import type { Graffiti } from '../../../domain/models/graffiti.model';

@Component({
  selector: 'gm-graffiti-card',
  templateUrl: './graffiti-card.html',
  imports: [IonCard, IonCardContent, RouterLink],
})
export class GraffitiCardComponent {
  readonly graffiti = input.required<Graffiti>();
}
