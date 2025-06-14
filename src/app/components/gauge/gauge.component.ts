// src/app/components/gauge/humidity-gauge.component.ts
import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, EventEmitter, Output, ChangeDetectorRef, LOCALE_ID, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { WebSocketService } from 'src/app/services/web-socket.service';
import { EndpointsService } from 'src/app/services/endpoints.service';
import { ApiService } from 'src/app/services/api.service';
import { addIcons } from 'ionicons';
import { ellipsisVertical, pencilOutline, trashOutline } from 'ionicons/icons';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { NgxColorsModule } from 'ngx-colors';

export interface GaugeData {
  [key: string]: any;
}

@Component({
  selector: 'app-gauge',
  templateUrl: './gauge.component.html',
  styleUrls: ['./gauge.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, NgApexchartsModule, IonicModule, NgxColorsModule/*, IonText, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButtons, IonButton, IonIcon, IonToolbar, IonPopover, IonContent, IonList, IonItem, IonFab, IonFabButton, IonHeader, IonTitle, IonSelect, IonSelectOption, IonModal*/],
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
export class GaugeComponent implements OnInit {

  @Output() remove = new EventEmitter<number>();
  widgetData: any = {}
  private humiditySubject = new BehaviorSubject<number>(0);
  public currentValue$ = this.humiditySubject.asObservable();
  copyWidgetData: any = {}
  isModalOpen = false;
  lastDate: any = ""
  showChart: boolean = true;
  machines: any = []
  public currentColor = '#4A90E2';
  @Input() data: GaugeData = {};

  constructor(private changeDetector: ChangeDetectorRef,
    private ws: WebSocketService,
    private endPoints: EndpointsService,
    private api: ApiService) {
    addIcons({
      ellipsisVertical,
      pencilOutline,
      trashOutline
    })
  }
  ngOnInit() {
    this.initializeConfig();
  }
  GetSensorValue() {
    this.api.GetRequestRender(this.endPoints.Render('sensorData/' + this.widgetData.sensors[0].sensor_id + '?limit=1'), false).then((response: any) => {
      const lastValue = response.items.data[0].value
      this.lastDate = response.items.data[0].time
      this.humiditySubject.next(lastValue);
      this.updateCurrentColor();
      this.startSubscriptions()
    })
  }
  startSubscriptions() {
    this.ws.Suscribe(this.widgetData.sensors[0].sensor_id, (response) => {
      const lastValue = response.data.value
      this.lastDate = response.data.time
      this.humiditySubject.next(lastValue);
      this.updateCurrentColor();
    }).then((ws) => {
    }).catch(err => {
      console.log(err);
    });
  }
  deleteChart() {
    this.remove.emit(this.widgetData.id);
  }
  editChart() {

    this.copyWidgetData = JSON.parse(JSON.stringify(this.widgetData))
    console.log(this.copyWidgetData.widgetType);
    this.api.GetRequestRender(this.endPoints.Render('machinesAndSensors/1')).then((response: any) => {
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
    console.log(body);
    this.showChart = false;
    this.api.UpdateRequestRender(this.endPoints.Render('dashboards/') + this.widgetData.dashboard_id, body).then((response: any) => {
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
  private initializeConfig() {
    this.widgetData = this.data
    this.GetSensorValue()
  }
  // ✅ MÉTODO MEJORADO PARA ACTUALIZACIÓN DE COLOR
  private updateCurrentColor() {
    const current = this.humiditySubject.value;
    const percentage = (current - this.widgetData.sensors[0].min) /
      (this.widgetData.sensors[0].max - this.widgetData.sensors[0].min);

    const clampedPercentage = Math.max(0, Math.min(1, percentage));

    const newColor = this.interpolateColor(
      this.widgetData.sensors[0].minColor,
      this.widgetData.sensors[0].maxColor,
      clampedPercentage
    );

    if (this.currentColor !== newColor) {
      this.currentColor = newColor;
    }
  }

  // ✅ MÉTODO MEJORADO PARA INTERPOLACIÓN DE COLOR
  private interpolateColor(color1: string, color2: string, factor: number): string {
    factor = Math.max(0, Math.min(1, factor));

    if (!color1 || !color2) {
      console.warn('⚠️ Colores inválidos para interpolación');
      return '#4A90E2';
    }

    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) {
      console.warn('⚠️ Error al convertir colores a RGB');
      return '#4A90E2';
    }

    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);

    const clampedR = Math.max(0, Math.min(255, r));
    const clampedG = Math.max(0, Math.min(255, g));
    const clampedB = Math.max(0, Math.min(255, b));

    return `rgb(${clampedR}, ${clampedG}, ${clampedB})`;
  }

  // ✅ MÉTODO MEJORADO PARA CONVERSIÓN HEX A RGB
  private hexToRgb(hex: string): { r: number, g: number, b: number } | null {
    if (!hex) return null;

    const cleanHex = hex.replace('#', '');
    let fullHex = cleanHex;

    if (cleanHex.length === 3) {
      fullHex = cleanHex.split('').map(char => char + char).join('');
    }

    if (fullHex.length !== 6) {
      return null;
    }

    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // ✅ MÉTODO PARA VALORES DE ESCALA DINÁMICOS
  public getScaleValue(percentage: number): number {
    const min = this.widgetData.sensors[0].min;
    const max = this.widgetData.sensors[0].max;
    const range = max - min;
    const value = min + (range * percentage);
    return Math.round(value * 10) / 10;
  }

  public getProgressDashArray(humidity: number): string {
    const clampedHumidity = Math.max(
      this.widgetData.sensors[0].min,
      Math.min(this.widgetData.sensors[0].max, humidity)
    );

    const percentage = (clampedHumidity - this.widgetData.sensors[0].min) /
      (this.widgetData.sensors[0].max - this.widgetData.sensors[0].min);

    const clampedPercentage = Math.max(0, Math.min(1, percentage));

    const radius = 120;
    const totalArcLength = radius * Math.PI;

    const visibleLength = totalArcLength * clampedPercentage;
    const invisibleLength = totalArcLength * 2;

    return `${visibleLength.toFixed(2)} ${invisibleLength.toFixed(2)}`;
  }
}