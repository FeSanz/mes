import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges, CUSTOM_ELEMENTS_SCHEMA, LOCALE_ID, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonText, IonCard, IonCardTitle, IonCardContent, IonButtons, IonButton, IonIcon, IonPopover, IonList, IonItem, IonFab, IonFabButton, IonSelect, IonSelectOption, IonModal, IonInput } from '@ionic/angular/standalone';
import { NgxColorsModule } from 'ngx-colors';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebSocketService } from 'src/app/services/web-socket.service';
import { EndpointsService } from 'src/app/services/endpoints.service';
import { ApiService } from 'src/app/services/api.service';
import { checkmark, ellipsisVertical, moveOutline, pencilOutline, trashOutline, handLeftOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

export interface ThermoData {
  [key: string]: any;
}
@Component({
  selector: 'app-watertank',
  templateUrl: './watertank.component.html',
  styleUrls: ['./watertank.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, NgxColorsModule, IonText, IonCard, IonCardTitle, IonCardContent, IonButtons, IonButton, IonIcon, IonToolbar, IonPopover, IonContent, IonList, IonItem, IonFab, IonFabButton, IonHeader, IonTitle, IonSelect,
    IonSelectOption, IonModal, IonInput, CdkDragHandle],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    { provide: LOCALE_ID, useValue: 'en-US' }
  ],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ height: '0px', opacity: 0, overflow: 'hidden' }),
        animate('300ms ease-in-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in-out', style({ height: '0px', opacity: 0, overflow: 'hidden' }))
      ])
    ])
  ]
})
export class WaterTankComponent implements OnInit {

  public waterLevelSubject = new BehaviorSubject<number>(750);
  public waterLevel$ = this.waterLevelSubject.asObservable();

  private simulationSubscription?: Subscription;
  public isSimulationActive = false;

  public showConfigPanel = false;

  widgetData: any = {}
  thresholds = {
    critical: 10,
    low: 25,
    medium: 50,
    high: 75
  }
  @Output() remove = new EventEmitter<number>();
  copyWidgetData: any = {}
  isModalOpen = false;
  lastDate: any = ""
  showChart: boolean = true;
  machines: any = []
  @Input() data: ThermoData = {};
  constructor(private changeDetector: ChangeDetectorRef,
    private ws: WebSocketService,
    private endPoints: EndpointsService,
    private api: ApiService) {
    addIcons({ moveOutline, ellipsisVertical, handLeftOutline, pencilOutline, trashOutline, checkmark });
  }
  ngOnInit() {
    this.initializeConfig();
    this.initializeWaterLevel();
  }

  public getInterpolatedColor(): string {
    const value = this.waterLevelSubject.value
    const min = this.widgetData.sensors[0].min
    const max = this.widgetData.sensors[0].max
    const colorStart = this.widgetData.sensors[0].minColor
    const colorEnd = this.widgetData.sensors[0].maxColor
    const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);
    const percent = clamp((value - min) / (max - min), 0, 1);

