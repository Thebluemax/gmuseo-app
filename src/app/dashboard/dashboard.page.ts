import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
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
  constructor() { }

  ngOnInit() {
  }

}
