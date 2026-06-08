import { Routes } from '@angular/router';
import { TabsPage } from './shell/tabs.page';
import { authGuard } from './auth/application/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'catalog',
        loadComponent: () =>
          import('./catalog/presentation/catalog/catalog.page').then((m) => m.CatalogPage),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./catalog/presentation/categories/categories.page').then((m) => m.CategoriesPage),
      },
      {
        path: 'submit',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./submission/presentation/submit/submit.page').then((m) => m.SubmitPage),
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./auth/presentation/profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: '',
        redirectTo: 'catalog',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./auth/presentation/login/login.page').then((m) => m.LoginPage),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'catalog',
  },
];
