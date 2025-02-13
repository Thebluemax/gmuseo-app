import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraffitiMainComponent } from './graffiti-main/graffiti-main.component';
import { GraffitiNewComponent } from './graffiti-new/graffiti-new.component';
import { GraffitiShowComponent } from './graffiti-show/graffiti-show.component';
import { GraffitiRoutingModule } from './graffiti-routing.module';



@NgModule({
  declarations: [
    GraffitiMainComponent,
    GraffitiNewComponent,
    GraffitiShowComponent
  ],
  imports: [
    CommonModule,
    GraffitiRoutingModule
  ]
})
export class GraffitiModule { }
