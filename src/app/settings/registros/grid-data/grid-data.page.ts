import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton, IonButtons, IonCard, IonCol, IonContent, IonGrid, IonHeader, IonIcon,
  IonMenuButton, IonRow, IonTitle, IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from "ionicons";

import {
  cloudOutline, serverOutline, personOutline, keyOutline, linkOutline, checkmarkCircle, timeOutline, syncOutline,
  globeOutline, alarmOutline, clipboardOutline, menuOutline, eyeOutline } from 'ionicons/icons';
import { ToggleMenu } from 'src/app/models/design';

@Component({
  selector: 'app-grid-data',
  templateUrl: './grid-data.page.html',
  styleUrls: ['./grid-data.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonMenuButton,
    IonIcon, IonButton, IonCard, IonGrid, IonRow, IonCol]
})
export class GridDataPage implements OnInit {

  userData: any = {};

  fusionCards = [
    {
      icon: 'globe-outline',
      iconClass: 'bg-pink',
      idModule: 'RegOrganizations',
      moduleName: 'ORGANIZACIONES'      
    },
    {
      icon: 'alarm-outline',
      iconClass: 'bg-purple',
      idModule: 'RegShifts',
      moduleName: 'TURNOS'      
    },
    {
      icon: 'git-network-outline',
      iconClass: 'bg-blue',
      idModule: 'work-centers',
      moduleName: 'CENTROS DE TRABAJO'      
    },
    {
      icon: 'settings-outline',
      iconClass: 'bg-blue',
      idModule: 'machines',
      moduleName: 'MÁQUINAS'      
    },
    {
      icon: 'cube-outline',
      iconClass: 'bg-purple',
      idModule: 'RegItems',
      moduleName: 'ARTÍCULOS PRODUCCIÓN'      
    },
    {
      icon: 'clipboard-outline',
      iconClass: 'bg-red',
      idModule: 'work-orders',
      moduleName: 'ORDENES DE TRABAJO'      
    }
  ];

  constructor(
    private router: Router) {

    addIcons({menuOutline,timeOutline,eyeOutline,cloudOutline,serverOutline,personOutline,keyOutline,linkOutline,syncOutline,checkmarkCircle,globeOutline,alarmOutline,clipboardOutline});
    this.userData = JSON.parse(String(localStorage.getItem("userData")))
  }

  ngOnInit() {    
  }

  navigateToModule(module: string) {    
      if (document.activeElement && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur(); //Desenfocar el elemento activo antes de navegar
      }

      const m_modules = ['RegOrganizations', 'RegShifts', 'work-centers', 'machines', 'RegItems', 'work-orders'];

      if (m_modules.includes(module)) {
        this.router.navigate([`/${module}`]);
      } else {
        console.log('Ruta desconocida:', module);
      }
  }

  protected readonly ToggleMenu = ToggleMenu;

}

