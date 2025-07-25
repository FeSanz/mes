import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonCard, IonCardTitle, IonCardContent, IonButtons, IonIcon, IonToolbar, IonPopover, IonContent, IonList, IonItem, IonFab, IonFabButton, IonHeader,
  IonTitle, IonSelect, IonSelectOption, IonModal, IonInput, IonToggle
} from '@ionic/angular/standalone';
import { NgxColorsModule } from 'ngx-colors';
import { addIcons } from 'ionicons';
import { ellipsisVertical, pencilOutline, trashOutline, checkmark, moveOutline } from 'ionicons/icons';
import { ApiService } from 'src/app/services/api.service';
import { WebSocketService } from 'src/app/services/web-socket.service';
import { EndpointsService } from 'src/app/services/endpoints.service';
import { CdkDragHandle } from '@angular/cdk/drag-drop';

export interface OnOffData {
  [key: string]: any;
}

@Component({
  selector: 'app-onoff',
  templateUrl: './onoff.component.html',
  styleUrls: ['./onoff.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, NgxColorsModule, IonCard, IonCardTitle, IonCardContent, IonButtons, IonIcon, IonToolbar, IonPopover, IonContent, IonList, IonItem, IonFab, IonFabButton, IonHeader, IonTitle, IonSelect, IonSelectOption,
    IonModal, IonInput, CdkDragHandle, IonToggle],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class OnoffComponent implements OnInit {
  isOn = false
  widgetData: any = {}
  copyWidgetData: any = {}
  isModalOpen = false;
  lastDate: any = ""
  showChart: boolean = true;
  machines: any = []
  lastValue = 0
  @Input() data: OnOffData = {};
  @Output() remove = new EventEmitter<number>();
  constructor(
    private changeDetector: ChangeDetectorRef,
    private ws: WebSocketService,
    private api: ApiService) {
    addIcons({ moveOutline, ellipsisVertical, pencilOutline, trashOutline, checkmark });
  }

  ngOnInit() {
    this.initializeConfig();
  }

  private initializeConfig() {
    this.widgetData = this.data
    this.GetSensorValue()
  }
  GetSensorValue() {
    this.api.GetRequestRender('sensorData/' + this.widgetData.sensors[0].sensor_id, false).then((response: any) => {
      this.lastValue = response.items.data[0].value
      this.lastDate = response.items.data[0].time
      this.isOn = Number(this.lastValue) < Number(this.widgetData.sensors[0].max) ? false : true
      //this.updateCurrentColor();
      this.startSubscriptions()
    })
  }
  startSubscriptions() {
    this.ws.SuscribeById({ sensor_id: this.widgetData.sensors[0].sensor_id }, "sensor", (response) => {
      this.lastValue = response.data.value
      this.lastDate = response.data.time
      this.isOn = Number(this.lastValue) < Number(this.widgetData.sensors[0].max) ? false : true//false
      //this.updateCurrentColor();
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
  onSensorChange(event: any) {
    const selectedValue = event.detail.value;
    const sensor = this.getSensorsForMachine(this.widgetData.sensors[0].machine_id).find((s: any) => s.sensor_id == selectedValue)
    this.copyWidgetData.sensors[0].sensor_name = sensor.sensor_name
  }
  get borderColor(): string {
    return this.isOn ? this.widgetData.sensors[0].maxColor : 'var(--ion-color-light)'
  }
}
