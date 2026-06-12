import { Component, input } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
} from '@ionic/angular/standalone';
import type { Graffiti } from '../../../domain/models/graffiti.model';

@Component({
  selector: 'gm-graffiti-card',
  templateUrl: './graffiti-card.html',
  imports: [IonCard, IonCardHeader, IonCardTitle, IonCardContent, RouterLink, SlicePipe],
})
export class GraffitiCard {
  readonly graffiti = input.required<Graffiti>();
}
