import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton, IonButtons, IonCard, IonCol, IonContent, IonGrid, IonHeader, IonIcon,
  IonMenuButton, IonRow, IonTitle, IonToolbar
} from '@ionic/angular/standalone';

import { ApiService } from "../../../services/api.service";
import { EndpointsService } from "../../../services/endpoints.service";
import { AlertsService } from "../../../services/alerts.service";
import { addIcons } from "ionicons";

import {
  cloudOutline, serverOutline, personOutline, keyOutline, linkOutline, checkmarkCircle, timeOutline, syncOutline,
  globeOutline, alarmOutline, clipboardOutline, menuOutline, eyeOutline } from 'ionicons/icons';
import { CredentialsService } from "../../../services/credentials.service";
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
  host: string = "";
  user: string = "";
  pwd: string = "";
  server: string = "";
  credentials: string = "";

  statusMessage = 'Sin verificar';
  statusIcon = 'warning';
  statusColor = 'warning';
  canSave = false;

  btnSavaOrUpdate: string = "Guardar";

  userData: any = {};

  fusionCards = [
    {
      icon: 'globe-outline',
      iconClass: 'bg-pink',
      idModule: 'organizations',
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
      idModule: 'wc',
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
      idModule: 'items',
      moduleName: 'ARTÍCULOS PRODUCCIÓN'      
    },
    {
      icon: 'clipboard-outline',
      iconClass: 'bg-red',
      idModule: 'wo',
      moduleName: 'ORDENES DE TRABAJO'      
    }
  ];

  constructor(
    private apiService: ApiService,
    private credentialService: CredentialsService,
    private endPoints: EndpointsService,
    private alerts: AlertsService,
    private router: Router) {

    addIcons({menuOutline,timeOutline,eyeOutline,cloudOutline,serverOutline,personOutline,keyOutline,linkOutline,syncOutline,checkmarkCircle,globeOutline,alarmOutline,clipboardOutline});
    this.userData = JSON.parse(String(localStorage.getItem("userData")))
  }

  ngOnInit() {
    this.GetSettings();
  }

  GetSettings() {
    [this.host, this.credentials] = this.credentialService.Fusion();

    // Validación si se obtivieron los valores
    if (!this.host || !this.credentials) {
      console.log('Dirección y/o credenciales no encontrados');
      return;
    }

    try {
      const credentialsParts = atob(this.credentials).split(':');

      if (credentialsParts.length !== 2) {
        this.alerts.Error('Formato de credenciales inválido');
        return;
      }

      this.user = credentialsParts[0];
      this.pwd = credentialsParts[1];
      this.btnSavaOrUpdate = "Actualizar";

      this.statusMessage = 'Verificado';
      this.statusIcon = 'checkmark-circle';
      this.statusColor = 'success';

    } catch (error) {
      console.error('Error al decodificar credenciales:', error);
      this.alerts.Error('Error al procesar credenciales');
    }
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


  async SaveOrUpdateConnection() {
    const isUpdate = this.btnSavaOrUpdate === "Actualizar";

    const payload = {
      CompanyId: this.userData.Company.CompanyId,
      User: this.userData.Name,
      items: [
        {
          Name: "FUSION_URL",
          Value: this.host,
          ...(isUpdate ? {} : { Description: "Dirección para conexión con REST API Fusion" })
        },
        {
          Name: "FUSION_CREDENTIALS",
          Value: btoa(`${this.user}:${this.pwd}`),
          ...(isUpdate ? {} : { Description: "Credenciales para conexión con REST API Fusion" })
        }
      ]
    };
    console.log(payload);

    const apiCall = isUpdate
      ? await this.apiService.PutRequestRender('settingsFusion', payload)
      : await this.apiService.PostRequestRender('settingsFusion', payload);

    try {
      const response: any = await apiCall;
      if (response.errorsExistFlag) {
        this.alerts.Info(response.message);
      } else {
        this.alerts.Success(response.message);
      }
    } catch (error) {
      console.error('Error en SaveOrUpdateConnection:', error);
    }
  }


  RequestStatusConnection(statusCode: number) {
    if (statusCode >= 200 && statusCode <= 202) {
      this.statusMessage = 'Acceso autorizado';
      this.statusIcon = 'checkmark-circle';
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

      const m_modules = ['organizations', 'RegShifts', 'wc', 'machines', 'items', 'wo'];

      if (m_modules.includes(module)) {
        this.router.navigate([`/${module}`]);
      } else {
        console.log('Ruta desconocida:', module);
      }
  }

  protected readonly ToggleMenu = ToggleMenu;

}

