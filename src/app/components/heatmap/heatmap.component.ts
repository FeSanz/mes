import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, Input, OnChanges, SimpleChanges, EventEmitter, Output } from '@angular/core';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButtons, IonButton, IonIcon, IonToolbar, IonPopover, IonContent, IonList, IonItem } from '@ionic/angular/standalone';
import { ApexAxisChartSeries, ApexTitleSubtitle, ApexDataLabels, ApexChart, NgApexchartsModule, ApexXAxis, ApexYAxis, ApexPlotOptions, ApexTooltip } from "ng-apexcharts";

export interface HeatmapData {
  [key: string]: any;
}

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  title: ApexTitleSubtitle;
  grid: ApexGrid;
  plotOptions: ApexPlotOptions;
  tooltip: ApexTooltip;
  colors: string[];
};

@Component({
  selector: 'app-heatmap',
  templateUrl: './heatmap.component.html',
  styleUrls: ['./heatmap.component.scss'],
  standalone: true,
  imports: [CommonModule, NgApexchartsModule/*, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButtons, IonButton, IonIcon, IonToolbar, IonPopover, IonContent, IonList, IonItem*/],
})
export class HeatmapComponent  implements OnInit {
  @ViewChild("heatmapChar") chart: any;
  @Input() data: HeatmapData = {};
  @Input() refreshData: boolean = false;
  @Output() remove = new EventEmitter<number>();
  public chartOptions: ChartOptions;
  title = "Heatmap"

  constructor() {
    // Configuración inicial predeterminada
    this.chartOptions = {
      series: [],
      chart: {
        height: 350,
        type: "heatmap"
      },
      dataLabels: {
        enabled: false
      },
      colors: [
        "#008FFB"
      ],
      xaxis: {
        type: "category",
        categories: []
      },
      title: {
        text: "Mapa de calor"
      },
      grid: {
        padding: {
          right: 20
        }
      },
      yaxis: {},
      plotOptions: {},
      tooltip: {}
    };
  }

  ngOnInit() {
    this.initializeChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Actualizar el gráfico cuando cambian los datos de entrada
    if (changes['data'] && !changes['data'].firstChange) {
      this.updateChart();
    }

    // Forzar actualización cuando refreshData cambia a true
    if (changes['refreshData'] && changes['refreshData'].currentValue === true) {
      this.updateChart();
    }
  }

  initializeChart() {
    this.loadDefaultData();
  }

  updateChart() {
    // Actualizar solo las propiedades que vienen en los datos de entrada
    /*if (this.data.series) {
      this.chartOptions.series = this.data.series;
    }

    if (this.data.title) {
      this.chartOptions.title = {
        ...this.chartOptions.title,
        text: this.data.title
      };
    }

    if (this.data.colors) {
      this.chartOptions.colors = this.data.colors;
    }

    if (this.data.height) {
      this.chartOptions.chart = {
        ...this.chartOptions.chart,
        height: this.data.height
      };
    }
    console.log(this.chartOptions);
    /*console.log(this.chart);

    // Si el gráfico ya está inicializado, actualizar
    if (this.chart && this.chart.updateOptions) {
      this.chart.updateOptions(this.chartOptions);
    }*/
  }

  loadDefaultData() {
    // Cargar datos de ejemplo si no hay datos de entrada
    this.chartOptions.series = [
      {
        name: "23:00",
        data: this.generateData(6, {
          min: 0,
          max: 100
        })
      },
      {
        name: "22:00",
        data: this.generateData(6, {
          min: 0,
          max: 100
        })
      },
      {
        name: "21:00",
        data: this.generateData(6, {
          min: 0,
          max: 100
        })
      },
      {
        name: "20:00",
        data: this.generateData(6, {
          min: 0,
          max: 100
        })
      },
      {
        name: "19:00",
        data: this.generateData(6, {
          min: 0,
          max: 100
        })
      },
      {
        name: "18:00",
        data: this.generateData(6, {
          min: 0,
          max: 100
        })
      },
      {
        name: "17:00",
        data: this.generateData(6, {
          min: 0,
          max: 100
        })
      },
      {
        name: "16:00",
        data: this.generateData(6, {
          min: 0,
          max: 100
        })
      },
      {
        name: "06:00",
        data: this.generateData(6, {
          min: 0,
          max: 100
        })
      },
      {
        name: "15:00",
        data: this.generateData(6, {
          min: 0,
          max: 100
        })
      },
      {
        name: "14:00",
        data: this.generateData(6, {
          min: 0,
          max: 100
        })
      },
      {
        name: "13:00",
        data: this.generateData(6, {
          min: 0,
          max: 100
        })
      },
      {
        name: "12:00",
        data: this.generateData(6, {
          min: 0,
          max: 100
        })
      },
      {
        name: "11:00",
        data: this.generateData(6, {
          min: 0,
          max: 100
        })
      },
      {
        name: "10:00",
        data: this.generateData(6, {
          min: 0,
          max: 100
        })
      },
      {
        name: "09:00",
        data: this.generateData(6, {
          min: 0,
          max: 100
        })
      },
      {
        name: "08:00",
        data: this.generateData(6, {
          min: 0,
          max: 100
        })
      },
      {
        name: "07:00",
        data: this.generateData(6, {
          min: 0,
          max: 100
        })
      },
      {
        name: "05:00",
        data: this.generateData(6, {
          min: 0,
          max: 100
        })
      },
      {
        name: "04:00",
        data: this.generateData(6, {
          min: 0,
          max: 100
        })
      },
      {
        name: "03:00",
        data: this.generateData(6, {
          min: 0,
          max: 100
        })
      },
      {
        name: "02:00",
        data: this.generateData(6, {
          min: 0,
          max: 100
        })
      },
      {
        name: "01:00",
        data: this.generateData(6, {
          min: 0,
          max: 100
        })
      },
      {
        name: "00:00",
        data: this.generateData(6, {
          min: 0,
          max: 100
        })
      }
    ]

    // Si el gráfico ya está inicializado, actualizar
    if (this.chart && this.chart.updateOptions) {
      this.chart.updateOptions(this.chartOptions);
    }
  }

  generateData(count: number, yrange: { min: number, max: number }) {
    var i = 0;
    var series = [];
    while (i < count) {
      var x = (i + 1).toString() + "0 m"
      var y =
        Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;

      series.push({
        x: x,
        y: y
      });
      i++;
    }
    return series;
  }
  Delete() {
    this.remove.emit(this.data['id']);
  }
}