import { Component, OnInit } from '@angular/core';
import { CategoryMock } from 'src/app/mocks/category.mock';
import { Category } from 'src/app/models/category';

@Component({
  selector: 'app-category-main',
  templateUrl: './category-main.component.html',
  styleUrls: ['./category-main.component.scss'],
})
export class CategoryMainComponent  implements OnInit {
  category:Category | null = null;
  constructor() { }

  ngOnInit() {
    this.category = new CategoryMock().getCategory(1);
    
  }

}
