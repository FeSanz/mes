import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonIcon, IonFab, IonFabButton, IonItem, IonButton, IonSelectOption, IonText, } from '@ionic/angular/standalone';
import { WebSocketService } from 'src/app/services/web-socket.service';
import { ApiService } from 'src/app/services/api.service';
import { AlertsService } from 'src/app/services/alerts.service';
import { ChartsComponent } from 'src/app/components/charts/charts.component';
import { NgxColorsModule } from 'ngx-colors';
import { GaugeComponent } from 'src/app/components/gauge/gauge.component';
import { HeatmapComponent } from 'src/app/components/heatmap/heatmap.component';
import { ThermometerComponent } from 'src/app/components/thermometer/thermometer.component';
import { addIcons } from 'ionicons';
import { addOutline, checkmark } from 'ionicons/icons';
import { EndpointsService } from 'src/app/services/endpoints.service';

export interface SensorData {
  [key: string]: any;
}

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
};
@Component({
  selector: 'app-monitoring',
  templateUrl: './monitoring.page.html',
  styleUrls: ['./monitoring.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonicModule, CommonModule, FormsModule, GaugeComponent, ChartsComponent, HeatmapComponent, ThermometerComponent, NgxColorsModule]
})
export class MonitoringPage implements OnInit {
  sensorData: SensorData[] = [];
  isModalOpen = false;
  newWidgetData: any = {
    name: "",
    machine: "",
    sensors: [
      {
        machine: "",
        id: "",
        color: '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0')
      }
    ],
    widgetType: "",
    chartType: ""
  }
  miData = {
    series: [
      {
        name: "W1",
        data: this.generateData(8, {
          min: 0,
          max: 90
        })
      },
      {
        name: "W2",
        data: this.generateData(8, {
          min: 0,
          max: 90
        })
      },
      {
        name: "W3",
        data: this.generateData(8, {
          min: 0,
          max: 90
        })
      },
      {
        name: "W4",
        data: this.generateData(8, {
          min: 0,
          max: 90
        })
      },
      {
        name: "W5",
        data: this.generateData(8, {
          min: 0,
          max: 90
        })
      },
      {
        name: "W6",
        data: this.generateData(8, {
          min: 0,
          max: 90
        })
      },
      {
        name: "W7",
        data: this.generateData(8, {
          min: 0,
          max: 90
        })
      },
      {
        name: "W8",
        data: this.generateData(8, {
          min: 0,
          max: 90
        })
      },
      {
        name: "W9",
        data: this.generateData(8, {
          min: 0,
          max: 90
        })
      },
      {
        name: "W10",
        data: this.generateData(8, {
          min: 0,
          max: 90
        })
      },
      {
        name: "W11",
        data: this.generateData(8, {
          min: 0,
          max: 90
        })
      },
      {
        name: "W12",
        data: this.generateData(8, {
          min: 0,
          max: 90
        })
      },
      {
        name: "W13",
        data: this.generateData(8, {
          min: 0,
          max: 90
        })
      },
      {
        name: "W14",
        data: this.generateData(8, {
          min: 0,
          max: 90
        })
      },
      {
        name: "W15",
        data: this.generateData(8, {
          min: 0,
          max: 90
        })
      }
    ],
    title: "Mapa de calor",
  }
  refreshData = false
  splineData: any = {
    series: [
      {
        name: "Ventas",
        data: [31, 40, 1, 51, 42, 7, 79]
      },
      {
        name: "Ventas 2",
        data: [31, 40, 28, 47, 42, 109, 100]
      }
    ],
    //title: "Mi gráfico de líneas",
    categories: [//Solo formato de fechas
      "2018-09-19T00:00:00.000Z",
      "2018-09-19T01:30:00.000Z",
      "2018-09-19T02:30:00.000Z",
      "2018-09-19T03:30:00.000Z",
      "2018-09-19T04:30:00.000Z",
      "2018-09-19T05:30:00.000Z",
      "2018-09-19T06:30:00.000Z"],
    type: "area"
    //tooltipFormat: "MMM yyyy"
  };
  user = "1"
  widgets: any = []
  machines: any = []

  constructor(
    private wsService: WebSocketService,
    private api: ApiService,
    private endPoints: EndpointsService,
    private alerts: AlertsService,
    private changeDetector: ChangeDetectorRef) {
    addIcons({ checkmark, addOutline })
  }

  ngOnInit() {
    this.sensorData.push();
  }

  ionViewDidEnter() {
    this.GetDasboards()
    /*this.api.GetTEST().then((response: any) => {
      console.log(response);
      
      //console.log(response.data[0].machineId);
    })*/

    /*const sensor_id = '1';
    this.wsService.suscribe(sensor_id, (data) => {
      console.log(data.value);
    }).then(ws => {
      //console.log('Conectado al socket');
    }).catch(err => {
      console.error('No se pudo conectar:', err);
    });*/
  }
  GetDasboards() {
    this.api.GetRequestRender(this.endPoints.Render('dashboards/1')).then((response: any) => {
      console.log(response);

      this.widgets = response.items.map((item: any, index: number) => ({
        index: index,
        id: item.id,
        name: item.name,
        jsonParams: { ...item.parameters, dashboard_id: item.dashboard_id, name: item.name }
      }));
      this.api.GetRequestRender(this.endPoints.Render('machinesAndSensors/1')).then((response: any) => {
        //console.log(response);
        this.machines = response.items
        this.newWidgetData.machine = response.items[0].machineId + ""
        //console.log(response.data[0].machineId);
      })
    })
  }
  ShowChartData(data: any) {
    //this.chartData = data
  }
  onResetZoom() {
    //this.chartWidget.resetZoom();
  }
  Suscribe() {
    /*this.wsService.Suscribe("F0:00:TEST", (data) => {
      console.log(data);
      this.changeDetector.detectChanges();
    }).then(ws => {
      console.log('Conectado al socket 2');
    }).catch(err => {
      console.error('No se pudo conectar:', err);
    });*/
  }
  public generateData(count: any, yrange: any) {
    var i = 0;
    var series = [];
    while (i < count) {
      var y =
        Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;

      series.push(y);
      i++;
    }
    return series;
  }
  changeData() {
    this.splineData.type = this.splineData.type == "bar" ? "area" : "bar"
    this.miData.series.push({
      name: "AQ",
      data: this.generateData(8, {
        min: 0,
        max: 90
      })
    })
    this.refreshData = true
    setTimeout(() => {
      this.refreshData = false;
    }, 100);
    this.changeDetector.detectChanges()
  }

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
    this.newWidgetData.name = "Widget " + (this.widgets.length + 1)
    this.newWidgetData.widgetType = "chart"
    this.newWidgetData.chartType = "area"
  }

  async addNewSensor() {
    this.newWidgetData.sensors.push({ machine_id: "", color: '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0') })
  }

  getSensorsForMachine(machine_id: number) {
    const machine = this.machines.find((d: any) => d.machine_id === machine_id);
    return machine ? machine.sensors : [];
  }

  async addNewWidget() {
    console.log(this.newWidgetData);
    //if (await this.ui.ShowAlert("¿Deseas agregar el nuevo widget?", "Alerta", "Atrás", "Agregar")) {
    let body: any = {}
    if (this.newWidgetData.widgetType == 'chart') {
      body = {
        "user_id": this.user,
        "color": "#FF5733",
        "name": this.newWidgetData.name,
        "parameters": {
          "widgetType": this.newWidgetData.widgetType,
          "chartType": this.newWidgetData.chartType,
          "sensors": this.newWidgetData.sensors,
        },
        "created_by": "1",
        "updated_by": "1"
      }
    } else if (this.newWidgetData.widgetType == 'heatmap') {
      body = {
        "user_id": this.user,
        "name": this.newWidgetData.name,
        "color": "#FF5733",
        "parameters": {
          "widgetType": this.newWidgetData.widgetType
        },
        "created_by": "1",
        "updated_by": "1"
      }
    }
    console.log(body);
    this.api.PostRequestRender(this.endPoints.Render('dashboards'), body).then((response: any) => {
      this.setOpen(false)
    this.GetDasboards()
      this.newWidgetData = {
        name: "",
        machine: "",
        sensors: [
          {
            machine: "",
            id: "",
            color: '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0')
          }
        ],
        widgetType: "",
        chartType: ""
      }
      this.changeDetector.detectChanges()
    })
    //}
  }
  async removeWidget(id: number) {
    if (await this.alerts.ShowAlert("¿Deseas eliminar este dashboard?", "Alerta", "Atrás", "Eliminar")) {
      /*this.api.Delete("/widgets/" + id).then((response: any) => {
        this.widgets = this.widgets.filter((w: any) => w.id !== id);
        this.changeDetector.detectChanges()
      })*/
    }
  }
}
