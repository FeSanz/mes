import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
import {
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexNoData,
  ApexChart
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  noData: ApexNoData;
  colors: string[],
  responsive: ApexResponsive[];
  labels: any;
};

export interface data {
  [key: string]: any;
}
@Component({
  selector: 'app-simple-donut',
  templateUrl: './simple-donut.component.html',
  styleUrls: ['./simple-donut.component.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [NgApexchartsModule]
})
export class SimpleDonutComponent implements OnInit {

  @ViewChild("donutChart", { static: false }) chart: ChartComponent | undefined;
  public chartOptions: ChartOptions;
  @Input() data: data = {};
  constructor() {

    this.chartOptions = {
      series: [], // Para donut/pie, esto es correcto como array de números
      chart: {
        height: 350,
        type: "donut"
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
      labels: ["Runtime", "Downtime"],
      colors: ['#42a7f0', '#eb445a'],
      responsive: [
        {
          breakpoint: 5,
          options: {
            chart: {
              width: 5,
              height: 5  // También ajusta para móviles
            },
            legend: {
              position: "bottom"
            }
          }
        }
      ]
    };
  }

  ngOnInit() {
  }
  updateChart() {
    if (this.data['runtimePercentage']) {
      this.chartOptions.series = [this.data['runtimePercentage'], this.data['downtimePercentage']]
      if (this.chart && this.chart.updateSeries) {
        this.chart.updateSeries(this.chartOptions.series);
      }
    } else {
      this.chartOptions.series = []
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    this.updateChart()
  }

}
