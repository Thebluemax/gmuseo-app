import { Component, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';
import { CategoryMock } from 'src/app/mocks/category.mock';
import { Category } from 'src/app/models/category';

@Component({
  selector: 'app-category',
  templateUrl: './category.page.html',
  styleUrls: ['./category.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol],
})
export class CategoryPage implements OnInit {
  private categories: Category[] = [];

  ngOnInit() {
    this.categories = new CategoryMock().getCategoryList();
    this.loadGraffitis();
  }

  getCategories(): Category[] {
    return this.categories;
  }

  loadGraffitis() {
    this.categories.forEach((category) => {
      category.graffitis = new CategoryMock().getCategoryGraffitis();
    });
  }
}
