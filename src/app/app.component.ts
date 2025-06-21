import { Component } from '@angular/core';
import { addIcons } from 'ionicons';
import { Platform } from '@ionic/angular';

import {
  IonAccordion,
  IonAccordionGroup,
  IonApp,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonNote,
  IonPopover,
  IonRouterOutlet,
  IonTitle,
  IonToolbar,
  IonToggle, IonAvatar, IonCol, IonGrid, IonRow
} from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';

import { RouterLink, RouterLinkActive } from "@angular/router";

import {
  person, ellipsisVerticalOutline, personOutline, settingsOutline, powerOutline, homeOutline, cubeOutline,
  statsChartOutline, hardwareChipOutline, hammerOutline, warningOutline, timeOutline, peopleOutline,
  gitNetworkOutline
} from 'ionicons/icons';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: 'app.component.html',
  imports: [IonApp, RouterLink, IonMenu, IonToolbar, IonHeader, IonTitle, IonItem, IonIcon, IonLabel,
    IonButtons, IonButton, IonPopover, IonContent, IonList, IonMenuToggle, IonAccordionGroup,
    IonAccordion, IonFooter, IonNote, RouterLinkActive, IonRouterOutlet, IonToggle, FormsModule, IonAvatar, IonCol, IonGrid, IonRow],
})
export class AppComponent {
  darkMode = false
  username = ""
  constructor(private navCtrl: NavController
  ) {
    addIcons({ person, ellipsisVerticalOutline, personOutline, settingsOutline, powerOutline, homeOutline, cubeOutline, statsChartOutline, hardwareChipOutline, hammerOutline, warningOutline, timeOutline, peopleOutline, gitNetworkOutline });
    this.username = String(localStorage.getItem('user'))

    const theme = localStorage.getItem('theme');
    if (theme == null) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: light)');
      this.darkMode = prefersDark.matches;
      document.body.classList.toggle('dark', this.darkMode);
    } else {
      this.darkMode = theme == 'true' ? true : false;
      document.body.classList.toggle('dark', this.darkMode);
    }
  }

  ChangeColorMode() {
    document.body.classList.toggle('dark', this.darkMode);
    localStorage.setItem('theme', String(this.darkMode));
  }

  LogOut() {
    this.username = ""
    localStorage.setItem("isLogged", "false")
    this.navCtrl.navigateRoot('/login');
  }
  HandleClick(event: Event) {
    event.stopPropagation();
  }
}
