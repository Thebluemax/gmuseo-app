import { Component, OnInit } from '@angular/core';
import { Graffiti } from '../models/graffiti';
import { Category } from '../models/category';
import { CategoryMock } from '../mocks/category.mock';
import { GraffitiMock } from '../mocks/graffti.mock';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent  implements OnInit {

  private mainGraffiti: Graffiti = new GraffitiMock().getGraffiti();

  private monthlyList: Graffiti[] = new GraffitiMock().getGraffitiList();

  private categoryList: Category[] = new CategoryMock().getCategoryList();

  constructor() { }

  ngOnInit() {}

  getMainGraffiti() {
    return this.mainGraffiti;
  }

  getMonthlyList() {
    return this.monthlyList;
  }

  getCategoryList() {
    return this.categoryList;
  }

}
