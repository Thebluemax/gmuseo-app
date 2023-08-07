import { Component, Input, OnInit } from '@angular/core';
import { Category } from 'src/app/models/category';

@Component({
  selector: 'gm-category-nav',
  templateUrl: './category-nav.component.html',
  styleUrls: ['./category-nav.component.scss'],
})
export class CategoryNavComponent  implements OnInit {
  listProcessed: Category[][] = [];
  @Input() categories: Category[] = [];
  constructor() { }

  ngOnInit() {
    this.listProcessed = this.orderListByColumns(this.categories);
  }

  orderListByColumns(list: Category[]) {
    return list.map((e, i) => {
     return i%2 == 0 ? list.slice(i, i + 2) : [];
    }).filter((e) => e.length === 2 || e.length === 1);
  }

}
