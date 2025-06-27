import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonIcon, IonFab, IonFabButton, IonItem, IonButton, IonSelectOption, IonText, IonModal, IonInput, IonSelect, IonLoading } from '@ionic/angular/standalone';
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
import { ActivatedRoute, Router } from '@angular/router';

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
  imports: [CommonModule, FormsModule, GaugeComponent, ChartsComponent, HeatmapComponent, ThermometerComponent, OnoffComponent, NgxColorsModule, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonIcon, IonFab, IonFabButton, IonItem, IonButton, IonSelectOption, IonText, IonModal, IonInput, IonSelect, IonLoading]
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
  user: any = {}
  widgets: any = []
  machines: any = []
  dashboardData: any = {}
  constructor(
    private api: ApiService,
    private router: Router,
    private endPoints: EndpointsService,
    private alerts: AlertsService,
    private changeDetector: ChangeDetectorRef) {
    addIcons({ checkmark, addOutline })
    this.user = JSON.parse(String(localStorage.getItem("userData")))
    const nav = this.router.getCurrentNavigation();
    const state: any = nav?.extras?.state;
    //this.activatedRoute.snapshot.paramMap.get('id') as string;
    if (state?.dash) {
      this.dashboardData = state?.dash
      localStorage.setItem('dashData', JSON.stringify(state?.dash))
    } else {
      this.dashboardData = JSON.parse(localStorage.getItem('dashData') || '{}');
    }
  }
  ngOnInit() {
    /*const dash_id = this.route.snapshot.paramMap.get('dash_id');
    const org_id = this.route.snapshot.paramMap.get('org_id');
 
    if (dash_id != null && org_id != null) {
      this.data.dash_id = dash_id
      this.data.org_id = org_id
      localStorage.setItem('dash_id', dash_id)
      localStorage.setItem('org_id', org_id)
    } else {
      this.data.dash_id = localStorage.getItem('dash_id')
      this.data.org_id = localStorage.getItem('org_id')
    }*/
  }

  ionViewDidEnter() {
    this.GetDasboards()
  }
  GetDasboards() {
    this.api.GetRequestRender(this.endPoints.Render('dashboards/group/' + this.dashboardData.dashboard_group_id), false).then((response: any) => {
      this.widgets = response.items.map((item: any, index: number) => ({
        index: index,
        id: item.dashboard_id,
        name: item.name,
        jsonParams: {
          ...item.parameters, dashboard_id: item.dashboard_id,
          organization_id: item.organization_id, name: item.name, color: item.color,
        }
      }));

      //const organizationIds: number[] = this.user.Company.Organizations.map((org: any) => org.OrganizationId);
      this.api.PostRequestRender(this.endPoints.Render('machinesAndSensorsByOrganizations'), { organizationIds: [this.dashboardData.organization_id] }, false).then((response: any) => {
        if (response.items.length > 0) {
          this.machines = response.items
          this.newWidgetData.machine = response.items[0].machineId + ""
        }
      })
    })
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
    let body: any = {}
    if (this.newWidgetData.widgetType == 'chart' || this.newWidgetData.widgetType == 'gauge' || this.newWidgetData.widgetType == 'thermo' || this.newWidgetData.widgetType == 'onoff') {
      body = {
        "user_id": this.user.user_id,
        "color": this.newWidgetData.color,
        "name": this.newWidgetData.name,
        "dashboard_group_id": this.dashboardData.dashboard_group_id,
        "parameters": {
          "widgetType": this.newWidgetData.widgetType,
          "chartType": this.newWidgetData.chartType,
          "sensors": this.newWidgetData.sensors,
        },
        "created_by": this.user.user_id,
        "updated_by": this.user.user_id
      }
    } else if (this.newWidgetData.widgetType == 'heatmap') {
      body = {
        "user_id": this.user.user_id,
        "name": this.newWidgetData.name,
        "dashboard_group_id": this.dashboardData.dashboard_group_id,
        "color": this.newWidgetData.color,
        "parameters": {
          "widgetType": this.newWidgetData.widgetType
        },
        "created_by": this.user.user_id,
        "updated_by": this.user.user_id
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
  }
  ChangeSensor(sensor: any) {
    const selectedSensor = this.getSensorsForMachine(sensor.machine_id).find((s: any) => s.sensor_id === sensor.sensor_id);
    sensor.sensor_name = selectedSensor?.sensor_name || '';
  }
  async removeWidget(id: number) {//Eliminar widget
    if (await this.alerts.ShowAlert("¿Deseas eliminar este dashboard?", "Alerta", "Atrás", "Eliminar")) {
      this.api.DeleteRequestRender(this.endPoints.Render('dashboards/') + id).then((response: any) => {
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
