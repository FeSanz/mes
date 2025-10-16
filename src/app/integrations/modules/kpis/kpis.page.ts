import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonMenuButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCol, IonRow, IonGrid } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { menuOutline, timeOutline, hammerOutline, pencilOutline, checkmarkOutline, trashOutline, eyeOutline, checkmarkCircle } from 'ionicons/icons';
import { Tag } from "primeng/tag";

import { TableModule } from "primeng/table";
import { Select } from "primeng/select";
import { FloatLabel } from "primeng/floatlabel";
import { ButtonModule } from "primeng/button";
import { InputText } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToggleMenu } from 'src/app/models/design';
import { DialogModule } from 'primeng/dialog';
import { Dialog } from "primeng/dialog";
import { AlertsService } from 'src/app/services/alerts.service';
import { ApiService } from 'src/app/services/api.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import { SimpleDonutComponent } from 'src/app/components/simple-donut/simple-donut.component';
import { SimpleHeatmapComponent } from 'src/app/components/simple-heatmap/simple-heatmap.component';
import { SimpleColumnBarComponent } from 'src/app/components/simple-column-bar/simple-column-bar.component';
import { SimpleTimelineComponent } from 'src/app/components/simple-timeline/simple-timeline.component';

@Component({
  selector: 'app-kpis',
  templateUrl: './kpis.page.html',
  styleUrls: ['./kpis.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonContent, IonHeader, IonTitle, SimpleDonutComponent, SimpleColumnBarComponent, SimpleHeatmapComponent, IonToolbar, CommonModule, IonMenuButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCol, IonRow,
    IonGrid, FormsModule, Tag, ButtonModule, InputText, IconFieldModule, InputIconModule, DialogModule, Dialog, Select, TableModule, FloatLabel, SimpleTimelineComponent]
})
export class KpisPage implements OnInit {
  machinesArray: any = []
  rowsPerPage: number = 8;
  rowsPerPageOptions: number[] = [5, 10, 20];
  selectedMachine: any[] = []
  scrollHeight: string = '90%';
  searchValueAl: string = '';
  organizationSelected: string | any = '';
  userData: any = {};
  donutData: any = []
  barsData: any = []
  dateRangeOptions = [
    { label: 'Hoy', value: 'today' },
    { label: 'Últimas 24 horas', value: '24hours' },
    { label: 'Últimos 7 días', value: '7days' },
    { label: 'Esta semana', value: 'week' },
    { label: 'Últimos 30 días', value: '30days' },
    { label: 'Este mes', value: 'month' },
    { label: 'Rango personalizado', value: 'custom' }
  ];
  dateRange: any = "30days"
  selectedRowMachine: any = null;
  constructor(
    private alerts: AlertsService,
    private apiService: ApiService,
    public permissions: PermissionsService,
    private changeDetector: ChangeDetectorRef) {
    this.userData = JSON.parse(String(localStorage.getItem("userData")));
    this.organizationSelected = this.userData.Company.Organizations[0];
    addIcons({ menuOutline, checkmarkCircle, trashOutline, pencilOutline, eyeOutline, hammerOutline, checkmarkOutline, timeOutline });
    this.donutData = this.generarValores();
  }
  generarValores() {
    const a = Math.floor(Math.random() * 101);
    const b = 100 - a;
    return [a, b];
  }
  ngOnInit() {
  }
  ionViewDidEnter() {
    /*this.todayDate = this.formatLocalISO(new Date())
    this.campaignObj.end_date = this.formatLocalISO(
      new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(12, 0, 0, 0))
    );
    this.campaignObj.start_date = this.formatLocalISO(
      new Date(new Date(new Date().setDate(new Date().getDate() + 7)).setHours(12, 0, 0, 0))
    );*/
    this.GetMachines()
  }
  GetMachines() {
    this.apiService.GetRequestRender('orgResourceMachines/' + this.organizationSelected.OrganizationId).then((response: any) => {
      if (!response.items) {
        this.alerts.Info(response.message);
      } else {
        this.machinesArray = response.items
      }
    })
  }
  ClearMachinesFilter(table: any) {
    table.clear();
    this.searchValueAl = '';
  }
  OnFilterGlobal(event: Event, table: any) {
    const target = event.target as HTMLInputElement;
    table.filterGlobal(target.value, 'contains');
  }
  ViewDetails(item: any) {
    this.apiService.GetRequestRender('alertsInterval/' + item.MachineId + '/' + this.dateRange).then((response: any) => {
      if (!response.totalResults) {
        this.alerts.Info(response.message);
        this.donutData = [100, 0]
      } else {
        const res = this.CalcularPorcentajes(response.items)
        this.barsData = this.ContarFallasPorArea(response.items)
        this.donutData = [res[0], Number(res[1]) + Number(res[2])]
      }
    })
  }
  toggleRowSelection(item: any) {
    if (this.selectedRowMachine && this.selectedRowMachine.Code === item.Code) {
      this.selectedRowMachine = null;
    } else {
      this.selectedRowMachine = item;
      this.ViewDetails(item);
    }
  }
  ContarFallasPorArea(failures: any[]) {
    const conteo = failures.reduce((acc, f) => {
      const area = f.Area || "Sin asignar";
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return conteo;
  }
  CalcularPorcentajes(failures: any[], dias: number = 30) {
    const ahora = new Date();
    const inicioPeriodo = new Date(ahora);
    inicioPeriodo.setDate(ahora.getDate() - dias);

    // Convertimos las fechas de los eventos a rangos de tiempo
    const eventos = failures
      .map(f => ({
        type: f.Type,
        start: new Date(f.StartDate),
        end: f.EndDate ? new Date(f.EndDate) : ahora
      }))
      .filter(e => e.start >= inicioPeriodo); // Solo los últimos N días

    const duracionTotal = ahora.getTime() - inicioPeriodo.getTime();

    let duracionFalla = 0;
    let duracionMantenimiento = 0;

    // Sumamos tiempos según tipo
    for (const e of eventos) {
      const fin = e.end.getTime() > ahora.getTime() ? ahora : e.end;
      const inicio = e.start.getTime() < inicioPeriodo.getTime() ? inicioPeriodo : e.start;
      const duracion = fin.getTime() - inicio.getTime();

      if (e.type === 'TNP') duracionFalla += duracion;
      else if (e.type === 'TMP') duracionMantenimiento += duracion;
    }

    // Limitamos al total del rango y normalizamos
    const totalUsado = duracionFalla + duracionMantenimiento;
    const duracionSinFalla = Math.max(0, duracionTotal - totalUsado);

    const porcentajeFalla = (duracionFalla / duracionTotal) * 100;
    const porcentajeMantenimiento = (duracionMantenimiento / duracionTotal) * 100;
    const porcentajeSinFalla = (duracionSinFalla / duracionTotal) * 100;

    /*console.log('Falla:', porcentajeFalla.toFixed(2));
    console.log('Mantenimiento:', porcentajeMantenimiento.toFixed(2));
    console.log('Sin falla:', porcentajeSinFalla.toFixed(2));*/

    return [
      Number(porcentajeSinFalla.toFixed(2)),
      Number(porcentajeFalla.toFixed(2)),
      Number(porcentajeMantenimiento.toFixed(2))
    ];
  }

  protected readonly ToggleMenu = ToggleMenu;
}
