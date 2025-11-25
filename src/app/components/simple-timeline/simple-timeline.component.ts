import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit, SimpleChanges, ViewChild } from '@angular/core';

import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexPlotOptions,
  ApexXAxis,
  ApexFill,
  ApexLegend,
  ApexNoData,
  ApexTooltip,
  NgApexchartsModule
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  fill: ApexFill;
  legend: ApexLegend;
  noData: ApexNoData;
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
  constructor() {
    this.chartOptions = {
      series: [],
      chart: {
        height: 350,
        type: "rangeBar"
      },
      noData: {
        text: "No hay datos para mostrar",
        align: 'center',
        verticalAlign: 'middle',
        style: {
          color: '#999',
          fontSize: '16px'
        }
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: "50%",
          rangeBarGroupRows: true
        }
      },
      colors: [
        "#008FFB",  // Azul
        "#008FFB",  // Azul
        "#008FFB",  // Azul
        "#008FFB",  // Azul
        "#008FFB",  // Azul
        "#008FFB",  // Azul
        "#008FFB",  // Azul
        "#008FFB",  // Azul
        "#008FFB",  // Azul
        "#008FFB",  // Azul
        "#008FFB",  // Azul
        "#008FFB",  // Azul
        "#008FFB",  // Azul
        "#008FFB",  // Azul
        "#008FFB",  // Azul
        "#008FFB",  // Azul
        "#008FFB",  // Azul
        "#008FFB",  // Azul
        "#008FFB",  // Azul
        "#008FFB",  // Azul
        "#008FFB",  // Azul
      ],
      fill: {
        type: "solid"
      },
      xaxis: {
        type: "datetime",
        labels: {
          datetimeUTC: false,
          //format: 'hh:mm a' // ← 12 horas con AM/PM
        }
      },
      legend: {
        position: "top"
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
  ngOnInit() {

  }
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
