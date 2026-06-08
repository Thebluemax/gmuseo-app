import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'gm-monthly-graffitis',
    templateUrl: './monthly.component.html',
    styleUrls: ['./monthly.component.scss'],
    standalone: false
})
export class MonthlyComponent {

  @Input() graffitiList: any[] = [];
  constructor() { }

}
