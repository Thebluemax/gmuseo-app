import { Component, inject, OnInit } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonContent, IonGrid, IonRow, IonCol,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonSpinner, IonText,
} from '@ionic/angular/standalone';
import { GraffitiService } from '../../application/graffiti.service';
import { AuthService } from '../../../auth/application/auth.service';

@Component({
  selector: 'gm-catalog',
  templateUrl: './catalog.page.html',
  styleUrls: ['./catalog.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
    IonContent, IonGrid, IonRow, IonCol,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonSpinner, IonText,
    RouterLink, SlicePipe,
  ],
})
export class CatalogPage implements OnInit {
  private graffitiService = inject(GraffitiService);
  readonly authService = inject(AuthService);

  readonly graffitis = this.graffitiService.lastGraffitis;
  readonly loading = this.graffitiService.loading;
  readonly error = this.graffitiService.error;

  ngOnInit() {
    this.graffitiService.loadLast();
  }
}
