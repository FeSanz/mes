import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCol, IonRow, IonGrid, IonBackButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { menuOutline, timeOutline, hammerOutline, pencilOutline, checkmarkOutline, trashOutline, eyeOutline, checkmarkCircle } from 'ionicons/icons';
import { Tag } from "primeng/tag";

import { Select } from "primeng/select";
import { FloatLabel } from "primeng/floatlabel";
import { ButtonModule } from "primeng/button";
import { InputText } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToggleMenu } from 'src/app/models/design';
import { DialogModule } from 'primeng/dialog';
import { AlertsService } from 'src/app/services/alerts.service';
import { ApiService } from 'src/app/services/api.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import { DatePicker } from 'primeng/datepicker';
import { Table, TableModule } from "primeng/table";

@Component({
  selector: 'app-alert-history',
  templateUrl: './alert-history.page.html',
  styleUrls: ['./alert-history.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, IonCard, IonCol, IonRow, DatePicker, IonBackButton,
    IonGrid, FormsModule, Tag, ButtonModule, InputText, IconFieldModule, InputIconModule, DialogModule, Select, TableModule, FloatLabel]
})
export class AlertHistoryPage implements OnInit {

  rowsPerPage: number = 26;
  rowsPerPageOptions: number[] = [5, 10, 20];
  scrollHeight: string = '90%';
  searchValueAl: string = '';
  organizationSelected: string | any = '';
  userData: any = {};
  dateRangeOptions = [
    { label: 'Hoy', value: 'today' },
    { label: 'Últimas 24 horas', value: '24hours' },
    { label: 'Últimos 7 días', value: '7days' },
    { label: 'Esta semana', value: 'week' },
    { label: 'Últimos 30 días', value: '30days' },
    { label: 'Este mes', value: 'month' },
    { label: 'Rango personalizado', value: 'custom' }
  ];
  finalicedAlertsData: any = []
  dateRange: any = "24hours"
  showDateTime = false
  startDate: Date | undefined;
  endDate: Date | undefined;
  @ViewChild('dtAlerts') table!: Table;
  constructor(
    private alerts: AlertsService,
    private apiService: ApiService,
    public permissions: PermissionsService,
    private changeDetector: ChangeDetectorRef) {
    this.userData = JSON.parse(String(localStorage.getItem("userData")));
    addIcons({ menuOutline, checkmarkCircle, trashOutline, pencilOutline, eyeOutline, hammerOutline, checkmarkOutline, timeOutline });
    this.organizationSelected = localStorage.getItem("organizationSelected") ? JSON.parse(localStorage.getItem("organizationSelected") || '{}') : this.userData.Company.Organizations[0]
    localStorage.getItem("dateRange") ? this.dateRange = localStorage.getItem("dateRange") : null
    this.SetDate()
    if (this.dateRange == "custom") {
      this.showDateTime = true
    }
  }

  ngOnInit() {
  }


  ionViewDidEnter() {
    this.GetAlerts()
  }
  SetDate() {
    const now = new Date();
    // END: hoy a la hora actual
    this.endDate = new Date(now);
    // START: hace 7 días a las 12:00 pm
    this.startDate = new Date(now);
    this.startDate.setDate(now.getDate() - 7);
    this.startDate.setHours(12, 0, 0, 0);

  }
  ResetData() {
    if (this.dateRange == "custom") {
      this.showDateTime = true
    } else {
      this.showDateTime = false
    }
    localStorage.setItem("organizationSelected", JSON.stringify(this.organizationSelected))
    localStorage.setItem("dateRange", this.dateRange)
  }
  GetAlerts() {
    this.ResetData()
    const formatYMD = (d: Date) => d.toISOString().slice(0, 10);
    const { start, end } = this.dateRange === "custom" ? { start: formatYMD(this.startDate!), end: formatYMD(this.endDate!) } : this.getDateRangeFromOption(this.dateRange);
    const orgsId = this.organizationSelected.OrganizationId//this.userData.Company.Organizations.map((org: any) => org.OrganizationId).join(',');//IDs separados por coma (,)
    this.apiService.GetRequestRender(`alertsByOrganizations/finaliced?organizations=${orgsId}&startDate=${start}&endDate=${end}`).then((response: any) => {
      if (!response.errorsExistFlag) {
        this.finalicedAlertsData = response.items

        this.finalicedAlertsData.forEach((alert: any) => {
          alert.responseTimeString = this.getElapsedStartEndTime(alert.start_date, alert.response_time)
          alert.repairTimeString = this.getElapsedStartEndTime(alert.response_time, alert.repair_time)
          alert.responseLegibleTimeString = this.getElapsedLegibleTime(alert.start_date, alert.response_time)
          alert.repairLegibleTimeString = this.getElapsedLegibleTime(alert.response_time, alert.repair_time)
        });

      } else {
        this.alerts.Error(response.error)
      }
    })
  }
  getElapsedStartEndTime(startDate: string | Date, endDate?: string | Date): string {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffMs = end.getTime() - start.getTime();

    if (diffMs < 0) return '00:00:00';

    const totalSeconds = Math.floor(diffMs / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);

    // función helper para formatear con 2 dígitos
    const pad = (n: number) => n.toString().padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  getElapsedLegibleTime(startDate: string | Date, endDate?: string | Date): string {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffMs = end.getTime() - start.getTime();

    const seconds = Math.floor(diffMs / 1000) % 60;
    const minutes = Math.floor(diffMs / (1000 * 60)) % 60;
    const hours = Math.floor(diffMs / (1000 * 60 * 60)) % 24;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const parts: string[] = [];
    if (days > 0) parts.push(`${days} día${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}min`);
    parts.push(`${seconds}s`);

    return parts.join(' ');
  }

  getDateRangeFromOption(option: string): { start: string; end: string } {
    const now = new Date();
    const endDate = new Date(); // Fecha actual
    let startDate: Date;
    switch (option) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case '24hours':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7days':
        startDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week': {
        const dayOfWeek = now.getDay(); // 0 = domingo
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // lunes
        startDate = new Date(now.setDate(diff));
        startDate.setHours(0, 0, 0, 0);
        break;
      }
      case '30days':
        startDate = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        throw new Error('Opción de rango de fechas no válida');
    }
    // Convertir a YYYY-MM-DD
    const toYMD = (d: Date) =>
      d.toISOString().split('T')[0];

    return {
      start: toYMD(startDate),
      end: toYMD(endDate)
    };
  }

  ClearAlerts(table: any) {
    table.clear();
    this.searchValueAl = '';
  }
  OnFilterGlobal(event: Event, table: any) {
    const target = event.target as HTMLInputElement;
    table.filterGlobal(target.value, 'contains');
  }
  protected readonly ToggleMenu = ToggleMenu;
}
