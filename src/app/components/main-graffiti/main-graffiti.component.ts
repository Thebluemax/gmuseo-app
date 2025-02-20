import { Component, Input, OnInit } from '@angular/core';
import { Graffiti } from 'src/app/models/graffiti';

@Component({
  selector: 'gm-main-graffiti',
  templateUrl: './main-graffiti.component.html',
  styleUrls: ['./main-graffiti.component.scss'],
})
export class MainGraffitiComponent {

  @Input() graffiti: Graffiti | null = null;
  constructor() { }

}
