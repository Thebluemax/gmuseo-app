import { Component, Input } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { Graffiti } from 'src/app/models/graffiti';

@Component({
  selector: 'gm-main-graffiti',
  templateUrl: './main-graffiti.component.html',
  styleUrls: ['./main-graffiti.component.scss'],
  standalone: true,
  imports: [UpperCasePipe],
})
export class MainGraffitiComponent {
  @Input() graffiti: Graffiti | null = null;
}
