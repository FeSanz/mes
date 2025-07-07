import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonIcon, IonFab, IonFabButton, IonItem, IonButton, IonSelectOption, IonText, IonModal, IonInput, IonSelect, IonLoading, IonRippleEffect } from '@ionic/angular/standalone';
import { WebSocketService } from 'src/app/services/web-socket.service';
import { ApiService } from 'src/app/services/api.service';
import { AlertsService } from 'src/app/services/alerts.service';
import { ChartsComponent } from 'src/app/components/charts/charts.component';
import { NgxColorsModule } from 'ngx-colors';
import { GaugeComponent } from 'src/app/components/gauge/gauge.component';
import { HeatmapComponent } from 'src/app/components/heatmap/heatmap.component';
import { WaterTankComponent } from 'src/app/components/watertank/watertank.component';
import { ThermometerComponent } from 'src/app/components/thermometer/thermometer.component';
import { OnoffComponent } from 'src/app/components/onoff/onoff.component';
import { addIcons } from 'ionicons';
import { addOutline, checkmark, logoHackernews } from 'ionicons/icons';
import { EndpointsService } from 'src/app/services/endpoints.service';
import { Router } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { PermissionsService } from 'src/app/services/permissions.service';
import { ResizeEvent, ResizableModule } from 'angular-resizable-element';

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
  imports: [CommonModule, FormsModule, GaugeComponent, ChartsComponent, HeatmapComponent, ThermometerComponent, OnoffComponent, WaterTankComponent, NgxColorsModule, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonIcon, IonFab, IonFabButton,
    IonItem, IonButton, IonSelectOption, IonText, IonModal, IonInput, IonSelect, IonLoading, DragDropModule, ResizableModule, IonRippleEffect]
})
export class MonitoringPage implements OnInit {
  sensorData: SensorData[] = [];
  isModalOpen = false;
  isDragging = false;
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
  shouldRefresh = false;
  constructor(
    private api: ApiService,
    private router: Router,
    private alerts: AlertsService,
    private endPoints: EndpointsService,
    public permissions: PermissionsService,
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
    this.api.GetRequestRender('dashboards/group/' + this.dashboardData.dashboard_group_id, false).then((response: any) => {
      this.widgets = response.items.map((item: any, index: number) => ({
        index: index,
        id: item.dashboard_id,
        name: item.name,
        colSize: item.col_size || 4,
        previewWidth: undefined,
        colSizePreview: undefined,
        jsonParams: {
          ...item.parameters,
          dashboard_id: item.dashboard_id,
          organization_id: item.organization_id,
          name: item.name,
          color: item.color,
        }
      }));

      // Simular resize para cada widget
      setTimeout(() => {
        this.simulateResizeForAllWidgets();
      }, 100);
      this.changeDetector.detectChanges()
      this.api.GetRequestRender('machinesAndSensorsByOrganizations?organizations=' + this.dashboardData.organization_id).then((response: any) => {
        if (response.items.length > 0) {
          this.machines = response.items
          this.newWidgetData.machine = response.items[0].machineId + ""
        }
      })
    })
  }
  private simulateResizeForAllWidgets(): void {
    this.widgets.forEach((widget: any, index: any) => {
      // Simular el evento de resize
      const row = document.querySelector('.drag-row');
      const gridWidth = row ? row.clientWidth : window.innerWidth;
      const colUnit = gridWidth / 12;
      const currentWidth = (widget.colSize || 4) * colUnit;

      // Crear un evento de resize simulado
      const simulatedEvent: any = {
        rectangle: {
          width: currentWidth,
          height: 200 // altura por defecto
        }
      };

      // Llamar a onResizing
      this.onResizing(simulatedEvent, widget);

      // Inmediatamente llamar a onResizeEnd
      setTimeout(() => {
        this.onResizeEnd(simulatedEvent, widget);
      }, 10);
    });
  }
  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
    this.newWidgetData.name = "Widget " + (this.widgets.length + 1)
    this.newWidgetData.widgetType = "chart"
    this.newWidgetData.chartType = "area"
    this.newWidgetData.sensors[0].machine_id = this.machines[0].machine_id
    this.newWidgetData.sensors[0].sensor_id = this.machines[0].sensors[0].sensor_id
    console.log(this.machines);

  }
  getColSize(widget: any): number {
    const val = Number(widget.colSize);
    return isNaN(val) ? 4 : Math.min(Math.max(val, 1), 12);
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
    console.log(this.user);

    if (this.newWidgetData.widgetType == 'chart' || this.newWidgetData.widgetType == 'gauge' || this.newWidgetData.widgetType == 'thermo' || this.newWidgetData.widgetType == 'onoff' || this.newWidgetData.widgetType == 'watertank') {
      body = {
        "user_id": this.user.UserId,
        "color": this.newWidgetData.color,
        "index": Number(this.widgets.length) + 1,
        "name": this.newWidgetData.name,
        "dashboard_group_id": this.dashboardData.dashboard_group_id,
        "parameters": {
          "widgetType": this.newWidgetData.widgetType,
          "chartType": this.newWidgetData.chartType,
          "sensors": this.newWidgetData.sensors,
        },
        "created_by": this.user.UserId,
        "updated_by": this.user.UserId
      }
    } else if (this.newWidgetData.widgetType == 'heatmap') {
      body = {
        "user_id": this.user.UserId,
        "index": Number(this.widgets.length) + 1,
        "name": this.newWidgetData.name,
        "dashboard_group_id": this.dashboardData.dashboard_group_id,
        "color": this.newWidgetData.color,
        "parameters": {
          "widgetType": this.newWidgetData.widgetType
        },
        "created_by": this.user.UserId,
        "updated_by": this.user.UserId
      }
    }
    this.api.PostRequestRender('dashboards', body).then((response: any) => {
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
      this.api.DeleteRequestRender('dashboards/' + id).then((response: any) => {
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

  saveWidgetOrder() {
    const body = this.widgets.map((item: any) => ({
      dashboard_id: item.id,
      index: item.index
    }))
    //console.log(body);
    this.api.PutRequestRender('dashboards/order', { "items": body }, false).then((response: any) => {
      if (!response.errorsExistFlag) {
        //this.alerts.Success("Dashboard eliminado")
      } else {
        this.alerts.Error("Error al reordenar los widgets, intente más tarde.")
      }
    })
  }

  onDrop(event: CdkDragDrop<any[]>) {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.widgets, event.previousIndex, event.currentIndex);
      this.widgets.forEach((widget: any, i: any) => {
        widget.index = i;
      });
      this.saveWidgetOrder();
    }
  }

  trackByWidget(index: number, widget: any): any {
    return widget.jsonParams.dashboard_id;
  }

  validateResize = ({ rectangle }: any): boolean => {
    const minWidth = 200;
    const maxWidth = 800;

    return rectangle.width >= minWidth && rectangle.width <= maxWidth;
  }

  onResizeEnd(event: ResizeEvent, widget: any): void {
    widget.colSize = widget.colSizePreview;
    widget.previewWidth = undefined;
    delete widget.colSizePreview;
    this.changeDetector.detectChanges();
    this.shouldRefresh = true;

    // Reiniciar bandera para permitir futuros refresh
    setTimeout(() => this.shouldRefresh = false, 100);
    this.api.PutRequestRender('dashboards/size', { "dashboard_id": widget.id, "colSize": widget.colSize }, false).then((response: any) => {
      if (!response.errorsExistFlag) {
        //this.alerts.Success("Dashboard eliminado")
      } else {
        this.alerts.Error("Error al reordenar los widgets, intente más tarde.")
      }
    })
  }
  onResizing(event: ResizeEvent, widget: any): void {
    //console.log(JSON.parse(JSON.stringify(widget)));
    const row = document.querySelector('.drag-row');
    const gridWidth = row ? row.clientWidth : window.innerWidth;

    if (event.rectangle.width) {
      const colUnit = gridWidth / 12;
      let colSize = Math.round(event.rectangle.width / colUnit);
      colSize = Math.min(Math.max(colSize, 1), 12);

      widget.previewWidth = event.rectangle.width;
      widget.colSizePreview = colSize;

      this.changeDetector.detectChanges();
    }
  }

  onResizeStart(event: ResizeEvent, widget: any): void {
    //(JSON.parse(JSON.stringify(widget)));
    this.onResizing(event, widget)
  }
  // Obtener ancho por defecto basado en breakpoints
  getDefaultWidth(): number {
    const screenWidth = window.innerWidth;

    if (screenWidth >= 1200) {
      return 400; // xl
    } else if (screenWidth >= 992) {
      return 500; // lg
    } else if (screenWidth >= 768) {
      return 350; // md
    } else {
      return screenWidth - 40; // sm/xs con padding
    }
  }

  getResponsiveSize(widget: any): number {
    const screenWidth = window.innerWidth;
    // En pantallas pequeñas, usar 12 columnas
    if (screenWidth < 768) {
      return 12;
    }
    return widget.colSizePreview || widget.colSize;
  }
  getPageWidth(): number {
    return window.innerWidth;
  }
}
