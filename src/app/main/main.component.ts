import { Component, OnInit } from '@angular/core';
import { Graffiti } from '../models/graffiti';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent  implements OnInit {

  private mainGraffiti: Graffiti = {
    name: 'Main Graffiti',
    description: 'This is the main graffiti',
    image: 'http://localhost:9444/ui/graffitis/242bc7081155cbc9a3fe6e78fdcdcb0b_700.jpg',
    id: 1
  } 

  constructor() { }

  ngOnInit() {}

  getMainGraffiti() {
    return this.mainGraffiti;
  }

}
