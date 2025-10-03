import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { IonFab, IonFabButton, IonIcon, IonMenuButton } from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { ToggleMenu } from 'src/app/models/design';
import {
  IonButton,
  IonButtons,
  IonModal,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-test',
  templateUrl: './test.page.html',
  styleUrls: ['./test.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonFab, IonFabButton, IonIcon, IonButton, IonMenuButton,
    IonButtons,
    IonModal,]
})
export class TestPage implements OnInit {

  isModalOpen = false;
  constructor() {
    addIcons({ add });
  }

  ngOnInit() {
  }

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }
  protected readonly ToggleMenu = ToggleMenu;
}
