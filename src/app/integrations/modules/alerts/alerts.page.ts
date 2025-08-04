import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, ViewChild } from '@angular/core';
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
import { Table, TableModule } from "primeng/table";
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
  scrollHeight: string = '90%';
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
  selectedFailure: any = null;
  machines: any = []
  filteredFailures: any = [];
  searchTerm = '';
  selectedArea = '';
  selectedType = '';
  selectedMachine = 0;
  uniqueAreas: any = [];
  uniqueTypes: any[] = [];
  timer: any;
  @ViewChild('dtAlerts') table!: Table;
  constructor(
    private alerts: AlertsService,
    private apiService: ApiService,
    private websocket: WebSocketService,
    public permissions: PermissionsService,
    private changeDetector: ChangeDetectorRef) {
    this.userData = JSON.parse(String(localStorage.getItem("userData")));
    this.company = this.userData.Company
    this.organizationSelected = this.userData.Company.Organizations[1];
    addIcons({ trashOutline, addOutline, closeOutline, checkmarkOutline });
  }
  ionViewDidEnter() {
    this.GetAlerts()
  }
  ngOnInit() {
    this.timer = setInterval(() => {
      this.changeDetector.detectChanges(); // Fuerza actualización del contador
    }, 1000); // cada segundo

    setTimeout(() => {
      const viewportHeight = window.innerHeight;
      const rowHeight = 46; // altura aproximada de cada fila en px (ajusta según tu diseño)
      const headerHeight = 100; // altura del header de la página
      const tableHeaderHeight = 50; // altura del header de la tabla
      const paginatorHeight = 60; // altura del paginador
      const padding = 110; // padding extra

      const availableHeight = viewportHeight - headerHeight - tableHeaderHeight - paginatorHeight - padding;
      const calculatedRows = Math.floor(availableHeight / rowHeight);

      // Mínimo 5 filas, máximo razonable
      this.rowsPerPage = Math.max(5, Math.min(calculatedRows, 50));
    }, 100);
  }
  GetAlerts() {
    const orgsIds = this.organizationSelected.OrganizationId//this.userData.Company.Organizations.map((org: any) => org.OrganizationId).join(',');//IDs separados por coma (,)
    this.apiService.GetRequestRender(`alertsByOrganizations?organizations=${orgsIds}`).then((response: any) => {
      if (!response.errorsExistFlag) {
        this.alertsData = response.items
      } else {
        this.alerts.Error(response.error)
      }
      this.startSubscription()
      this.apiService.GetRequestRender(`failuresByCompany/${this.company.CompanyId}`, false).then((response: any) => {
        this.failures = response.items
        this.loadFailures()
        const orgsIds = this.organizationSelected.OrganizationId//this.userData.Company.Organizations.map((org: any) => org.OrganizationId).join(',');//IDs separados por coma (,)
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
  startSubscription() {
    this.websocket.SuscribeById({ organization_id: this.organizationSelected.OrganizationId }, "alerts-new", (response) => {
      this.alertsData = [...this.alertsData, response];
      this.changeDetector.detectChanges()
      this.alerts.Warning("Nueva alerta detectada")
    }).then((ws) => {
    }).catch(err => {
      console.log(err);
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

  ClearAlerts(table: any) {
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
      failure_id: this.selectedFailure.failure_id
    }
    this.apiService.PostRequestRender('alerts', body).then((response: any) => {
      this.isModalOpen = false
      //this.GetAlerts()
    })
  }
  async AttendAlert(alert: any) {
    if (await this.alerts.ShowAlert("¿Deseas atender esta alerta?", "Alerta", "Atrás", "Atender")) {
      this.apiService.PutRequestRender('alerts/' + alert.alert_id + '/attend', {}).then((response: any) => {
        if (!response.errorsExistFlag) {
          this.alerts.Success("Alerta atendida")
          alert.response_time = new Date()
        } else {
          this.alerts.Info(response.error)
        }
      })
    }
  }
  async FinaliceAlert(alert: any) {
    if (await this.alerts.ShowAlert("¿Deseas finalizar esta alerta?", "Alerta", "Atrás", "Finalizar")) {
      this.apiService.PutRequestRender('alerts/' + alert.alert_id + '/repair', {}).then((response: any) => {
        if (!response.errorsExistFlag) {
          this.alerts.Success("Alerta finalizada")
          alert.repair_time = new Date()
        } else {
          this.alerts.Info(response.error)
        }
      })
    }
  }
  async DeleteAlert(alert: any) {
    if (await this.alerts.ShowAlert("¿Deseas eliminar esta alerta?", "Alerta", "Atrás", "Eliminar")) {
      this.apiService.DeleteRequestRender('alerts/' + alert.alert_id).then((response: any) => {
        if (!response.errorsExistFlag) {
          this.GetAlerts()
          this.alerts.Success("Alerta eliminada")
        } else {
          this.alerts.Info(response.error)
        }
      })
    }
  }
  getElapsedTime(startDate: string | Date): string {
    const start = new Date(startDate);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();

    const seconds = Math.floor(diffMs / 1000) % 60;
    const minutes = Math.floor(diffMs / (1000 * 60)) % 60;
    const hours = Math.floor(diffMs / (1000 * 60 * 60)) % 24;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const parts = [];
    if (days > 0) parts.push(`${days} día${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hora${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minuto${minutes > 1 ? 's' : ''}`);
    parts.push(`${seconds} segundo${seconds > 1 ? 's' : ''}`);
    //this.changeDetector.detectChanges()
    return parts.join(' ');
  }
  getElapsedStartEndTime(startDate: string | Date, endDate?: string | Date): string {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffMs = end.getTime() - start.getTime();

    if (diffMs < 0) return '0 segundos';

    const seconds = Math.floor(diffMs / 1000) % 60;
    const minutes = Math.floor(diffMs / (1000 * 60)) % 60;
    const hours = Math.floor(diffMs / (1000 * 60 * 60)) % 24;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const parts = [];
    if (days > 0) parts.push(`${days} día${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hora${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minuto${minutes > 1 ? 's' : ''}`);
    parts.push(`${seconds} segundo${seconds > 1 ? 's' : ''}`);

    return parts.join(' ');
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
  /*SelectFail(fail: any) {
    this.selectedFailureId = fail.failure_id; // o fail.id si se llama diferente
  }*/
  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}
