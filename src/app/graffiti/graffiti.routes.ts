import { Routes } from '@angular/router';
import { GraffitiMainComponent } from './graffiti-main/graffiti-main.component';
import { GraffitiShowComponent } from './graffiti-show/graffiti-show.component';
import { GraffitiNewComponent } from './graffiti-new/graffiti-new.component';

export const graffitiRoutes: Routes = [
  {
    path: '',
    component: GraffitiMainComponent,
  },
  {
    path: 'new',
    component: GraffitiNewComponent,
  },
  {
    path: ':id',
    component: GraffitiShowComponent,
  },
];
