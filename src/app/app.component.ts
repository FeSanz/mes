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
  IonItemGroup,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonNote,
  IonPopover,
  IonRouterOutlet,
  IonTitle,
  IonToolbar,
  IonToggle
} from '@ionic/angular/standalone';

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
    IonButtons, IonButton, IonPopover, IonContent, IonList, IonMenuToggle, IonItemGroup, IonAccordionGroup,
    IonAccordion, IonFooter, IonNote, RouterLinkActive, IonRouterOutlet, IonToggle, FormsModule],
})
export class AppComponent {
  darkMode = false
  constructor(
    private platform: Platform
  ) {
    addIcons({
      person, ellipsisVerticalOutline, personOutline, settingsOutline, powerOutline, homeOutline, cubeOutline,
      statsChartOutline, hardwareChipOutline, hammerOutline, warningOutline, timeOutline, peopleOutline,
      gitNetworkOutline
    })
    this.platform.ready().then(() => {
      const theme = localStorage.getItem('theme');
      if (theme == null) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: light)');
        this.darkMode = prefersDark.matches;
        document.body.classList.toggle('dark', this.darkMode);
      } else {
        this.darkMode = theme == 'true' ? true : false;
        document.body.classList.toggle('dark', this.darkMode);
      }
    })
  }


  ChangeColorMode() {
    document.body.classList.toggle('dark', this.darkMode);
    localStorage.setItem('theme', String(this.darkMode));
  }
}
