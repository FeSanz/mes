import { Component, OnInit, Input, EventEmitter, Output, ChangeDetectorRef, LOCALE_ID, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { trigger, style, transition, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonText, IonCard, IonCardTitle, IonCardContent, IonButtons, IonButton, IonIcon, IonPopover, IonList, IonItem, IonFab, IonFabButton, IonSelect, IonSelectOption, IonModal, IonInput } from '@ionic/angular/standalone';
import { WebSocketService } from 'src/app/services/web-socket.service';
import { EndpointsService } from 'src/app/services/endpoints.service';
import { ApiService } from 'src/app/services/api.service';
import { ellipsisVertical, pencilOutline, trashOutline, checkmark, moveOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { FormsModule } from '@angular/forms';
import { NgxColorsModule } from 'ngx-colors';
import { CdkDragHandle } from '@angular/cdk/drag-drop';


export interface ThermoData {
  [key: string]: any;
}
@Component({
  selector: 'app-thermometer',
  templateUrl: './thermometer.component.html',
  styleUrls: ['./thermometer.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, NgxColorsModule, IonText, IonCard, IonCardTitle, IonCardContent, IonButtons, IonButton, IonIcon, IonToolbar, IonPopover, IonContent, IonList, IonItem, IonFab, IonFabButton, IonHeader, IonTitle, IonSelect,
    IonSelectOption, IonModal, IonInput, CdkDragHandle],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    { provide: LOCALE_ID, useValue: 'en-US' }
  ]
})
export class ThermometerComponent implements OnInit {
  widgetData: any = {}
  @Output() remove = new EventEmitter<number>();
  private temperatureSubject = new BehaviorSubject<number>(0);
  public temperature$ = this.temperatureSubject.asObservable();
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
    addIcons({ ellipsisVertical, pencilOutline, trashOutline, checkmark, moveOutline });
  }

  ngOnInit() {
    this.initializeConfig();
  }

  deleteChart() {
    this.remove.emit(this.widgetData.id);
  }
  editChart() {
    this.copyWidgetData = JSON.parse(JSON.stringify(this.widgetData))
    //console.log(this.copyWidgetData.widgetType);
    this.api.GetRequestRender(this.endPoints.Render('machinesAndSensorsByOrganizations?organizations=' + this.widgetData.organization_id)).then((response: any) => {
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

  GetSensorValue() {
    this.api.GetRequestRender(this.endPoints.Render('sensorData/' + this.widgetData.sensors[0].sensor_id), false).then((response: any) => {
      const lastValue = response.items.data[0].value
      this.lastDate = response.items.data[0].time
      //this.temperatureSubject.next(lastValue);
      this.updateTemperature(lastValue);
      this.startSubscriptions()
    })
  }
  startSubscriptions() {
    this.ws.Suscribe(this.widgetData.sensors[0].sensor_id, (response) => {
      const lastValue = response.data.value
      this.lastDate = response.data.time
      this.updateTemperature(lastValue);
    }).then((ws) => {
    }).catch(err => {
      console.log(err);
    });
  }

  public updateTemperature(temperature: number) {
    const minValue = this.widgetData.sensors[0].min;
    const maxValue = this.widgetData.sensors[0].max;
    const clampedTemp = Math.max(minValue, Math.min(maxValue, temperature));

    this.temperatureSubject.next(clampedTemp);
  }


  public setTemperature(event: any) {
    const value = typeof event === 'number' ? event : event.detail.value;
    this.updateTemperature(value);
  }

  public setRandomTemperature() {
    const minValue = this.widgetData.sensors[0].min;
    const maxValue = this.widgetData.sensors[0].max;
    const randomTemp = Math.random() * (maxValue - minValue) + minValue;
    this.updateTemperature(randomTemp);
  }

  // ✅ MÉTODO MEJORADO PARA VALORES DE ESCALA DINÁMICOS
  public getPercentageFromValue(percent: number): number {
    const min = Number(this.widgetData.sensors[0].min);
    const max = Number(this.widgetData.sensors[0].max);
    const range = max - min;

    const decimal = Math.max(0, Math.min(1, percent / 100)); // 60 => 0.6
    const value = min + range * decimal;

    // Redondear con lógica basada en el rango
    if (range > 1000) {
      return Math.round(value);
    } else if (range > 100) {
      return Math.round(value * 10) / 10;
    } else {
      return Math.round(value * 100) / 100;
    }
  }

  // ✅ MÉTODO PARA CALCULAR LA POSICIÓN DE LA MARCA DE CERO
  public getZeroPosition(): number | null {
    const minValue = this.widgetData.sensors[0].min;
    const maxValue = this.widgetData.sensors[0].max;

    // Solo mostrar la marca de cero si está dentro del rango
    if (0 < minValue || 0 > maxValue) {
      return null; // Cero está fuera del rango, no mostrar
    }

    // Calcular la posición Y del cero
    const percentage = (0 - minValue) / (maxValue - minValue);
    const clampedPercentage = Math.max(0, Math.min(1, percentage));

    const topY = 50;
    const bottomY = 330;
    const zeroY = bottomY - (clampedPercentage * (bottomY - topY));

    return Math.max(topY, Math.min(bottomY, zeroY));
  }

  // ✅ VERIFICAR SI CERO COINCIDE CON MIN O MAX EXACTAMENTE
  public isZeroAtPosition(percentage: number): boolean {
    const minValue = this.widgetData.sensors[0].min;
    const maxValue = this.widgetData.sensors[0].max;

    // Verificar si cero es exactamente el min o max
    if (percentage === 0.0 && minValue === 0) return true;
    if (percentage === 1.0 && maxValue === 0) return true;

    return false;
  }

  // ✅ DETERMINAR SI MOSTRAR LA MARCA DE CERO (SIEMPRE EXCEPTO SI MIN O MAX ES 0)
  public shouldShowZeroMark(): boolean {
    const minValue = this.widgetData.sensors[0].min;
    const maxValue = this.widgetData.sensors[0].max;

    // Si cero está fuera del rango, no mostrar
    if (0 < minValue || 0 > maxValue) {
      return false;
    }

    // Si cero es exactamente el mínimo o máximo, no mostrar marca separada
    if (minValue === 0 || maxValue === 0) {
      return false;
    }

    return true; // Mostrar marca de cero independiente SIEMPRE si está en rango
  }
  public getInterpolatedColor(): string {
    const value = this.temperatureSubject.value
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

  public getIndicatorPosition(temperature: number): number {
    const minValue = this.widgetData.sensors[0].min;
    const maxValue = this.widgetData.sensors[0].max;
    const percentage = (temperature - minValue) / (maxValue - minValue);
    const clampedPercentage = Math.max(0, Math.min(1, percentage));

    const topY = 50;
    const bottomY = 330;
    const indicatorY = bottomY - (clampedPercentage * (bottomY - topY));

    return Math.max(topY, Math.min(bottomY, indicatorY));
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
  onSensorChange(event: any) {
    const selectedValue = event.detail.value;
    const sensor = this.getSensorsForMachine(this.copyWidgetData.sensors[0].machine_id).find((s: any) => s.sensor_id == selectedValue)
    this.copyWidgetData.sensors[0].sensor_name = sensor.sensor_name
  }
}