import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonButtons, IonContent, IonHeader, IonMenuButton, IonTitle, IonToolbar} from '@ionic/angular/standalone';

@Component({
  selector: 'app-ready',
  templateUrl: './ready.page.html',
  styleUrls: ['./ready.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonMenuButton]
})
export class ReadyPage implements OnInit {

  xdara: any = {};

  constructor() { }

  ngOnInit() {
    this.xdara = JSON.parse(String(localStorage.getItem("userData")));
  }

}
