import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonMenuButton, IonButtons, IonIcon, IonButton } from '@ionic/angular/standalone';
import { ToggleMenu } from 'src/app/models/design';

@Component({
  selector: 'app-user',
  templateUrl: './user.page.html',
  styleUrls: ['./user.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonMenuButton, IonButtons, IonIcon, IonButton]
})
export class UserPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  protected readonly ToggleMenu = ToggleMenu;
}
