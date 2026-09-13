import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonSplitPane, IonMenu, IonContent, IonList, IonListHeader, IonNote,
  IonMenuToggle, IonItem, IonLabel, IonIcon, IonRouterOutlet,
} from '@ionic/angular/standalone';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    IonSplitPane, IonMenu, IonContent, IonList, IonListHeader, IonNote,
    IonMenuToggle, IonItem, IonLabel, IonIcon, IonRouterOutlet,
    RouterLink, RouterLinkActive,
  ],
})
export class DashboardPage {
  public appPages = [
    { title: 'Main', url: '/dashboard/main', icon: 'home' },
    { title: 'Outbox', url: '/dashboard/folder/outbox', icon: 'paper-plane' },
    { title: 'Favorites', url: '/dashboard/folder/favorites', icon: 'heart' },
    { title: 'Archived', url: '/dashboard/folder/archived', icon: 'archive' },
    { title: 'Trash', url: '/dashboard/folder/trash', icon: 'trash' },
    { title: 'Spam', url: '/dashboard/folder/spam', icon: 'warning' },
  ];
  public labels = ['Family', 'Friends', 'Notes', 'Work', 'Travel', 'Reminders'];
  public appName = environment.appName;
}
