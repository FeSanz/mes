import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, HostListener, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonFab, IonFabButton, IonButtons, IonButton, IonIcon, IonItemOption, IonItemOptions, IonItem, IonText, IonNote, IonCard, IonCardContent, IonPopover, IonList, IonModal, IonInput } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addCircleOutline, checkmarkOutline, copyOutline, documentOutline, flashOutline, hardwareChipOutline, speedometerOutline, sunnyOutline, thermometerOutline, trashOutline, waterOutline, ellipsisVertical, pencilOutline} from 'ionicons/icons';
import { ApiService } from 'src/app/services/api.service';
import { AlertsService } from 'src/app/services/alerts.service';
import { Clipboard } from '@capacitor/clipboard';
import { EndpointsService } from 'src/app/services/endpoints.service';

@Component({
  selector: 'app-devices',
  templateUrl: './devices.page.html',
  styleUrls: ['./devices.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, IonFab, IonFabButton, IonButtons, IonButton, IonIcon, IonItemOption, IonItemOptions, IonItem, IonText, IonNote, IonCard, IonCardContent, IonPopover, IonList, IonModal, IonInput],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DevicesPage implements OnInit {
  machines: any = []
  isModalOpen = false;
  machine: any = {
    isNew: true,
    name: "",
    sensors: []
  }
  iconList = [
    { name: 'thermometer-outline', label: 'Temperatura' },
    { name: 'water-outline', label: 'Humedad' },
    { name: 'speedometer-outline', label: 'Presión' },
    { name: 'sunny-outline', label: 'Luz' },
    { name: 'flash-outline', label: 'Energía' },
  ];
  constructor(
    private api: ApiService,
    private alerts: AlertsService,
    private endPoints: EndpointsService,
    private changeDetector: ChangeDetectorRef) {
    addIcons({
      hardwareChipOutline,
      addCircleOutline,
      pencilOutline,
      documentOutline,
      copyOutline,
      ellipsisVertical,
      thermometerOutline,
      waterOutline,
      speedometerOutline,
      sunnyOutline,
      flashOutline,
      trashOutline,
      checkmarkOutline
    })
  }

  ngOnInit() {
  }
  ionViewDidEnter() {
    this.getMachines()
  }
  getMachines() {
    this.api.GetRequestRender(this.endPoints.Render('machinesAndSensors/1')).then((response: any) => {
      console.log(response);
      this.machines = response.items
      console.log(response.items);
    })
  }
  addNewSensor() {
    this.machine.sensors.push({
      sensor_icon: "thermometer-outline",
      sensor_var: "",
      sensor_name: ""
    })
    this.changeDetector.detectChanges()
  }
  generateToken(): string {
    let d = new Date().getTime();
    let d2 = (performance && performance.now && (performance.now() * 1000)) || 0; // alta precisión si disponible

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      let r = Math.random() * 16;

      if (d > 0) {
        r = (d + r) % 16 | 0;
        d = Math.floor(d / 16);
      } else {
        r = (d2 + r) % 16 | 0;
        d2 = Math.floor(d2 / 16);
      }

      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });

  }
  openAsNewMachine() {
    this.isModalOpen = true
    this.machine = {
      isNew: true,
      machine_name: "",
      machine_code: "",
      token: this.generateToken(),
      sensors: []
    }
  }
  openAsEditMachine(machine: any) {
    this.isModalOpen = true
    this.machine = JSON.parse(JSON.stringify(machine))
    this.machine.isNew = false
    console.log(this.machine);
  }
  addNewMachine() {
    const machineBody = {
      user_id: "1",
      organization_id: 300000003173662,
      code: this.machine.machine_code,
      token: this.machine.token,
      name: this.machine.machine_name,
      work_center_id: 5,
      work_center: "Centro de Mecanizado",
      machine_class: "A1"
    };
    this.machine.sensors.forEach((sensor: any) => {
      sensor.created_by = '1';
      sensor.updated_by = '1';
    });
    this.api.PostRequestRender(this.endPoints.Render('machines'), machineBody).then((response: any) => {
      const machineId = response.result.machine_id;
      this.api.PostRequestRender(this.endPoints.Render('sensors/') + machineId, { "items": this.machine.sensors }).then((response: any) => {
        console.log(response);
        this.getMachines()
        this.isModalOpen = false;
      })
    })
  }
  updateMachine() {
    const machineBody = {
      name: this.machine.machine_name
    };
    //console.log(this.machine.sensors);
    this.api.UpdateRequestRender(this.endPoints.Render('machines') + this.machine.machine_id, machineBody).then((response: any) => {
      const newSensorsPromises = this.machine.sensors
        .filter((sensor: any) => !sensor.id)
        .map((sensor: any) => {
          const sensorBody = {
            sensor_name: sensor.name,
            sensor_var: "temp",
            machine_id: this.machine.machine_id,
            icon: sensor.icon,
            created_by: 1,
            updated_by: 1
          };
          console.log(sensorBody);

          return /*this.api.PostRequestRender("/sensors", sensorBody);*///nuevos sensores
        });
      const updateSensorPromises = this.machine.sensors
        .filter((sensor: any) => sensor.id)
        .map((sensor: any) => {
          const sensorBody = {
            name: sensor.name,
            icon: sensor.icon,
          };
          return this.api.UpdateRequestRender(this.endPoints.Render('sensors') + sensor.id, sensorBody);//actualizar sensores existentes
        });
      Promise.all([...newSensorsPromises, ...updateSensorPromises]).then((sensorResponses: any[]) => {
        this.getMachines()
        this.isModalOpen = false;
      });
    })
  }

  selectIcon(sensor: any, icon: string) {
    sensor.sensor_icon = icon
  }

  async pasteOnInputName() {
    const { type, value } = await Clipboard.read();
    this.machine.machine_name = value
  }
  async copyFromInputName() {
    await Clipboard.write({
      string: this.machine.machine_name
    });
  }
  async pasteOnInputToken() {
    const { type, value } = await Clipboard.read();
    this.machine.machine_name = value
  }
  async copyFromInputToken() {
    await Clipboard.write({
      string: this.machine.token
    });
  }
  async deleteMachine(machine_id: number = 0) {
    console.log(this.machine);

    if (await this.alerts.ShowAlert("¿Deseas eliminar esta máquina?", "Alerta", "Atrás", "Eliminar")) {
      this.api.DeleteRequestRender(this.endPoints.Render('machines') + machine_id ? machine_id : this.machine.machine_id).then((response: any) => {
        //console.log(response.data);
        this.getMachines()
        this.isModalOpen = false
        this.changeDetector.detectChanges()
      })
    }
  }
  async removeSensor(sensor: any) {
    if (!sensor.sensor_id) {
      this.machine.sensors = this.machine.sensors.filter((se: any) => se !== sensor);
      this.changeDetector.detectChanges();
    } else
      if (await this.alerts.ShowAlert("¿Deseas eliminar este sensor?", "Alerta", "Atrás", "Eliminar")) {
        this.api.DeleteRequestRender(this.endPoints.Render('sensors') + sensor.sensor_id).then((response: any) => {
          console.log(response);
          this.machine.sensors = this.machine.sensors.filter((se: any) => se !== sensor);
          this.changeDetector.detectChanges()
        })
      }
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
    const color = "#42a7f0"
    return this.isDarkColor(color) ? 'white' : 'black';
  }
}
