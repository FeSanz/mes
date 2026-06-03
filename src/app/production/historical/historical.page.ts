import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonLabel, IonMenuButton, IonIcon, IonButton, IonRouterLink, IonRefresher, RefresherCustomEvent, IonRefresherContent,
} from '@ionic/angular/standalone';
import { AlertsService } from 'src/app/services/alerts.service';
import { ApiService } from 'src/app/services/api.service';
import { WebSocketService } from 'src/app/services/web-socket.service';

import { Button } from "primeng/button";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { InputText } from "primeng/inputtext";
import { PrimeTemplate } from "primeng/api";
import { Table, TableModule } from "primeng/table";
import { Tag } from "primeng/tag";
import { FloatLabel } from "primeng/floatlabel";
import { Select } from "primeng/select";
import { PermissionsService } from 'src/app/services/permissions.service';
import { RouterLink } from "@angular/router";
import { addIcons } from 'ionicons';
import { addOutline, checkmarkOutline, closeOutline, hammerOutline, trashOutline, menuOutline, pencilOutline, timeOutline, hourglassOutline } from 'ionicons/icons';
import { ToggleMenu } from 'src/app/models/design';
import { DialogModule } from 'primeng/dialog';
import { Dialog } from "primeng/dialog";


@Component({
  selector: 'app-historical',
  templateUrl: './historical.page.html',
  styleUrls: ['./historical.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonLabel, IonIcon, IonButton, IonRouterLink, RouterLink, IonRefresher, IonRefresherContent,
    IonMenuButton, Button, IconField, InputIcon, InputText, PrimeTemplate, TableModule, DialogModule, Dialog, Tag, FloatLabel, Select]
})
export class HistoricalPage {

  searchValueAl: string = '';
  scrollHeight: string = '90%';
  rowsPerPage: number = 19;
  rowsPerPageOptions: number[] = [5, 10, 20];
  progressValue: number[] = [0, 100];
  userData: any = {};
  alertsData: any = []
  finalicedAlertsData: any = []
  organizationSelected: string | any = '';
  company: any = {}
  isEditAlertModalOpen = false
  failures: any = []
  newAlert: any = {}
  selectedFailure: any = null;
  machines: any = []
  filteredFailures: any = [];
  searchTerm = '';
  selectedAlert: any = {}
  selectedArea = '';
  selectedType = '';
  uniqueAreas: any = [];
  uniqueTypes: any[] = [];
  timer: any;
  constructor(
    public alerts: AlertsService,
    private apiService: ApiService,
    private websocket: WebSocketService,
    public permissions: PermissionsService,
    private changeDetector: ChangeDetectorRef) {
    this.userData = JSON.parse(String(localStorage.getItem("userData")));
    this.company = this.userData.Company
    this.organizationSelected = localStorage.getItem("organizationSelected") ? JSON.parse(localStorage.getItem("organizationSelected") || '{}') : this.userData.Company.Organizations[0]
    addIcons({ menuOutline, timeOutline, hammerOutline, hourglassOutline, pencilOutline, checkmarkOutline, trashOutline, addOutline, closeOutline });
  }


  ionViewDidEnter() {
    this.GetDevices()
  }


  GetDevices() {
    localStorage.setItem("organizationSelected", JSON.stringify(this.organizationSelected))
    const orgsIds = this.organizationSelected.OrganizationId//this.userData.Company.Organizations.map((org: any) => org.OrganizationId).join(',');//IDs separados por coma (,)
    this.apiService.GetRequestRender(`alertsByOrganizations/pendings?organizations=${orgsIds}` + (this.permissions.isAndon() ? '?start_date=' + new Date().setHours(10, 0, 0, 0) : '')).then((response: any) => {
      if (!response.errorsExistFlag) {
        //this.alertsData = response.items
      } else {
        this.alerts.Error(response.error)
      }

    }).catch(error => {
      console.error('Error al obtener OTs:', error);
    });
  }
  protected readonly ToggleMenu = ToggleMenu;
}
