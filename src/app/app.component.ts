import { Component, OnInit } from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonApp, IonContent, IonRouterOutlet, IonTabs, IonTabBar, IonTabButton, IonIcon,
} from '@ionic/angular/standalone';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    IonApp, IonContent, IonRouterOutlet, IonTabs, IonTabBar, IonTabButton, IonIcon,
    RouterLink,
    LowerCasePipe,
  ],
})
export class AppComponent implements OnInit {
  themeToggle: boolean = false;
  public appPages = [
    { title: 'Main', url: '/main', icon: 'home' },
    { title: 'Category', url: '/category', icon: 'paper-plane' },
    { title: 'Add', url: '/graffiti/new', icon: 'add' },
    { title: 'Archived', url: '/folder/archived', icon: 'archive' },
  ];

  public appName = environment.appName;

  ngOnInit() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    this.initializeDarkTheme(prefersDark.matches);
    prefersDark.addEventListener('change', (mediaQuery) => this.initializeDarkTheme(mediaQuery.matches));
  }

  initializeDarkTheme(isDark: boolean) {
    this.themeToggle = isDark;
    this.toggleDarkTheme(isDark);
  }

  toggleChange(ev: any) {
    this.toggleDarkTheme(ev.detail.checked);
  }

  toggleDarkTheme(shouldAdd: any = false) {
    document.body.classList.toggle('dark', shouldAdd);
  }

  getAppPages() {
    return this.appPages;
  }
}
