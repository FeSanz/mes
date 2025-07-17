import { CommonModule } from '@angular/common';
import { Component, OnInit, OnChanges, SimpleChanges, ViewChild, Input, ChangeDetectorRef, EventEmitter, Output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgModel } from '@angular/forms';
import {
  IonCard, IonCardHeader, IonText, IonCardTitle, IonCardContent, IonButtons, IonButton, IonIcon, IonToolbar, IonPopover, IonContent, IonList, IonItem, IonFab, IonFabButton, IonHeader,
  IonTitle, IonSelect, IonSelectOption, IonModal, IonInput, IonDatetime, IonDatetimeButton
} from '@ionic/angular/standalone';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis, ApexDataLabels, ApexTooltip, ApexStroke, NgApexchartsModule, ChartType, ChartComponent } from "ng-apexcharts";
import { NgxColorsModule } from 'ngx-colors';
import { FormsModule } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';
//import { WebSocketService } from 'src/app/services/web-socket.service';
import { IonicModule } from '@ionic/angular';
import { WebSocketService } from 'src/app/services/web-socket.service';
import { EndpointsService } from 'src/app/services/endpoints.service';
import { addIcons } from 'ionicons';
import { ellipsisVertical, moveOutline, pencilOutline, trashOutline } from 'ionicons/icons';
import { AlertsService } from 'src/app/services/alerts.service';
import { CdkDragHandle } from '@angular/cdk/drag-drop';

