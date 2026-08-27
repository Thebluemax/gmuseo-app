import { Component, computed, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol,
  IonSpinner, IonText,
} from '@ionic/angular/standalone';
import { CategoryService } from 'src/app/catalog/application/category.service';
import { GraffitiService } from 'src/app/graffiti/application/services/graffiti.service';
import type { Graffiti } from 'src/app/graffiti/domain/models/graffiti.model';

@Component({
  selector: 'app-category-main',
  templateUrl: './category-main.component.html',
  styleUrls: ['./category-main.component.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol,
    IonSpinner, IonText,
    RouterLink,
  ],
})
export class CategoryMainComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private categoryService = inject(CategoryService);
  private graffitiService = inject(GraffitiService);

  readonly category = this.categoryService.selected;
  readonly graffitis = computed(() => this.graffitiService.graffitiList()?.data ?? []);
  readonly loading = computed(
    () => this.categoryService.loading() || this.graffitiService.loading()
  );
  readonly error = computed(
    () => this.categoryService.error() ?? this.graffitiService.error()
  );

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('category');
    if (!id) return;

    await Promise.all([
      this.categoryService.loadOne(id),
      this.graffitiService.fetchList({ category: id }),
    ]);
    void this.categoryService.loadCovers([{ id, name: '', description: '' }]);
  }

  coverFor(categoryId: string): string {
    return this.categoryService.coverFor(categoryId);
  }

  /** Grid cells are small: prefer the `sm` variant, fall back to the cover. */
  thumbnail(graffiti: Graffiti): string {
    for (const sighting of graffiti.sightings) {
      const photo = sighting.photos[0];
      if (photo) return photo.files.sm;
    }

    return graffiti.cover;
  }
}
