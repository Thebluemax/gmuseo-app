import { Component } from '@angular/core';
import { IonTabs } from '@ionic/angular/standalone';

@Component({
  selector: 'gm-tabs',
  templateUrl: './tabs.page.html',
  standalone: true,
  imports: [IonTabs],
})
export class TabsPage {}
