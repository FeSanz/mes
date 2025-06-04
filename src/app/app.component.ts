import { Component } from '@angular/core';
import { addIcons } from 'ionicons';

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
  IonToolbar
} from '@ionic/angular/standalone';

import {RouterLink, RouterLinkActive, RouterOutlet} from "@angular/router";

import {person, ellipsisVerticalOutline, personOutline, settingsOutline, powerOutline, homeOutline, cubeOutline,
        statsChartOutline, hardwareChipOutline, hammerOutline, warningOutline, timeOutline, peopleOutline,
        gitNetworkOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: 'app.component.html',
  imports: [IonApp, RouterLink, IonMenu, IonToolbar, IonHeader, IonTitle, IonItem, IonIcon, IonLabel,
    IonButtons, IonButton, IonPopover, IonContent, IonList, IonMenuToggle, IonItemGroup, IonAccordionGroup,
    IonAccordion, IonFooter, IonNote, RouterLinkActive, RouterOutlet, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    addIcons({person, ellipsisVerticalOutline, personOutline, settingsOutline, powerOutline, homeOutline, cubeOutline,
              statsChartOutline, hardwareChipOutline, hammerOutline, warningOutline, timeOutline, peopleOutline,
              gitNetworkOutline})
  }
}
