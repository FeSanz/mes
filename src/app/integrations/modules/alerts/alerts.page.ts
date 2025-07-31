import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonIcon, IonFab, IonFabButton, IonItem, IonButton, IonSelectOption, IonText, IonModal, IonInput, IonSelect, IonSearchbar } from '@ionic/angular/standalone';
import { AlertsService } from 'src/app/services/alerts.service';
import { ApiService } from 'src/app/services/api.service';
import { EndpointsService } from 'src/app/services/endpoints.service';
import { WebSocketService } from 'src/app/services/web-socket.service';

import { Button } from "primeng/button";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { InputText } from "primeng/inputtext";
import { PrimeTemplate } from "primeng/api";
import { TableModule } from "primeng/table";
import { Tag } from "primeng/tag";
import { ProgressBar } from "primeng/progressbar";
import { Slider } from "primeng/slider";
import { FloatLabel } from "primeng/floatlabel";
import { Select } from "primeng/select";
import { PermissionsService } from 'src/app/services/permissions.service';
import { addIcons } from 'ionicons';
import { addOutline, checkmarkOutline, closeOutline, trashOutline } from 'ionicons/icons';
@Component({
  selector: 'app-alerts',
  templateUrl: './alerts.page.html',
  styleUrls: ['./alerts.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonIcon, IonFab, IonFab, IonFabButton, IonItem, IonButton, IonSelectOption, IonText, IonModal, IonInput, IonSelect, IonMenuButton, Button, IconField, InputIcon, InputText, PrimeTemplate, TableModule,
    Tag, ProgressBar, Slider, FloatLabel, Select, IonSearchbar]
})
export class AlertsPage {
  searchValueAl: string = '';
  scrollHeight: string = '550px';
  rowsPerPage: number = 10;
  rowsPerPageOptions: number[] = [5, 10, 20];
  progressValue: number[] = [0, 100];
  userData: any = {};
  alertsData: any = []
  organizationSelected: string | any = '';
  company: any = {}
  isModalOpen = false
  failures: any = []
  newAlert: any = {}
  selectedFailureId: number | null = null;
  machines: any = []
  filteredFailures: any = [];
  searchTerm = '';
  selectedArea = '';
  selectedType = '';
  selectedMachine = 0;
  uniqueAreas: any = [];
  uniqueTypes: any[] = [];
  constructor(
    private alerts: AlertsService,
    private apiService: ApiService,
    private endPoints: EndpointsService,
    private websocket: WebSocketService,
    public permissions: PermissionsService,) {
    this.userData = JSON.parse(String(localStorage.getItem("userData")));
    this.company = this.userData.Company

    addIcons({ trashOutline, addOutline, closeOutline, checkmarkOutline });
  }
  ionViewDidEnter() {
    this.GetAlerts()
  }
  GetAlerts() {
    const orgsIds = this.userData.Company.Organizations.map((org: any) => org.OrganizationId).join(',');//IDs separados por coma (,)
    this.apiService.GetRequestRender(`alertsByOrganizations?organizations=${orgsIds}`).then((response: any) => {
      if (!response.errorsExistFlag) {
        this.alertsData = response.items        
      } else {
        this.alerts.Error(response.error)
      }
      this.apiService.GetRequestRender(`failuresByCompany/${this.company.CompanyId}`, false).then((response: any) => {
        this.failures = response.items
        this.loadFailures()
        const orgsIds = this.userData.Company.Organizations.map((org: any) => org.OrganizationId).join(',');//IDs separados por coma (,)
        this.apiService.GetRequestRender(`machinesByOrganizations?organizations=${orgsIds}`, false).then((response: any) => {
          this.machines = response.items
          this.selectedMachine = response.items[0].machine_id
        })
      }).catch(error => {
        console.error('Error al obtener fallas:', error);
      });
    }).catch(error => {
      console.error('Error al obtener OTs:', error);
    });
  }

  OnAdvanceFilter(values: number[], filterCallback: any) {
    this.progressValue = values;
    filterCallback(values);
  }
  OnFilterGlobal(event: Event, table: any) {
    const target = event.target as HTMLInputElement;
    table.filterGlobal(target.value, 'contains');
  }

  ClearWorkOrders(table: any) {
    table.clear();
    this.searchValueAl = '';
    this.progressValue = [0, 100];
  }
  ShowNewAlert() {
    this.isModalOpen = true

  }
  AddNewAlert() {
    const body = {
      machine_id: this.selectedMachine,
      failure_id: this.selectedFailureId
    }
    this.apiService.PostRequestRender('alerts', body).then((response: any) => {
      this.isModalOpen = false
      this.GetAlerts()
    })
  }
  async DeleteAlert(alertId: any) {
    
    if (await this.alerts.ShowAlert("¿Deseas eliminar esta alerta?", "Alerta", "Atrás", "Eliminar")) {
      this.apiService.DeleteRequestRender('alerts/' + alertId).then((response: any) => {
        if (!response.errorsExistFlag) {
          this.GetAlerts()
          this.alerts.Success("Alerta eliminada")
        } else {
          this.alerts.Info(response.error)
        }
      })
    }
  }
  loadFailures() {
    // después de cargar las fallas
    this.filteredFailures = this.failures;
    this.uniqueAreas = [...new Set(this.failures.map((f: any) => f.area))];
    this.uniqueTypes = [...new Set(this.failures.map((f: any) => f.type))];
    this.applyFilters();
  }

  applyFilters() {
    this.filteredFailures = this.failures.filter((f: any) => {
      const matchSearch = f.name.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchArea = !this.selectedArea || f.area === this.selectedArea;
      const matchType = !this.selectedType || f.type === this.selectedType;
      return matchSearch && matchArea && matchType;
    });
  }

  ngDoCheck() {
    this.filteredFailures = this.failures.filter((f: any) => {
      const matchSearch = f.name.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchArea = !this.selectedArea || f.area === this.selectedArea;
      const matchType = !this.selectedType || f.type === this.selectedType;
      return matchSearch && matchArea && matchType;
    });
  }
  SelectFail(fail: any) {
    this.selectedFailureId = fail.failure_id; // o fail.id si se llama diferente
  }
}
