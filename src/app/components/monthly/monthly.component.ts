import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'gm-monthly-graffitis',
  templateUrl: './monthly.component.html',
  styleUrls: ['./monthly.component.scss'],
})
export class MonthlyComponent  implements OnInit {

  @Input() graffitiList: any[] = [];
  constructor() { }

  ngOnInit() {}

}
