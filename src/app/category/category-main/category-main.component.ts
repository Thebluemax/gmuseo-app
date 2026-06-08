import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';
import { CategoryMock } from 'src/app/mocks/category.mock';
import { Category } from 'src/app/models/category';

@Component({
  selector: 'app-category-main',
  templateUrl: './category-main.component.html',
  styleUrls: ['./category-main.component.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol,
    RouterLink,
  ],
})
export class CategoryMainComponent implements OnInit {
  category: Category | null = null;

  ngOnInit() {
    this.category = new CategoryMock().getCategory(1);
    this.category.graffitis = new CategoryMock().getCategoryGraffitis();
  }
}
