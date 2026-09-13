import { Routes } from '@angular/router';
import { DashboardPage } from './dashboard.page';
import { MainComponent } from '../main/main.component';

export const dashboardRoutes: Routes = [
  {
    path: '',
    component: DashboardPage,
    children: [
      {
        path: 'main',
        component: MainComponent,
      },
      {
        path: 'folder/:id',
        loadComponent: () => import('../folder/folder.page').then((m) => m.FolderPage),
      },
    ],
  },
];