export interface SplineData {
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
  legend: ApexLegend
};

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, NgApexchartsModule, NgxColorsModule, IonText, IonCard, IonCardTitle, IonCardContent, IonButtons, IonButton, IonIcon, IonToolbar, IonPopover, IonContent, IonList, IonItem, IonFab, IonFabButton, IonInput,
    IonHeader, IonTitle, IonSelect, IonSelectOption, IonModal, CdkDragHandle, IonDatetime, IonDatetimeButton],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ChartsComponent implements OnInit {
  @ViewChild("splineChart", { static: false }) chart: ChartComponent | undefined;
  @Input() data: SplineData = {};
  @Input() refreshData: boolean = false;
  @Output() remove = new EventEmitter<number>();
  public chartOptions: ChartOptions;
  widgetData: any = {}
  copyWidgetData: any = {}
  machines: any
  isModalOpen = false;
  showChart: boolean = true;

  private conexionesLocales: { [sensorId: string]: WebSocket } = {};
  isPaused = false;
  customStartDate = '2025-07-10T13:34:49';
  customEndDate = '2025-07-10T13:34:49';
  nowDate = ''
  constructor(private changeDetector: ChangeDetectorRef,
    private alerts: AlertsService,
    private ws: WebSocketService,
    private endPoints: EndpointsService,
    private api: ApiService) {
    addIcons({ ellipsisVertical, pencilOutline, trashOutline, moveOutline })
    this.chartOptions = {
      series: [],
      chart: {
        animations: {
          enabled: true,
          speed: 1,
          animateGradually: {
            enabled: true,
            delay: 1
          },
          dynamicAnimation: {
            enabled: true,
            speed: 1
          }
        },
        height: 350,
        type: "area",
        toolbar: {
          show: true,
          tools: {
            download: window.innerWidth > 768,
            selection: true
          }
        },
        zoom: {
          enabled: true,
          type: 'x',
          allowMouseWheelZoom: false,  // Desactiva zoom con rueda del mouse
          autoScaleYaxis: true      // Opcional: escala automática del eje Y
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: "smooth",
        width: 2
      },
      xaxis: {
        type: "datetime",
        labels: {
          datetimeUTC: false,
          format: "dd/MM/yy hh:mm"
        }
      },
      yaxis: {
      },
      tooltip: {
        x: {
          format: "dd/MM/yy hh:mm"
        }
      },
      legend: {
        show: true,              // Asegúrate de que esté visible
        position: 'bottom',      // Posición horizontal
        horizontalAlign: 'center',
        floating: false,
        offsetY: 0,
        itemMargin: {
          horizontal: 10,
          vertical: 5
        }
      }
    };
  }
  ngOnInit() {
    this.widgetData = this.data
    this.initializeChart();
  }
  initializeChart() {
    if (this.widgetData.chartType) {
      this.chartOptions.chart.type = this.widgetData.chartType;
      this.chart?.updateOptions(this.chartOptions);
    }
    const { start, end } = this.getDateRangeFromOption(this.widgetData.dateRange);
    this.nowDate = this.formatLocalISO(new Date())
    this.loadSensorData(start, end)
  }
  async loadSensorData(start: Date, end: Date) {
    const startStr = start.toISOString()
    const endStr = end.toISOString()
    const sensors = this.widgetData.sensors;
    const sensorIDsString = sensors.map((sensor: any) => sensor.sensor_id).join(',');
    try {
      const response: any = await this.api.GetRequestRender(
        `sensorsData/?sensors=${sensorIDsString}&start=${startStr}&end=${endStr}`, false
      );
      const data = response.items.map((sensor: any) => {
        const colorObj = sensors.find((s: any) => s.sensor_id == sensor.sensor_id);
        return {
          color: colorObj.color,
          name: sensor.sensor_name,
          zIndex: sensor.sensor_id,
          data: sensor.data.map((data: any) => ({
            x: new Date(data.time).getTime(),
            y: Number(data.value)
          }))
        };
      });
      this.chartOptions.series = data;
      this.ajustarYaxis();
      if (this.chart && this.chart.updateOptions) {
        console.log("UPDATE chart");
        this.chart.updateOptions(this.chartOptions);
      }
      this.startSubscriptions();
    } catch (error) {
      console.error('Error al cargar datos de sensores:', error);
    }
  }
  changeOnTimeRange(event: any) {
    const selectedValue = event.detail.value;
    if (selectedValue == 'custom') {
      this.isPaused = true
      const { start, end } = this.getDateRangeFromOption('last7days');
      this.customStartDate = this.formatLocalISO(start)//.toISOString()
      this.customEndDate = this.formatLocalISO(end)//.toISOString()
      this.changeDetector.detectChanges()
      this.loadSensorData(start, end)
    } else {
      this.api.PutRequestRender('dashboards/dateRange', { dateRange: selectedValue, dashboard_id: this.widgetData.dashboard_id }).then((response: any) => {
        if (response.errorsExistFlag) {
        } else {
          this.isPaused = false
          const { start, end } = this.getDateRangeFromOption(selectedValue);
          this.loadSensorData(start, end)
        }
      })
    }
  }
  onStartDateChange(event: any) {
    const selectedValue = event.detail.value;
    this.changeDetector.detectChanges()
    this.loadSensorData(new Date(selectedValue), new Date(this.customEndDate))
  }
  onEndDateChange(event: any) {
    const selectedValue = event.detail.value;
    this.changeDetector.detectChanges()
    this.loadSensorData(new Date(this.customStartDate), new Date(selectedValue))
  }
  getDateRangeFromOption(option: string): { start: Date; end: Date } {
    const now = new Date();
    const end = new Date(); // Fecha actual
    let start: Date;
    switch (option) {
      case 'last1h':
        start = new Date(now.getTime() - 1 * 60 * 60 * 1000); // Hace 1 hora
        break;

      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;

      case 'last24h':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;

      case 'last7days':
        start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
        start.setHours(0, 0, 0, 0);
        break;

      case 'thisWeek': {
        const dayOfWeek = now.getDay(); // 0 = domingo
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // lunes
        start = new Date(now.setDate(diff));
        start.setHours(0, 0, 0, 0);
        break;
      }
      case 'last30days':
        start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
        start.setHours(0, 0, 0, 0);
        break;

      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;

      default:
        throw new Error('Opción de rango de fechas no válida');
    }

    return { start, end };
  }
  formatLocalISO(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T` +
      `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }
  localToISOString(localString: string): string {
    const localDate = new Date(localString);
    return localDate.toISOString();
  }
  startSubscriptions() {
    const sensores = this.widgetData.sensors;
    for (const sensor_id in this.conexionesLocales) {
      if (this.conexionesLocales[sensor_id]) {
        this.conexionesLocales[sensor_id].close();
        delete this.conexionesLocales[sensor_id];
      }
    }
    sensores.forEach((sensor: any) => {
      const sensor_id = sensor.sensor_id;
      this.ws.SuscribeById({sensor_id}, "sensor", (data) => {
        if (this.isPaused) return;
        const timestamp = new Date(data.data.time).getTime();
        const { start } = this.getDateRangeFromOption(this.widgetData.dateRange);
        const serie: any = this.chartOptions.series.find((s: any) => s.zIndex == data.data.sensorId);
        if (serie) {// Agrega el nuevo dato
          serie.data.unshift({ x: timestamp, y: Number(data.data.value) });
          //serie.data.unshift({ x: timestamp, y: Number(data.data.value) });
          serie.data = serie.data.filter((d: any) => d.x >= start.getTime());
          if (this.chart && this.chart.updateSeries) {
            this.chart.updateSeries(this.chartOptions.series);
            this.ajustarYaxis();
          }
        }
      }).then((ws) => {
        this.conexionesLocales[sensor_id] = ws;
      }).catch(err => {
        console.error('Error suscribiendo a sensor', sensor_id, err);
      });
    });
  }
  stopSubscriptions() {
    for (const sensorId in this.conexionesLocales) {
      const ws = this.conexionesLocales[sensorId];
      if (ws && ws.readyState === WebSocket.OPEN) {
        console.log("unsuscribed");
        ws.send(JSON.stringify({ type: 'unsuscribe', sensor_id: sensorId }));
        ws.close();
      }
    }
    this.conexionesLocales = {};
  }
  UpdateNow() {
    this.nowDate = this.formatLocalISO(new Date())
  }
  ajustarYaxis() {
    const allYValues: number[] = [];
    this.chartOptions.series.forEach((serie: any) => {
      serie.data.forEach((point: any) => {
        if (typeof point.y === 'number') {
          allYValues.push(point.y);
        }
      });
    });
    if (allYValues.length === 0) return;
    const min = Math.min(...allYValues);
    const max = Math.max(...allYValues);
    const padding = 2;
    const newYaxis = {
      min: min - padding < 10 ? min - padding : 10,
      max: max + padding > 25 ? max + padding : 25
    };
    this.chartOptions.yaxis = newYaxis;
    if (this.chart && this.chart.updateOptions) {
      this.chart.updateOptions({
        yaxis: newYaxis
      });
    }
  }
  ionViewWillLeave() {
    this.stopSubscriptions()
  }
  async addNewSensor() {
    this.copyWidgetData.sensors.push({ color: '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0') })
  }
  updateChartDB() {
    const body = {
      name: this.copyWidgetData.name,
      user_id: 1,
      color: this.copyWidgetData.color,
      updated_by: 1,
      parameters: {
        widgetType: this.copyWidgetData.widgetType,
        selectedTimeRange: this.copyWidgetData.selectedTimeRange,
        chartType: this.copyWidgetData.chartType,
        sensors: this.copyWidgetData.sensors,
      }
    }
    this.showChart = false;
    this.api.PutRequestRender('dashboards/' + this.widgetData.dashboard_id, body).then((response: any) => {
      if (response.errorsExistFlag) {
        this.alerts.Info(response.message);
      } else {
        this.widgetData = JSON.parse(JSON.stringify(this.copyWidgetData))
        this.data = this.widgetData
        this.showChart = true;
        this.initializeChart()
        this.isModalOpen = false
        this.changeDetector.detectChanges()
      }
    })
  }
  deleteChart() {
    this.remove.emit(this.widgetData.id);
  }
  editChart() {
    this.copyWidgetData = JSON.parse(JSON.stringify(this.widgetData))
    this.api.GetRequestRender('machinesAndSensorsByOrganizations?organizations=' + this.widgetData.organization_id).then((response: any) => {
      this.machines = response.items
      this.isModalOpen = true;
      //this.newWidgetData.machine = response.data[0].MachineId + ""
      //console.log(response.data[0].MachineId);
    })
  }
  getSensorsForMachine(MachineId: number) {
    const machine: any = this.machines.find((m: any) => m.machine_id == MachineId);
    return machine ? machine.sensors : [];
  }
  async removeSensor(sensor: any) {
    this.copyWidgetData.sensors = this.copyWidgetData.sensors.filter((se: any) => se !== sensor);
    this.changeDetector.detectChanges()
  }
  isDarkColor(hexColor: string): boolean {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma < 128;
  }
  get widgetTextColor(): string {
    return this.isDarkColor(this.widgetData.color) ? 'white' : 'black';
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['refreshData'] && changes['refreshData'].currentValue === true) {
      this.ajustarYaxis();
    }
  }
}
