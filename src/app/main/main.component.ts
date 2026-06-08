import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonContent, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';
import { MainGraffitiComponent } from '../components/main-graffiti/main-graffiti.component';
import { MonthlyComponent } from '../components/monthly/monthly.component';
import { CategoryNavComponent } from '../components/category-nav/category-nav.component';
import { Graffiti } from '../models/graffiti';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonContent, IonGrid, IonRow, IonCol,
    MainGraffitiComponent, MonthlyComponent, CategoryNavComponent,
  ],
})
export class MainComponent {
  private mainGraffiti: Graffiti = {
    name: 'Main Graffiti',
    description: 'This is the main graffiti',
    image: 'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_1900.jpg',
    id: 1,
  };

  private monthlyList: Graffiti[] = [
    { name: 'Main Graffiti', description: 'This is the main graffiti', image: 'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_350.jpg', id: 1 },
    { name: 'Main Graffiti', description: 'This is the main graffiti', image: 'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_350.jpg', id: 12 },
    { name: 'Main Graffiti', description: 'This is the main graffiti', image: 'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_350.jpg', id: 13 },
    { name: 'Main Graffiti', description: 'This is the main graffiti', image: 'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_350.jpg', id: 14 },
    { name: 'Main Graffiti', description: 'This is the main graffiti', image: 'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_350.jpg', id: 15 },
  ];

  getMainGraffiti() {
    return this.mainGraffiti;
  }

  getMonthlyList() {
    return this.monthlyList;
  }

  getCategoryList() {
    return [];
  }
}
