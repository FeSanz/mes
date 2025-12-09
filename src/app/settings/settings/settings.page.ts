import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonCard, IonButton, IonIcon, IonButtons, IonMenuButton, IonInput, IonItem,
  IonText, IonLabel, IonList, IonItemGroup, IonListHeader, IonToggle
} from '@ionic/angular/standalone';
import { ToggleMenu } from "../../models/design";
import { menuOutline, settings } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { AlertsService } from 'src/app/services/alerts.service';
import { ApiService } from 'src/app/services/api.service';
import { PermissionsService } from 'src/app/services/permissions.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonCard, IonButton, IonIcon, IonButtons, IonMenuButton, IonInput, IonItem,
    IonText, IonLabel, IonList, IonItemGroup, IonListHeader, IonToggle, CommonModule, FormsModule]
})
export class SettingsPage {
  alerts: any = { Value: false }
  pushNotifications: any = { Value: false }
  emails: any = { Value: false }

  userData: any = {};
  constructor(
    private apiService: ApiService,
    public permissions: PermissionsService,
    private changeDetector: ChangeDetectorRef) {
    this.userData = JSON.parse(String(localStorage.getItem("userData")));
    addIcons({ menuOutline });
  }

  ionViewDidEnter() {
    this.GetSettings();
  }

  GetSettings() {
    this.apiService.GetRequestRender(`settings/${this.userData.Company.CompanyId}`).then((response: any) => {

      if (!response.errorsExistFlag) {
        this.alerts = response.items.find((item: any) => item.Name == "ALERTS_FLAG");
        this.pushNotifications = response.items.find((item: any) => item.Name == "PUSH_FLAG");
        this.emails = response.items.find((item: any) => item.Name == "EMAIL_FLAG");
      } else {
        this.alerts.Error(response.error)
      }

    }).catch(error => {
      console.error('Error al obtener OTs:', error);
    });
  }
  ChangeStatus(id: any, ev: any) {
    const payload = {
      setting_id: id,
      value: ev.detail.checked,
      username: this.userData.Name
    }
    this.apiService.PutRequestRender('alerts/settings/update', payload).then(response => {
      if (!response.errorsExistFlag) {
      } else {
        this.alerts.Error("Error al activar/desactivar este tipo de notificaciones.");
      }
    });
  }
  protected readonly ToggleMenu = ToggleMenu;
}
