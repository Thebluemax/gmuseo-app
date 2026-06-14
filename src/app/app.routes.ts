import { Routes } from '@angular/router';
import { TabsPage } from './shell/tabs.page';
import { authGuard } from './auth/application/auth.guard';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'catalog',
        loadComponent: () =>
          import('./graffiti/presentation/graffiti-page/graffiti.page').then((m) => m.GraffitiPage),
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
        redirectTo: '/tabs/catalog',
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
      {
        path: 'register',
        loadComponent: () =>
          import('./auth/presentation/register/register.page').then((m) => m.RegisterPage),
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/catalog',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/tabs/catalog',
  },
];
