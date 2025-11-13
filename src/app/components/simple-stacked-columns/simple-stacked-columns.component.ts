import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexPlotOptions,
  ApexResponsive,
  ApexXAxis,
  ApexLegend,
  ApexFill,
  NgApexchartsModule
} from "ng-apexcharts";
export interface data {
  [key: string]: any;
}
export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  noData: ApexNoData;
  plotOptions: ApexPlotOptions;
  responsive: ApexResponsive[];
  xaxis: ApexXAxis;
  colors: string[];
  legend: ApexLegend;
  fill: ApexFill;
};
@Component({
  selector: 'app-simple-stacked-columns',
  templateUrl: './simple-stacked-columns.component.html',
  styleUrls: ['./simple-stacked-columns.component.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [NgApexchartsModule]
})
export class SimpleStackedColumnsComponent implements OnInit {

  @Input() data: data = {};
  @ViewChild("stackedColumsChart", { static: false }) chart: ChartComponent | undefined;
  public chartOptions: ChartOptions;
  constructor(
    private changeDetector: ChangeDetectorRef) {
    this.chartOptions = {
      series: [
      ],
      chart: {
        type: "bar",
        height: 350,
        stacked: true,
        toolbar: {
          show: true
        },
        zoom: {
          enabled: true
        }
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
          breakpoint: 480,
          options: {
            legend: {
              position: "bottom",
              offsetX: -10,
              offsetY: 0
            }
          }
        }
      ],
      plotOptions: {
        bar: {
          horizontal: false
        }
      },
      xaxis: {
        type: "category",
        categories: []
      },
      legend: {
        position: "top"
      },
      fill: {
        opacity: 1
      }
    };

  }
  updateChart() {
    if (this.data) {
      // Obtener TODOS los tipos de fallas únicas de TODOS los registros
      const allFaultTypes = new Set<string>();
      this.data['forEach']((item: any) => {
        Object.keys(item).forEach(key => {
          if (key !== 'MachineName') {
            allFaultTypes.add(key);
          }
        });
      });
      const faultTypes = Array.from(allFaultTypes);

      // Si no hay tipos de fallas, crear un placeholder
      const categories = faultTypes.length > 0 ? faultTypes : ['Sin áreas'];

      // Transformar los datos al formato de ApexCharts
      this.chartOptions.series = this.data['map']((item: any) => ({
        name: item.MachineName,
        data: faultTypes.length > 0
          ? faultTypes['map']((faultType: string) => item[faultType] || 0)
          : [0] // Si no hay áreas, mostrar 0
      }));

      // Actualizar las categorías del eje X
      this.chartOptions.xaxis = {
        ...this.chartOptions.xaxis,
        categories: categories
      };

      // Actualizar el gráfico si ya existe
      if (this.chart && this.chart.updateOptions) {
        this.chart.updateOptions({
          series: this.chartOptions.series,
          xaxis: {
            categories: categories
          }
        });
      }
      this.changeDetector.detectChanges();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    this.updateChart();
  }
  ngOnInit() {

  }
}
