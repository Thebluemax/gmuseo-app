import { Routes } from '@angular/router';
import { CategoryPage } from './categories/category.page';
import { CategoryMainComponent } from './category-main/category-main.component';

export const categoryRoutes: Routes = [
  {
    path: '',
    component: CategoryPage,
  },
  {
    path: ':category',
    component: CategoryMainComponent,
  },
];
