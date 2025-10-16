import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit, ViewChild } from '@angular/core';

import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexPlotOptions,
  ApexXAxis,
  ApexFill,
  ApexLegend,
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
                new Date("2025-10-06T10:00:00").getTime()
              ],
              fillColor: "#007bff", // Azul → Runtime
            },
            {
              x: "Máquina 1",
              y: [
                new Date("2025-10-06T10:00:00").getTime(),
                new Date("2025-10-06T10:45:00").getTime()
              ],
              fillColor: "#dc3545", // Rojo → Downtime
            },
            {
              x: "Máquina 2",
              y: [
                new Date("2025-10-06T08:00:00").getTime(),
                new Date("2025-10-06T09:30:00").getTime()
              ],
              fillColor: "#007bff",
            },
            {
              x: "Máquina 2",
              y: [
                new Date("2025-10-06T09:30:00").getTime(),
                new Date("2025-10-06T09:50:00").getTime()
              ],
              fillColor: "#dc3545",
            },
            {
              x: "Máquina 2",
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
          const fromYear = new Date(opts.y1).getFullYear();
          const toYear = new Date(opts.y2).getFullYear();
          const values = opts.ctx.rangeBar.getTooltipValues(opts);

          return (
            '<div class="apexcharts-tooltip-rangebar">' +
            '<div> <span class="series-name" style="color: ' +
            values.color +
            '">' +
            (values.seriesName ? values.seriesName : "") +
            "</span></div>" +
            '<div> <span class="category">' +
            values.ylabel +
            ' </span> <span class="value start-value">' +
            fromYear +
            '</span> <span class="separator">-</span> <span class="value end-value">' +
            toYear +
            "</span></div>" +
            "</div>"
          );
        }
      }
    };
  }
  ngOnInit() { }

}
