import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol,
  IonSpinner, IonText,
} from '@ionic/angular/standalone';
import { CategoryService } from 'src/app/catalog/application/category.service';

@Component({
  selector: 'app-category',
  templateUrl: './category.page.html',
  styleUrls: ['./category.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol,
    IonSpinner, IonText,
    RouterLink,
  ],
})
export class CategoryPage implements OnInit {
  private categoryService = inject(CategoryService);

  readonly categories = this.categoryService.categories;
  readonly loading = this.categoryService.loading;
  readonly error = this.categoryService.error;

  async ngOnInit() {
    await this.categoryService.loadList();
    // Covers are decoration: the grid renders on the list alone and each cell
    // swaps its fallback for a real photo whenever that photo arrives.
    void this.categoryService.loadCovers(this.categories());
  }

  coverFor(categoryId: string): string {
    return this.categoryService.coverFor(categoryId);
  }
}
