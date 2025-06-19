import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonCard, IonCardTitle, IonCardContent, IonButtons, IonIcon, IonToolbar, IonPopover, IonContent, IonList, IonItem, IonFab, IonFabButton, IonHeader, IonTitle, IonSelect, IonSelectOption, IonModal, IonInput } from '@ionic/angular/standalone';
import { NgxColorsModule } from 'ngx-colors';
import { GaugeData } from '../gauge/gauge.component';
import { addIcons } from 'ionicons';
import { ellipsisVertical, pencilOutline, trashOutline } from 'ionicons/icons';
import { ApiService } from 'src/app/services/api.service';
import { WebSocketService } from 'src/app/services/web-socket.service';
import { EndpointsService } from 'src/app/services/endpoints.service';
export interface OnOffData {
  [key: string]: any;
}

@Component({
  selector: 'app-onoff',
  templateUrl: './onoff.component.html',
  styleUrls: ['./onoff.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, NgxColorsModule, IonCard, IonCardTitle, IonCardContent, IonButtons, IonIcon, IonToolbar, IonPopover, IonContent, IonList, IonItem, IonFab, IonFabButton, IonHeader, IonTitle, IonSelect, IonSelectOption, IonModal, IonInput],
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
  @Input() data: GaugeData = {};
  @Output() remove = new EventEmitter<number>();
  constructor(
    private changeDetector: ChangeDetectorRef,
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

  private initializeConfig() {
    this.widgetData = this.data
    this.GetSensorValue()
  }
  GetSensorValue() {
    this.api.GetRequestRender(this.endPoints.Render('sensorData/' + this.widgetData.sensors[0].sensor_id + '?limit=1'), false).then((response: any) => {
      const lastValue = response.items.data[0].value
      this.lastDate = response.items.data[0].time
      this.isOn = Number(lastValue) < Number(this.widgetData.sensors[0].max) ? false : true
      //this.updateCurrentColor();
      this.startSubscriptions()
    })
  }
  startSubscriptions() {
    this.ws.Suscribe(this.widgetData.sensors[0].sensor_id, (response) => {
      const lastValue = response.data.value
      this.lastDate = response.data.time
      this.isOn = Number(lastValue) < Number(this.widgetData.sensors[0].max) ? false : true//false
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
    console.log(this.copyWidgetData.widgetType);
    this.api.GetRequestRender(this.endPoints.Render('machinesAndSensors/1')).then((response: any) => {
      console.log(response);
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
  getSensorsForMachine(MachineId: number) {
    const machine: any = this.machines.find((m: any) => m.machine_id == MachineId);
    return machine ? machine.sensors : [];
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
}
