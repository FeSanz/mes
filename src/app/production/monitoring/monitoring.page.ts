import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonIcon, IonFab, IonFabButton, IonItem, IonButton, IonSelectOption, IonText, IonModal, IonInput, IonSelect } from '@ionic/angular/standalone';
import { WebSocketService } from 'src/app/services/web-socket.service';
import { ApiService } from 'src/app/services/api.service';
import { AlertsService } from 'src/app/services/alerts.service';
import { ChartsComponent } from 'src/app/components/charts/charts.component';
import { NgxColorsModule } from 'ngx-colors';
import { GaugeComponent } from 'src/app/components/gauge/gauge.component';
import { HeatmapComponent } from 'src/app/components/heatmap/heatmap.component';
import { ThermometerComponent } from 'src/app/components/thermometer/thermometer.component';
import { OnoffComponent } from 'src/app/components/onoff/onoff.component';
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
  imports: [CommonModule, FormsModule, GaugeComponent, ChartsComponent, HeatmapComponent, ThermometerComponent, OnoffComponent, NgxColorsModule, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonIcon, IonFab, IonFabButton, IonItem, IonButton, IonSelectOption, IonText, IonModal, IonInput, IonSelect]
})
export class MonitoringPage implements OnInit {
  sensorData: SensorData[] = [];
  isModalOpen = false;
  newWidgetData: any = {
    name: "",
    color: '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0'),
    sensors: [
      {
        machine_id: "",
        sensor_name: "",
        sensor_id: "",
        color: '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0'),
        min: 0,
        max: 100,
        minColor: '#ff8300',
        maxColor: '#198bfd'
      }
    ],
    widgetType: "",
    chartType: ""
  }
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
  }
  GetDasboards() {
    this.api.GetRequestRender(this.endPoints.Render('dashboards/1')).then((response: any) => {
      console.log(response);
      this.widgets = response.items.map((item: any, index: number) => ({
        index: index,
        id: item.dashboard_id,
        name: item.name,
        jsonParams: { ...item.parameters, dashboard_id: item.dashboard_id, name: item.name, color: item.color, }
      }));

      this.api.GetRequestRender(this.endPoints.Render('machinesAndSensors/1')).then((response: any) => {
        this.machines = response.items
        this.newWidgetData.machine = response.items[0].machineId + ""
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
  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
    this.newWidgetData.name = "Widget " + (this.widgets.length + 1)
    this.newWidgetData.widgetType = "chart"
    this.newWidgetData.chartType = "area"
  }
  async addNewSensor() {
    this.newWidgetData.sensors.push({
      machine_id: "",
      sensor_name: "",
      color: '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0')
    })
  }
  getSensorsForMachine(machine_id: number) {
    const machine = this.machines.find((d: any) => d.machine_id === machine_id);
    return machine ? machine.sensors : [];
  }
  async addNewWidget() {
    //if (await this.ui.ShowAlert("¿Deseas agregar el nuevo widget?", "Alerta", "Atrás", "Agregar")) {
    let body: any = {}
    if (this.newWidgetData.widgetType == 'chart' || this.newWidgetData.widgetType == 'gauge' || this.newWidgetData.widgetType == 'thermo' || this.newWidgetData.widgetType == 'onoff') {
      body = {
        "user_id": this.user,
        "color": this.newWidgetData.color,
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
    this.api.PostRequestRender(this.endPoints.Render('dashboards'), body).then((response: any) => {
      this.setOpen(false)
      this.GetDasboards()
      this.newWidgetData = {
        name: "",
        color: '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0'),
        sensors: [
          {
            machine_id: null,
            sensor_id: null,
            sensor_name: "",
            color: '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0'),
            min: 0,
            max: 100,
            minColor: '#ff8300',
            maxColor: '#198bfd'
          }
        ],
        widgetType: "",
        chartType: ""
      }
      this.changeDetector.detectChanges()
    })
    //}
  }
  ChangeSensor(sensor: any) {
    const selectedSensor = this.getSensorsForMachine(sensor.machine_id).find(
      (s: any) => s.sensor_id === sensor.sensor_id
    );
    sensor.sensor_name = selectedSensor?.sensor_name || '';
    console.log(sensor);
  }
  async removeWidget(id: number) {
    console.log(id);
    if (await this.alerts.ShowAlert("¿Deseas eliminar este dashboard?", "Alerta", "Atrás", "Eliminar")) {
      this.api.DeleteRequestRender(this.endPoints.Render('dashboards/') + id).then((response: any) => {
        console.log(response);
        if (!response.errorsExistFlag) {
          this.widgets = this.widgets.filter((w: any) => w.jsonParams.dashboard_id !== id);
          this.changeDetector.detectChanges()
          this.alerts.Success("Dashboard eliminado")
        } else {
          this.alerts.Error(response.error)
        }
      })
    }
  }
  async removeSensor(sensor: any) {
    this.newWidgetData.sensors = this.newWidgetData.sensors.filter((se: any) => se !== sensor);
    this.changeDetector.detectChanges()
  }
}