    const hexToRgb = (hex: string) => {
      const bigint = parseInt(hex.replace('#', ''), 16);
      return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
      };
    };

    const rgbToHex = (r: number, g: number, b: number) => {
      return (
        '#' +
        [r, g, b]
          .map((x) => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
          })
          .join('')
      );
    };

    const start = hexToRgb(colorStart);
    const end = hexToRgb(colorEnd);

    const r = Math.round(start.r + percent * (end.r - start.r));
    const g = Math.round(start.g + percent * (end.g - start.g));
    const b = Math.round(start.b + percent * (end.b - start.b));

    return rgbToHex(r, g, b);
  }
  public formatValue(value: number): string {
    return value.toFixed(1);
  }

  public getCurrentPercentage(): number {
    const current = this.waterLevelSubject.value;
    return Math.round((current / this.widgetData.sensors[0].max) * 100);
  }

  public getWaterY(): number {
    const percentage = this.getCurrentPercentage();
    const tankHeight = 240;
    const tankTop = 45;

    const waterFromBottom = (percentage / 100) * tankHeight;
    let waterY = tankTop + tankHeight - waterFromBottom;

    return Math.max(tankTop, Math.min(tankTop + tankHeight, waterY));
  }

  public getWaterHeight(): number {
    const percentage = this.getCurrentPercentage();
    const tankHeight = 240;

    let height = (percentage / 100) * tankHeight;
    return Math.max(0, Math.min(tankHeight, height));
  }

  public getLevelY(level: 'critical' | 'low' | 'medium' | 'high'): number {
    const percentage = this.thresholds[level];
    const tankHeight = 240;
    const tankTop = 45;

    const levelFromBottom = (percentage / 100) * tankHeight;
    const levelY = tankTop + tankHeight - levelFromBottom;

    return Math.max(tankTop, Math.min(tankTop + tankHeight, levelY));
  }
  private initializeConfig() {
    this.widgetData = this.data
    //console.log(this.widgetData);
    this.GetSensorValue()
  }
  GetSensorValue() {
    this.api.GetRequestRender('sensorData/' + this.widgetData.sensors[0].sensor_id, false).then((response: any) => {
      const lastValue = response.items.data[0].value
      this.lastDate = response.items.data[0].time
      //this.temperatureSubject.next(lastValue);
      this.updateWaterLevel(lastValue);
      this.startSubscriptions()
    })
  }
  startSubscriptions() {
    this.ws.SuscribeById({sensor_id : this.widgetData.sensors[0].sensor_id}, "sensor",  (response) => {
      const lastValue = response.data.value
      this.lastDate = response.data.time
      this.updateWaterLevel(lastValue);
    }).then((ws) => {
    }).catch(err => {
      console.log(err);
    });
  }
  private initializeWaterLevel() {
    const initialValue = Math.max(0, Math.min(this.widgetData.sensors[0].max, 0));
    this.waterLevelSubject.next(initialValue);
  }
  private updateWaterLevel(level: number) {
    const clampedLevel = Math.max(0, Math.min(this.widgetData.sensors[0].max, level));
    const roundedLevel = Math.round(clampedLevel * Math.pow(10, 1)) / Math.pow(10, 1);
    this.waterLevelSubject.next(roundedLevel);
  }
  deleteChart() {
    this.remove.emit(this.widgetData.id);
  }
  editChart() {
    this.copyWidgetData = JSON.parse(JSON.stringify(this.widgetData))
    //console.log(this.copyWidgetData.widgetType);
    this.api.GetRequestRender('machinesAndSensorsByOrganizations?organizations=' + this.widgetData.organization_id).then((response: any) => {
      this.machines = response.items
      this.isModalOpen = true;
    })
  }
  updateChartDB() {
    const body = {
      name: this.copyWidgetData.name,
      user_id: 1,
      color: this.copyWidgetData.color,
      updated_by: 1,
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
  getSensorsForMachine(MachineId: number) {
    const machine: any = this.machines.find((m: any) => m.machine_id == MachineId);
    return machine ? machine.sensors : [];
  }
  isDarkColor(hexColor: string | null | undefined): boolean {
    if (!hexColor || typeof hexColor !== 'string') {
      return false;
    }
    const hex = hexColor.replace('#', '');
    if (hex.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(hex)) {
      return false;
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma < 128;
  }
  get widgetTextColor(): string {
    return this.isDarkColor(this.widgetData.color) ? 'white' : 'black';
  }
  get widgetTextColorLevel(): string {
    return this.isDarkColor(this.getInterpolatedColor()) ? 'white' : 'black';
  }
  onSensorChange(event: any) {
    const selectedValue = event.detail.value;
    const sensor = this.getSensorsForMachine(this.copyWidgetData.sensors[0].machine_id).find((s: any) => s.sensor_id == selectedValue)
    this.copyWidgetData.sensors[0].sensor_name = sensor.sensor_name
  }
}