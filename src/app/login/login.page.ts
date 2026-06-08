import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-login',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
    standalone: false
})
export class LoginPage {

  email: string;
  password: string;
  constructor() {
    this.email = '';
    this.password = '';
   }
  login() {
    console.log(this.email);
  }

}
