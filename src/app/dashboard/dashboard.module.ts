import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DashboardPageRoutingModule } from './dashboard-routing.module';

import { DashboardPage } from './dashboard.page';
import { MainComponent } from '../main/main.component';
import { MonthlyComponent } from '../components/monthly/monthly.component';
import { MainGraffitiComponent } from '../components/main-graffiti/main-graffiti.component';
import { CategoryNavComponent } from '../components/category-nav/category-nav.component';

@NgModule({
  declarations: [DashboardPage, MainComponent, MainGraffitiComponent, MonthlyComponent, CategoryNavComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DashboardPageRoutingModule
  ]
})
export class DashboardPageModule {}
