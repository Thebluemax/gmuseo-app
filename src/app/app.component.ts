import { Component, OnInit } from '@angular/core';
import { environment } from "../environments/environment";
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit{
  themeToggle:boolean = false;
  public appPages = [
    { title: 'Main', url: '/main', icon: 'home' },
    { title: 'Category', url: '/category', icon: 'paper-plane' },
    { title: 'Add', url: '/graffiti/new', icon: 'add' },
    { title: 'Archived', url: '/folder/archived', icon: 'archive' },
  ];

  public appName = environment.appName;
  ngOnInit() {
    // Use matchMedia to check the user preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    // Initialize the dark theme based on the initial
    // value of the prefers-color-scheme media query
    this.initializeDarkTheme(prefersDark.matches);

    // Listen for changes to the prefers-color-scheme media query
    prefersDark.addEventListener('change', (mediaQuery) => this.initializeDarkTheme(mediaQuery.matches));
  }

  // Check/uncheck the toggle and update the theme based on isDark
  initializeDarkTheme(isDark:boolean) {
    this.themeToggle = isDark;
    this.toggleDarkTheme(isDark);
  }

  // Listen for the toggle check/uncheck to toggle the dark theme
  toggleChange(ev: any) {
    this.toggleDarkTheme(ev.detail.checked);
  }

  // Add or remove the "dark" class on the document body
  toggleDarkTheme(shouldAdd:any = false) {
    document.body.classList.toggle('dark', shouldAdd);
  }

  getAppPages() {
    return this.appPages;
  }
}
