import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonSpinner, IonText,
} from '@ionic/angular/standalone';
import { CategoryService } from '../../application/category.service';

@Component({
  selector: 'gm-categories',
  templateUrl: './categories.page.html',
  styleUrls: ['./categories.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonSpinner, IonText,
    RouterLink,
  ],
})
export class CategoriesPage implements OnInit {
  private categoryService = inject(CategoryService);

  readonly categories = this.categoryService.categories;
  readonly loading = this.categoryService.loading;
  readonly error = this.categoryService.error;

  ngOnInit() {
    this.categoryService.loadList();
  }
}
