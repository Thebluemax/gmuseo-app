import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy, RouterModule } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { MainComponent } from './main/main.component';
import { MainGraffitiComponent } from './components/main-graffiti/main-graffiti.component';
import { MonthlyComponent } from './components/monthly/monthly.component';
import { CategoryNavComponent } from './components/category-nav/category-nav.component';

@NgModule({
  declarations: [AppComponent, MainComponent,MainGraffitiComponent, MonthlyComponent, CategoryNavComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, RouterModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}
