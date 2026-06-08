import { Component, Input, OnInit } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonGrid, IonRow, IonCol, IonCard } from '@ionic/angular/standalone';
import { Category } from 'src/app/models/category';

@Component({
  selector: 'gm-category-nav',
  templateUrl: './category-nav.component.html',
  styleUrls: ['./category-nav.component.scss'],
  standalone: true,
  imports: [IonGrid, IonRow, IonCol, IonCard, RouterLink, UpperCasePipe],
})
export class CategoryNavComponent implements OnInit {
  listProcessed: Category[][] = [];
  @Input() categories: Category[] = [];

  ngOnInit() {
    this.listProcessed = this.orderListByColumns(this.categories);
  }

  orderListByColumns(list: Category[]) {
    return list
      .map((e, i) => (i % 2 === 0 ? list.slice(i, i + 2) : []))
      .filter((e) => e.length === 2 || e.length === 1);
  }
}
