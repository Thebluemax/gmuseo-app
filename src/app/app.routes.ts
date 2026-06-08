import { Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () => import('./dashboard/dashboard.routes').then((m) => m.dashboardRoutes),
  },
  {
    path: 'category',
    loadChildren: () => import('./category/category.routes').then((m) => m.categoryRoutes),
  },
  {
    path: 'graffiti',
    loadChildren: () => import('./graffiti/graffiti.routes').then((m) => m.graffitiRoutes),
  },
];
