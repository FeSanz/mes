import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonCard, IonCardTitle, IonCardContent, IonButtons, IonIcon, IonToolbar, IonPopover, IonContent, IonList, IonItem, IonFab, IonFabButton, IonHeader, IonTitle, IonSelect, IonSelectOption, IonModal, IonInput } from '@ionic/angular/standalone';
import { NgxColorsModule } from 'ngx-colors';
import { GaugeData } from '../gauge/gauge.component';
import { addIcons } from 'ionicons';
import { ellipsisVertical, pencilOutline, trashOutline, checkmark, moveOutline } from 'ionicons/icons';
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
    IonModal, IonInput, CdkDragHandle],
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
  @Input() data: CounterData = {};
  @Output() remove = new EventEmitter<number>();
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
    addIcons({ moveOutline, ellipsisVertical, pencilOutline, trashOutline, checkmark });
  }

  ngOnInit() {
    this.initializeConfig();

  }

  private initializeConfig() {
    this.widgetData = this.data
    //console.log(this.data);
    this.GetSensorValue()
  }
  GetSensorValue() {
    this.api.GetRequestRender('sensorData/' + this.widgetData.sensors[0].sensor_id, false).then((response: any) => {
      this.updateCounterDisplay(Math.round(response.items.data[0].value));
      this.lastDate = response.items.data[0].time
      this.startSubscriptions()
    })
  }
  updateChartDB() {
    //console.log(this.copyWidgetData);
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
  startSubscriptions() {
    this.ws.Suscribe(this.widgetData.sensors[0].sensor_id, (response) => {
      //console.log(response);      
      this.updateCounterDisplay(Math.round(response.data.value));
      this.lastDate = response.data.time
    }).then((ws) => {
    }).catch(err => {
      console.log(err);
    });
  }

  public updateCounterDisplay(count: number): void {
    const countStr = count.toString().padStart(6, '0');
    const newDigits = countStr.split('');

    if (true) {
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
    } else {
      this.displayDigits = newDigits;
    }
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
}
