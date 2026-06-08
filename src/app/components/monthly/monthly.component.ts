import { Component, Input } from '@angular/core';

@Component({
  selector: 'gm-monthly-graffitis',
  templateUrl: './monthly.component.html',
  styleUrls: ['./monthly.component.scss'],
  standalone: true,
  imports: [],
})
export class MonthlyComponent {
  @Input() graffitiList: any[] = [];
}
