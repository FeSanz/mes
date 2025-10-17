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
  timeLineData: any = []
  dateRangeOptions = [
    { label: 'Hoy', value: 'today' },
    { label: 'Últimas 24 horas', value: '24hours' },
    { label: 'Últimos 7 días', value: '7days' },
    { label: 'Esta semana', value: 'week' },
    { label: 'Últimos 30 días', value: '30days' },
    { label: 'Este mes', value: 'month' },
    { label: 'Rango personalizado', value: 'custom' }
  ];
  dateRange: any = "today"
  selectedRowMachine: any = null;
  constructor(
    private alerts: AlertsService,
    private apiService: ApiService,
    public permissions: PermissionsService,
    private changeDetector: ChangeDetectorRef) {
    this.userData = JSON.parse(String(localStorage.getItem("userData")));
    this.organizationSelected = this.userData.Company.Organizations[0];
    addIcons({ menuOutline, checkmarkCircle, trashOutline, pencilOutline, eyeOutline, hammerOutline, checkmarkOutline, timeOutline });
    //this.donutData = this.generarValores();
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
  GetDataDB(item: any) {
    this.apiService.GetRequestRender('alertsInterval/' + item.MachineId + '/' + this.dateRange).then((response: any) => {
      if (response.errorsExistFlag == true) {
        //this.alerts.Info(response.message);
      } else {
        const timeLineRes = this.generateSeparateTimelineData(response.items || [], item.Name)
        this.timeLineData = [...this.timeLineData, timeLineRes[0]]
      }
    })
  }
  ViewDetails(item: any) {
    this.apiService.GetRequestRender('alertsInterval/' + item.MachineId + '/' + this.dateRange).then((response: any) => {
      if (response.errorsExistFlag == true) {
        //this.alerts.Info(response.message);
      } else {
        const donutRes = this.calculateMachineMetrics(response.items)
        this.barsData = this.ContarFallasPorArea(response.items)
        this.donutData = donutRes
        if (this.timeLineData.length == 0) {
          const timeLineRes = this.generateSeparateTimelineData(response.items, item.Name)
          this.timeLineData = [timeLineRes[0]]
        }
        this.changeDetector.detectChanges()
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
  calculateMachineMetrics(
    alerts: any[],
    startDate?: Date,
    endDate?: Date
  ) {
    const now = endDate || new Date();
    const periodStart = startDate || new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    // Calcular el total de minutos en el período
    const totalMinutes = Math.floor((now.getTime() - periodStart.getTime()) / (1000 * 60));

    // Filtrar alertas activas (en downtime)
    const activeAlerts = alerts
    // Crear intervalos de downtime
    const downtimeIntervals: any[] = activeAlerts.map(alert => {
      const start = new Date(alert.StartDate);
      const end = alert.EndDate ? new Date(alert.EndDate) : now;

      // Ajustar si el inicio es antes del período
      const effectiveStart = start < periodStart ? periodStart : start;
      // Ajustar si el fin es después del período
      const effectiveEnd = end > now ? now : end;

      return {
        start: effectiveStart,
        end: effectiveEnd
      };
    });

    // Combinar intervalos superpuestos para no contar tiempo duplicado
    const mergedIntervals = this.mergeIntervals(downtimeIntervals);

    // Calcular total de minutos en downtime
    const downtimeMinutes = mergedIntervals.reduce((total, interval) => {
      const minutes = Math.floor((interval.end.getTime() - interval.start.getTime()) / (1000 * 60));
      return total + minutes;
    }, 0);

    // Calcular runtime
    const runtimeMinutes = totalMinutes - downtimeMinutes;

    // Calcular porcentajes
    const downtimePercentage = totalMinutes > 0 ? (downtimeMinutes / totalMinutes) * 100 : 0;
    const runtimePercentage = totalMinutes > 0 ? (runtimeMinutes / totalMinutes) * 100 : 0;

    // Convertir a horas
    const runtimeHours = runtimeMinutes / 60;
    const downtimeHours = downtimeMinutes / 60;

    return {
      runtimeMinutes,
      downtimeMinutes,
      totalMinutes,
      runtimePercentage: parseFloat(runtimePercentage.toFixed(2)),
      downtimePercentage: parseFloat(downtimePercentage.toFixed(2)),
      runtimeHours: parseFloat(runtimeHours.toFixed(2)),
      downtimeHours: parseFloat(downtimeHours.toFixed(2))
    };
  }
  mergeIntervals(intervals: any[]): any[] {
    if (intervals.length === 0) return [];

    // Ordenar intervalos por fecha de inicio
    const sorted = intervals.sort((a, b) => a.start.getTime() - b.start.getTime());
    const merged: any[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const last = merged[merged.length - 1];

      // Si los intervalos se superponen, combinarlos
      if (current.start <= last.end) {
        last.end = new Date(Math.max(last.end.getTime(), current.end.getTime()));
      } else {
        merged.push(current);
      }
    }

    return merged;
  }
  generateSeparateTimelineData(
    alerts: any[],
    machineName: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const now = endDate || new Date();
    const periodStart = startDate || new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    // Filtrar y mapear alertas válidas
    const validAlerts = alerts.map(alert => {
      const start = new Date(alert.StartDate).getTime();
      let end: number;

      // Si tiene RepairDate, el downtime es hasta esa fecha
      if (alert.RepairDate) {
        end = new Date(alert.RepairDate).getTime();
      }
      // Si no tiene RepairDate, sigue activo hasta ahora
      else {
        end = now.getTime();
      }

      return {
        start: start,
        end: end
      };
    })
      .sort((a, b) => a.start - b.start);

    const timelineData: any[] = [];
    const endTimeMs = now.getTime();

    // Si no hay alertas válidas, toda la línea es runtime
    if (validAlerts.length === 0) {
      return [{
        name: machineName,
        data: [{
          x: machineName,
          y: [periodStart.getTime(), endTimeMs],
          fillColor: "#007bff"
        }]
      }];
    }

    // Fusionar alertas solapadas para obtener períodos de downtime continuos
    const mergedDowntimes: { start: number; end: number }[] = [];

    for (const alert of validAlerts) {
      if (mergedDowntimes.length === 0) {
        mergedDowntimes.push({ start: alert.start, end: alert.end });
      } else {
        const last = mergedDowntimes[mergedDowntimes.length - 1];

        // Si la alerta actual se solapa o está contigua con la anterior
        if (alert.start <= last.end) {
          // Extender el downtime hasta el máximo de ambas
          last.end = Math.max(last.end, alert.end);
        } else {
          // Nueva alerta separada
          mergedDowntimes.push({ start: alert.start, end: alert.end });
        }
      }
    }

    // Generar los segmentos de runtime y downtime
    let currentTime = periodStart.getTime();

    for (const downtime of mergedDowntimes) {
      // Runtime antes del downtime (solo si el downtime está después del inicio)
      if (currentTime < downtime.start) {
        timelineData.push({
          x: machineName,
          y: [currentTime, downtime.start],
          fillColor: "#007bff"
        });
      }

      // Downtime (desde StartDate hasta RepairDate o ahora)
      timelineData.push({
        x: machineName,
        y: [downtime.start, downtime.end],
        fillColor: "#dc3545"
      });

      currentTime = downtime.end;
    }

    // Runtime final si queda tiempo
    if (currentTime < endTimeMs) {
      timelineData.push({
        x: machineName,
        y: [currentTime, endTimeMs],
        fillColor: "#007bff"
      });
    }

    return [{
      name: machineName,
      data: timelineData
    }];
  }
  mergeDowntimeIntervals(intervals: Array<{ start: Date; end: Date; alerts: any[] }>): Array<{ start: Date; end: Date; alerts: any[] }> {
    if (intervals.length === 0) return [];

    const sorted = [...intervals].sort((a, b) => a.start.getTime() - b.start.getTime());
    const merged: Array<{ start: Date; end: Date; alerts: any[] }> = [{
      start: sorted[0].start,
      end: sorted[0].end,
      alerts: [...sorted[0].alerts]
    }];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const last = merged[merged.length - 1];

      // Si los intervalos se superponen o están contiguos, combinarlos
      if (current.start.getTime() <= last.end.getTime()) {
        // Extender el fin si el actual termina después
        if (current.end.getTime() > last.end.getTime()) {
          last.end = current.end;
        }
        // Agregar las alertas del intervalo actual
        last.alerts.push(...current.alerts);
      } else {
        // No hay superposición, agregar como nuevo intervalo
        merged.push({
          start: current.start,
          end: current.end,
          alerts: [...current.alerts]
        });
      }
    }

    return merged;
  }
  protected readonly ToggleMenu = ToggleMenu;
}
