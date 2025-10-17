import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit, SimpleChanges, ViewChild } from '@angular/core';

import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexPlotOptions,
  ApexXAxis,
  ApexFill,
  ApexLegend,
  ApexTooltip,
  NgApexchartsModule
} from "ng-apexcharts";
import { AlertsService } from 'src/app/services/alerts.service';
import { ApiService } from 'src/app/services/api.service';
import { PermissionsService } from 'src/app/services/permissions.service';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  fill: ApexFill;
  legend: ApexLegend;
  xaxis: ApexXAxis;
  plotOptions: ApexPlotOptions;
  colors: string[];
  tooltip: ApexTooltip;
};

export interface data {
  [key: string]: any;
}
@Component({
  selector: 'app-simple-timeline',
  templateUrl: './simple-timeline.component.html',
  styleUrls: ['./simple-timeline.component.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [NgApexchartsModule]
})
export class SimpleTimelineComponent implements OnInit {

  @Input() data: data = {};
  @ViewChild("timelineChart", { static: false }) chart: ChartComponent | undefined;
  public chartOptions: ChartOptions;
  organizationSelected: string | any = '';
  userData: any = {};
  company: any = {}
  constructor(
    private alerts: AlertsService,
    private apiService: ApiService,
    public permissions: PermissionsService,
    private changeDetector: ChangeDetectorRef) {
    this.userData = JSON.parse(String(localStorage.getItem("userData")));
    this.company = this.userData.Company
    this.organizationSelected = this.userData.Company.Organizations[1];
    this.chartOptions = {
      series: [
        {
          name: "Runtime/Downtime",
          data: [
            {
              x: "Máquina 1",
              y: [
                new Date("2025-10-06T08:00:00").getTime(),
                new Date("2025-10-06T09:30:00").getTime()
              ],
              fillColor: "#007bff",
            },
            {
              x: "Máquina 1",
              y: [
                new Date("2025-10-06T09:30:00").getTime(),
                new Date("2025-10-06T09:50:00").getTime()
              ],
              fillColor: "#dc3545",
            },
            {
              x: "Máquina 1",
              y: [
                new Date("2025-10-06T09:50:00").getTime(),
                new Date("2025-10-06T12:00:00").getTime()
              ],
              fillColor: "#007bff",
            }]
        }
      ],
      chart: {
        height: 350,
        type: "rangeBar"
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: "50%",
          rangeBarGroupRows: true
        }
      },
      colors: [
        "#008FFB",
        "#00E396",
        "#FEB019",
        "#FF4560",
        "#775DD0",
        "#3F51B5",
        "#546E7A",
        "#D4526E",
        "#8D5B4C",
        "#F86624",
        "#D7263D",
        "#1B998B",
        "#2E294E",
        "#F46036",
        "#E2C044"
      ],
      fill: {
        type: "solid"
      },
      xaxis: {
        type: "datetime"
      },
      legend: {
        position: "right"
      },
      tooltip: {
        custom: function (opts) {
          const data = opts.w.config.series[opts.seriesIndex].data[opts.dataPointIndex];
          const start = new Date(opts.y1);
          const end = new Date(opts.y2);
          const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // duración en minutos

          // Determinar si es Runtime o Downtime basado en el color
          const isDowntime = data.fillColor === '#dc3545' || data.fillColor.includes('dc3545');
          const label = isDowntime ? 'Downtime' : 'Runtime';
          const labelColor = isDowntime ? '#ef4444' : '#22c55e';

          let html = '<div class="apexcharts-tooltip-rangebar" style="padding: 10px; min-width: 200px;">';

          // Título con color
          html += `<div style="font-weight: bold; margin-bottom: 8px; color: ${labelColor}; font-size: 14px;">`;
          html += `${label}`;
          html += '</div>';

          // Máquina
          html += '<div style="margin-bottom: 6px;">';
          html += `<span style="color: var(--ion-color-light);">Máquina: </span>`;
          html += `<span style="color: var(--ion-color-secondary); font-weight: 600;">${data.x}</span>`;
          html += '</div>';

          // Si es Downtime, mostrar información de las alertas
          if (isDowntime && data.alertName) {
            html += '<div style="margin-bottom: 6px; border-top: 1px solid #475569; padding-top: 6px;">';
            html += `<div style="color: var(--ion-color-light); font-weight: 600; margin-bottom: 4px;">${data.alertName}</div>`;

            if (data.alertType) {
              html += `<div style="color: var(--ion-color-light); font-size: 12px;">Tipo: ${data.alertType}</div>`;
            }

            if (data.area) {
              html += `<div style="color: var(--ion-color-light); font-size: 12px;">Área: ${data.area}</div>`;
            }

            html += '</div>';
          }

          // Horarios
          html += '<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--ion-color-light);">';
          html += `<div style="color: var(--ion-color-light); font-size: 12px;">Inicio: <span style="color: var(--ion-color-light);">${start.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span></div>`;
          html += `<div style="color: var(--ion-color-light); font-size: 12px;">Fin: <span style="color: var(--ion-color-light);">${end.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span></div>`;
          html += '</div>';

          // Duración
          const hours = Math.floor(duration / 60);
          const minutes = duration % 60;
          html += '<div style="margin-top: 8px; font-weight: bold; color: var(--ion-color-light); font-size: 14px;">';
          html += `Duración: ${hours}h ${minutes}m`;
          html += '</div>';

          html += '</div>';

          return html;
        }
      }
    };
  }
  ngOnInit() { }

  updateChart() {
    if (this.data) {
      this.chartOptions.series = this.data['map']((group: any) => ({
        name: group.name,
        data: group.data
      }));
      if (this.chart && this.chart.updateSeries) {
        this.chart.updateSeries(this.chartOptions.series);
      }
    }
  }
  ngOnChanges(changes: SimpleChanges) {
    this.updateChart()
  }
}
