import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonCard, IonCardTitle, IonCardContent, IonButtons, IonIcon, IonToolbar, IonPopover, IonContent, IonList,
  IonItem, IonFab, IonFabButton, IonHeader, IonTitle, IonSelect, IonSelectOption, IonModal, IonInput, IonDatetime, IonDatetimeButton, IonToggle
} from '@ionic/angular/standalone';
import { NgxColorsModule } from 'ngx-colors';
import { addIcons } from 'ionicons';
import { ellipsisVertical, pencilOutline, trashOutline, checkmark, moveOutline, refresh, reloadOutline } from 'ionicons/icons';
import { ApiService } from 'src/app/services/api.service';
import { WebSocketService } from 'src/app/services/web-socket.service';
import { EndpointsService } from 'src/app/services/endpoints.service';
import { CdkDragHandle } from '@angular/cdk/drag-drop';

export interface CounterData {
  [key: string]: any;
}

@Component({
  selector: 'app-counter',
  templateUrl: './counter.component.html',
  styleUrls: ['./counter.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, NgxColorsModule, IonCard, IonCardTitle, IonCardContent, IonButtons, IonIcon, IonToolbar, IonPopover, IonContent, IonList, IonItem, IonFab, IonFabButton, IonHeader, IonTitle, IonSelect, IonSelectOption,
    IonModal, IonInput, CdkDragHandle, IonDatetime, IonDatetimeButton, IonToggle],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CounterComponent implements OnInit {
  widgetData: any = {}
  copyWidgetData: any = {}
  isModalOpen = false;
  lastDate: any = ""
  showChart: boolean = true;
  machines: any = []
  lastValue = 0
  show = false
  @Input() data: CounterData = {};
  @Output() remove = new EventEmitter<number>();
  countStr: number = 0
  isPaused = false;
  nowDate = ''
  customStartDate = '2025-07-10T13:34:49';
  customEndDate = '2025-07-10T13:34:49';
  public displayDigits: string[] = ['0', '0', '0', '0', '0', '0'];
  public flipStates: string[] = [
    'normal',
    'normal',
    'normal',
    'normal',
    'normal',
    'normal',
  ];

  constructor(
    private changeDetector: ChangeDetectorRef,
    private ws: WebSocketService,
    private endPoints: EndpointsService,
    private api: ApiService) {
    addIcons({ moveOutline, ellipsisVertical, reloadOutline, pencilOutline, trashOutline, checkmark, refresh });
  }

  ngOnInit() {
    this.initializeConfig();

  }

  private initializeConfig() {
    this.widgetData = this.data
    //console.log(this.data);

    if (this.widgetData.dateRange == 'current') {
      this.reload()
      this.GetSensorValue()
    } else {
      const { start, end } = this.getDateRangeFromOption(this.widgetData.dateRange);
      this.loadSensorData(start, end)
      this.nowDate = this.formatLocalISO(new Date())
      this.changeDetector.detectChanges()
    }
    this.startSubscriptions()
    //this.GetSensorValue()
  }
  GetSensorValue() {
    this.api.GetRequestRender('sensorData/' + this.widgetData.sensors[0].sensor_id, false).then((response: any) => {
      this.updateCounterDisplay(Math.round(response.items.data[0].value));
      this.lastDate = response.items.data[0].time

    })
  }
  updateChartDB() {
    //console.log(this.copyWidgetData);
    const body = {
      name: this.copyWidgetData.name,
      user_id: 1,
      color: this.copyWidgetData.color,
      updated_by: 1,
      border_flag: this.copyWidgetData.borderFlag,
      parameters: {
        widgetType: this.copyWidgetData.widgetType,
        chartType: this.copyWidgetData.chartType,
        sensors: this.copyWidgetData.sensors,
      }
    }
    //console.log(body);
    this.showChart = false;
    this.api.PutRequestRender('dashboards/' + this.widgetData.dashboard_id, body).then((response: any) => {
      //console.log(response);
      this.widgetData = JSON.parse(JSON.stringify(this.copyWidgetData))
      this.data = this.widgetData
      this.showChart = true;
      this.initializeConfig()
      this.isModalOpen = false
      this.changeDetector.detectChanges()
    })
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
      const suma = response.items[0].data.reduce((sum: any, item: any) => sum + Number(item.value), 0);
      this.lastDate = response.items[0].data[0].time
      this.countStr = 0
      this.updateCounterDisplay(Math.round(suma))
      //this.startSubscriptions();
    } catch (error) {
      console.error('Error al cargar datos de sensores:', error);
    }
  }
  startSubscriptions() {
    this.ws.SuscribeById({ sensor_id: this.widgetData.sensors[0].sensor_id }, "sensor", (response) => {
      //console.log(response);      
      if (this.isPaused) return;
      this.updateCounterDisplay(Math.round(response.data.value));
      this.lastDate = response.data.time
    }).then((ws) => {
    }).catch(err => {
      console.log(err);
    });
  }
  UpdateNow() {
    this.nowDate = this.formatLocalISO(new Date())
  }
  changeOnTimeRange(event: any) {
    const selectedValue = event.detail.value;
    if (selectedValue == 'current') {
      this.reload()
      this.GetSensorValue()
    } else if (selectedValue == 'custom') {
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
  reload() {
    this.widgetData.dateRange = "current"
    this.countStr = 0
    this.updateCounterDisplay(0)
    this.isPaused = false
    this.changeDetector.detectChanges()

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
  public updateCounterDisplay(count: number): void {
    this.countStr += count
    const countStr = this.countStr.toString().padStart(6, '0')
    const newDigits = countStr.split('');
    for (let i = 0; i < 6; i++) {
      if (this.displayDigits[i] !== newDigits[i]) {
        this.flipStates[i] =
          this.flipStates[i] === 'normal' ? 'flipped' : 'normal';
        this.displayDigits[i] = newDigits[i];

        setTimeout(() => {
          this.flipStates[i] = 'normal';
        }, 100);
      }
    }
  }
  formatLocalISO(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T` +
      `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
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
  localToISOString(localString: string): string {
    const localDate = new Date(localString);
    return localDate.toISOString();
  }
  deleteChart() {
    this.remove.emit(this.widgetData.id);
  }
  editChart() {
    this.copyWidgetData = JSON.parse(JSON.stringify(this.widgetData))
    this.api.GetRequestRender('machinesAndSensorsByOrganizations?organizations=' + this.widgetData.organization_id).then((response: any) => {
      //console.log(response);
      this.machines = response.items
      this.isModalOpen = true;
      this.changeDetector.detectChanges()
    })
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
  get widgetOnOffTextColor(): string {
    return this.isDarkColor(this.widgetData.sensors[0].maxColor) ? 'white' : 'black';
  }
  getSensorsForMachine(MachineId: number) {
    const machine: any = this.machines.find((m: any) => m.machine_id == MachineId);
    return machine ? machine.sensors : [];
  }

  onSensorChange(event: any) {
    const selectedValue = event.detail.value;
    const sensor = this.getSensorsForMachine(this.widgetData.sensors[0].machine_id).find((s: any) => s.sensor_id == selectedValue)
    this.copyWidgetData.sensors[0].sensor_name = sensor.sensor_name
  }
  onColorPickerOpen() {
    
  setTimeout(() => {
    const overlay = document.getElementById('ngx-colors-overlay');

    if (!overlay) return;

    const oldInput = overlay.querySelector('input');
    if (!oldInput) return;

    // Crea un nuevo ion-input
    const ionInput = document.createElement('ion-input');
    console.log(ionInput);
    
    ionInput.setAttribute('value', this.copyWidgetData.color || '#FFFFFF');
    ionInput.setAttribute('placeholder', '#FFFFFF');
    ionInput.setAttribute('style', 'font-size: 12px; letter-spacing: 1.5px; z-index: 999999; background: white');

    // Opcional: agregar evento para actualizar el color en tiempo real
    ionInput.addEventListener('ionInput', (event: any) => {
      this.copyWidgetData.color = event.target.value;
    });

    // Reemplaza el input original
    oldInput.replaceWith(ionInput);

    // Esperar a que ion-input se cargue y luego darle focus
    setTimeout(() => {
      (ionInput as any).setFocus?.(); // algunos ion-input necesitan esto
    }, 50);
  }, 150);
  }
}
