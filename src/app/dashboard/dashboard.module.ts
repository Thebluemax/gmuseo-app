import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DashboardPageRoutingModule } from './dashboard-routing.module';

import { DashboardPage } from './dashboard.page';
import { MainComponent } from '../main/main.component';
import { CategoryNavComponent } from '../components/category-nav/category-nav.component';
import { MonthlyComponent } from '../components/monthly/monthly.component';
import { MainGraffitiComponent } from '../components/main-graffiti/main-graffiti.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DashboardPageRoutingModule
  ],
  declarations: [
    DashboardPage,
    MainComponent,
    CategoryNavComponent,
    MainGraffitiComponent,
    MonthlyComponent
  ]
})
export class DashboardPageModule {}
