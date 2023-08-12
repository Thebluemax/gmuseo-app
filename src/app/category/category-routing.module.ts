import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CategoryPage } from './categories/category.page';
import { CategoryMainComponent } from './category-main/category-main.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/category',
    pathMatch: 'full',
  },
  {
    path: '',
    component: CategoryPage
  },
  {
    path: ':category',
    component: CategoryMainComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CategoryPageRoutingModule {}
