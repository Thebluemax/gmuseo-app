import { Component, Input, OnInit } from '@angular/core';
import { Category } from 'src/app/models/category';

@Component({
  selector: 'gm-category-nav',
  templateUrl: './category-nav.component.html',
  styleUrls: ['./category-nav.component.scss'],
})
export class CategoryNavComponent  implements OnInit {
  @Input() categories: Category[] = [];
  constructor() { }

  ngOnInit() {}

}
