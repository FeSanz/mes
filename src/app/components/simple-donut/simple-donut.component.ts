import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
import {
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexChart
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
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
      series: [44, 55], // Para donut/pie, esto es correcto como array de números
      chart: {
        height: 350,
        type: "donut"
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
    this.chartOptions.series = [this.data[0], this.data[1]]
    if (this.chart && this.chart.updateSeries) {
      this.chart.updateSeries(this.chartOptions.series);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    this.updateChart()
  }

}
