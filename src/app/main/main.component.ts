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
export class MainComponent {

  private mainGraffiti: Graffiti = {
    name: 'Main Graffiti',
    description: 'This is the main graffiti',
    image: 'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_1900.jpg',
    id: 1
  } 

  private monthlyList: Graffiti[] = [
{
    name: 'Main Graffiti',
    description: 'This is the main graffiti',
    image: 'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_350.jpg',
    id: 1
  } ,
{
  name: 'Main Graffiti',
  description: 'This is the main graffiti',
  image: 'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_350.jpg',
  id: 12
} ,
{
name: 'Main Graffiti',
description: 'This is the main graffiti',
image: 'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_350.jpg',
id: 13
} ,
{
name: 'Main Graffiti',
description: 'This is the main graffiti',
image: 'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_350.jpg',
id: 14
} ,
{
name: 'Main Graffiti',
description: 'This is the main graffiti',
image: 'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_350.jpg',
id: 15
} 
  ];

  constructor() { }


  getMainGraffiti() {
    return this.mainGraffiti;
  }

  getMonthlyList() {
    return this.monthlyList;
  }

<<<<<<< HEAD
=======
  getCategoryList() {
    return [];//this.categoryList;
  }

>>>>>>> develop
}
