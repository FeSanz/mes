import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonButtons, IonCard, IonCol,
  IonContent, IonGrid,
  IonHeader,
  IonIcon, IonInput, IonItem, IonLabel,
  IonMenuButton, IonRow, IonText,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';

import {ApiService} from "../../../services/api.service";
import {EndpointsService} from "../../../services/endpoints.service";
import {AlertsService} from "../../../services/alerts.service";
import {addIcons} from "ionicons";

import {
  cloudOutline,
  serverOutline,
  personOutline,
  keyOutline,
  linkOutline,
  checkmarkCircle,
  timeOutline,
  syncOutline,
  globeOutline,
  alarmOutline,
  clipboardOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-connection',
  templateUrl: './connection.page.html',
  styleUrls: ['./connection.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonMenuButton,
    IonIcon, IonItem, IonLabel, IonInput, IonButton, IonCard, IonText, IonGrid, IonRow, IonCol]
})
export class ConnectionPage implements OnInit {
  host: string = "";
  user: string = "";
  pwd: string = "";
  server: string = "";
  credentials: string = "";

  statusMessage = 'Sin verificar';
  statusIcon = 'warning';
  statusColor = 'warning';
  canSave = false;

  fusionCards = [
    {
      icon: 'globe-outline',
      iconClass: 'bg-pink',
      idModule: 'organizations',
      moduleName: 'ORGANIZACIONES',
      updateDate: '10/04/2024 10:25:12'
    },
    {
      icon: 'alarm-outline',
      iconClass: 'bg-purple',
      idModule: 'shifts',
      moduleName: 'TURNOS',
      updateDate: '10/04/2024 10:25:12'
    },
    {
      icon: 'settings-outline',
      iconClass: 'bg-blue',
      idModule: 'resources',
      moduleName: 'MÁQUINAS',
      updateDate: '10/04/2024 10:25:12'
    },
    {
      icon: 'cube-outline',
      iconClass: 'bg-red',
      idModule: 'items',
      moduleName: 'ARTÍCULOS PRODUCCIÓN',
      updateDate: '10/04/2024 10:25:12'
    },
    {
      icon: 'clipboard-outline',
      iconClass: 'bg-red',
      idModule: 'wo',
      moduleName: 'ORDENES DE TRABAJO',
      updateDate: '10/04/2024 10:25:12'
    }
  ];

  constructor(
    private apiService: ApiService,
    private endPoints: EndpointsService,
    private alerts: AlertsService,
    private router: Router) {

    addIcons({   cloudOutline,
      serverOutline,
      personOutline,
      keyOutline,
      linkOutline,
      checkmarkCircle,
      timeOutline,
      syncOutline,
      globeOutline,
      alarmOutline,
      clipboardOutline});
  }

  ngOnInit() {
    this.loadSavedConnection();
  }

  loadSavedConnection(): void {
    const savedServer = localStorage.getItem('server');
    const savedCredentials = localStorage.getItem('credentials');

    if (savedServer && savedCredentials) {
      this.host = savedServer;
      this.credentials = savedCredentials;

      try {
        const decoded = atob(savedCredentials);
        this.user = decoded.split(':')[0];
        this.pwd = decoded.split(':')[1];
      } catch (error) {
        this.alerts.Error('Error al decodificar credenciales guardadas');
      }
    }
  }

  async VerifyConnection(){
    this.server = `https://${this.host}/fscmRestApi/resources/latest`;
    this.credentials = btoa(`${this.user}:${this.pwd}`);
    this.apiService.AuthRequestFusion(this.endPoints.Path('auth', this.server), this.credentials).then(async (response: any) => {
      this.RequestStatusConnection(response);
    });
  }

  async SaveConnection(){
    if (this.host != "" && this.user != "" && this.pwd != "") {
      localStorage.setItem('server', this.host);
      localStorage.setItem('credentials', btoa(`${this.user}:${this.pwd}`));
      await this.alerts.Success('Guardado correctamente');
    } else {
      await this.alerts.Warning('Completar todos los campos');
    }
  }


  RequestStatusConnection(statusCode: number){
    if (statusCode >= 200 && statusCode <= 202) {
      this.statusMessage = 'Acceso autorizado';
      this.statusIcon = 'warning'; //checkmark-circle';
      this.statusColor = 'success';
      this.canSave = true;
    }
    else if (statusCode == 400) {
      this.statusMessage = 'Solicitud incorrecta del cliente';
      this.statusIcon = 'close-circle';
      this.statusColor = 'danger';
      this.canSave = false;
    }
    else if (statusCode == 401) {
      this.statusMessage = 'Acceso no autorizado';
      this.statusIcon = 'lock-closed';
      this.statusColor = 'warning';
      this.canSave = false;
    }
    else if (statusCode == 403) {
      this.statusMessage = 'Autorizado pero sin acceso a datos';
      this.statusIcon = 'alert-circle';
      this.statusColor = 'danger';
      this.canSave = true;
    }
    else if (statusCode == 404) {
      this.statusMessage = 'Solicitud no encontrada';
      this.statusIcon = 'close-circle';
      this.statusColor = 'danger';
      this.canSave = false;
    }
    else if (statusCode == 405) {
      this.statusMessage = 'Método de la solicitud no admitido';
      this.statusIcon = 'close-circle';
      this.statusColor = 'danger';
      this.canSave = false;
    }
    else if (statusCode == 500) {
      this.statusMessage = 'Error interno del servidor';
      this.statusIcon = 'close-circle';
      this.statusColor = 'danger';
      this.canSave = false;
    }
    else {
      this.statusMessage = `Error al procesar la solicitud (${statusCode})`;
      this.statusIcon = 'alert-circle';
      this.statusColor = 'danger';
      this.canSave = false;
    }
  }

  navigateToModule(module: string) {
    if (document.activeElement && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur(); //Desenfocar el elemento activo antes de navegar
    }

    const m_modules = ['organizations', 'shifts', 'resources', 'items', 'wo'];

    if (m_modules.includes(module)) {
      this.router.navigate([`/${module}`]);
    } else {
      console.log('Ruta desconocida:', module);
    }
  }
}
