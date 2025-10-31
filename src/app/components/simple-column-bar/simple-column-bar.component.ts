import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import {
  NgApexchartsModule,
  ApexChart,
  ApexAxisChartSeries,
  ChartComponent,
  ApexDataLabels,
  ApexPlotOptions,
  ApexLegend,
  ApexGrid
} from "ng-apexcharts";
import { AlertsService } from 'src/app/services/alerts.service';
import { ApiService } from 'src/app/services/api.service';
import { PermissionsService } from 'src/app/services/permissions.service';

type ApexXAxis = {
  type?: "category" | "datetime" | "numeric";
  categories?: any;
  labels?: {
    style?: {
      colors?: string | string[];
      fontSize?: string;
    };
  };
};

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis;
  noData: ApexNoData;
  grid: ApexGrid;
  colors: string[];
  legend: ApexLegend;
};

export interface data {
  [key: string]: any;
}
@Component({
  selector: 'app-simple-column-bar',
  templateUrl: './simple-column-bar.component.html',
  styleUrls: ['./simple-column-bar.component.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [NgApexchartsModule]
})
export class SimpleColumnBarComponent implements OnInit {

  @Input() data: data = {};
  @ViewChild("columnChart", { static: false }) chart: ChartComponent | undefined;
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
          name: "distibuted",
          data: [21, 22, 10, 28, 16]
        }
      ],
      noData: {
        text: "No hay datos para mostrar",
        align: 'center',
        verticalAlign: 'middle',
        style: {
          color: '#999',
          fontSize: '16px'
        }
      },
      chart: {
        height: 350,
        type: "bar",
        events: {
          click: function (chart, w, e) {
            // console.log(chart, w, e)
          }
        }
      },
      colors: [
        "#008FFB",
        "#FF4560",
        "#00E396",
        "#FEB019",
        "#775DD0",
      ],
      plotOptions: {
        bar: {
          columnWidth: "45%",
          distributed: true
        }
      },
      dataLabels: {
        enabled: false
      },
      legend: {
        show: false
      },
      grid: {
        show: false
      },
      xaxis: {
        categories: [
          ["Falla 1"],
          ["Falla 2"],
          ["Falla 3"],
          ["Falla 4"],
          ["Falla 5"]
        ],
        labels: {
          style: {
            colors: [
              "#008FFB",
              "#00E396",
              "#FEB019",
              "#FF4560",
              "#775DD0",
            ],
            fontSize: "12px"
          }
        }
      }
    };
  }
  ngOnInit() {
  }

  updateChart() {
    const nombres = Object.keys(this.data);
    const valores = Object.values(this.data);
    this.chartOptions = {
      ...this.chartOptions, // mantiene configuración base
      series: [
        {
          name: "Fallas",
          data: valores
        }
      ],
      xaxis: {
        categories: nombres.map(n => [n]), // cada nombre será una barra
        labels: {
          style: {
            colors: nombres.map((_, i) => this.chartOptions.colors[i % this.chartOptions.colors.length]),
            fontSize: "12px"
          }
        }
      }
    };

    if (this.chart && this.chart.updateOptions) {
      this.chart.updateOptions(this.chartOptions);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    this.updateChart()
  }
}
