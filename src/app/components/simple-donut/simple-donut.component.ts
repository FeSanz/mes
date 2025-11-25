import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
import {
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexNoData,
  ApexChart,
  ApexTooltip
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  colors?: string[];
  legend?: ApexLegend;
  noData: ApexNoData;
  responsive?: ApexResponsive[];
  stroke?: ApexStroke;
  fill?: ApexFill;
  plotOptions?: ApexPlotOptions;
  tooltip?: ApexTooltip;
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
      legend: {
        position: "bottom",
        horizontalAlign: "center"
      },
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
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: "50%",
          rangeBarGroupRows: true
        }
      },
      labels: [],
      tooltip: {
      },
      colors: [
        "#008FFB",  // Azul
        "#FF4560",  // Rojo
        "#00E396",  // Verde
        "#FEB019",  // Naranja
        "#775DD0",  // Morado
        "#FF6178",  // Rosa
        "#26A0FC",  // Azul claro
        "#26E7A6",  // Verde menta
        "#FEBC3B",  // Amarillo
        "#FF6B9D"   // Rosa fuerte
      ],
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
    if (this.data['Runtime']) {
      this.chartOptions.series = [this.data['Data'].runtimePercentage,
      this.data['Data'].downtimePercentage]
      this.chartOptions.labels = this.data['Labels']
      this.chartOptions.tooltip = {
        y: {
          formatter: (value: number, { seriesIndex }) => {
            // seriesIndex 0 = runtime  |  1 = downtime
            const runtimeHours = this.data['Data'].runtimeHours;
            const downtimeHours = this.data['Data'].downtimeHours;

            return seriesIndex === 0
              ? `${runtimeHours} h`
              : `${downtimeHours} h`;
          }
        }
      }
      this.chartOptions.legend = {
        position: "bottom",
        horizontalAlign: "center",
        formatter: (val, opts) => {
          const runtimeHours = this.data?.['Data']?.runtimeHours ?? 0;
          const downtimeHours = this.data?.['Data']?.downtimeHours ?? 0;

          if (opts.seriesIndex === 0) {
            return `${val} — ${runtimeHours} h`;
          } else {
            return `${val} — ${downtimeHours} h`;
          }
        }
      }
      if (this.chart && this.chart.updateOptions) {
        this.chart.updateOptions({
          series: this.chartOptions.series,
          labels: this.chartOptions.labels,
          tooltip: this.chartOptions.tooltip,
          legend: this.chartOptions.legend
        });
      }
    } else if (this.data['Failures']) {
      this.chartOptions.series = this.data['Data']
      this.chartOptions.labels = this.data['Labels']
      if (this.chart && this.chart.updateOptions) {
        this.chart.updateOptions({
          series: this.chartOptions.series,
          labels: this.chartOptions.labels
        });
      }
    } else {
      this.chartOptions.series = []
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    this.updateChart()
  }

}
