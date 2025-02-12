import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GraffitiMainComponent } from './graffiti-main/graffiti-main.component';
import { GraffitiShowComponent } from './graffiti-show/graffiti-show.component';
import { GraffitiNewComponent } from './graffiti-new/graffiti-new.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'graffiti',
    pathMatch: 'full'
  },
  {
    path: '',
    component: GraffitiMainComponent
  },
  {
    path: ':id',
    component: GraffitiShowComponent
  },
  {
    path: 'new',
    component: GraffitiNewComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class GraffitiRoutingModule {}
