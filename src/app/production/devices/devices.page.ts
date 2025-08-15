import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, HostListener, inject, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonFab, IonFabButton, IonButtons, IonButton, IonIcon, IonItemOption, IonItemOptions, IonItem, IonText, IonNote, IonCard, IonCardContent, IonPopover, IonList, IonModal, IonInput, IonCol, IonGrid, IonRow, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addCircleOutline, checkmarkOutline, copyOutline, documentOutline, flashOutline, hardwareChipOutline, speedometerOutline, sunnyOutline, thermometerOutline, trashOutline, waterOutline, ellipsisVertical, pencilOutline, helpOutline } from 'ionicons/icons';
import { ApiService } from 'src/app/services/api.service';
import { AlertsService } from 'src/app/services/alerts.service';
import { Clipboard } from '@capacitor/clipboard';
import { EndpointsService } from 'src/app/services/endpoints.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-devices',
  templateUrl: './devices.page.html',
  styleUrls: ['./devices.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, IonFab, IonFabButton, IonButtons, IonButton, IonIcon, IonItemOption, IonItemOptions, IonItem, IonText, IonNote, IonCard, IonCardContent, IonPopover, IonList, IonModal, IonInput, IonCol, IonGrid, IonRow, IonSelect, IonSelectOption],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DevicesPage implements OnInit {
  organizations: any = []
  isModalOpen = false;
  private activatedRoute = inject(ActivatedRoute);
  machine: any = {
    isNew: true,
    name: "",
    organization_id: "",
    sensors: []
  }
  iconList = [
    { name: 'thermometer-outline', label: 'Temperatura' },
    { name: 'water-outline', label: 'Humedad' },
    { name: 'speedometer-outline', label: 'Presión' },
    { name: 'sunny-outline', label: 'Luz' },
    { name: 'flash-outline', label: 'Energía' },
  ];
  user: any = {}
  constructor(
    private api: ApiService,
    private alerts: AlertsService,
    private endPoints: EndpointsService,
    public permissions: PermissionsService,
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
      checkmarkOutline,
      helpOutline
    })
    this.user = JSON.parse(String(localStorage.getItem("userData")))
  }

  ngOnInit() {
  }
  ionViewDidEnter() {
    this.getMachines()
  }
  getMachines() {
    const orgsIds = this.user.Company.Organizations.map((org: any) => org.OrganizationId).join(',');//IDs separados por coma (,)
    this.api.GetRequestRender('machinesAndSensorsByOrganizations?organizations=' + orgsIds).then((response: any) => {

      const orgMap = this.user.Company.Organizations.reduce((acc: any, org: any) => {
        acc[org.OrganizationId] = org.Name;
        return acc;
      }, {});

      this.organizations = Object.values(
        response.items.reduce((acc: any, machine: any) => {
          const orgId = parseInt(machine.organization_id); // aseguramos tipo número
          if (!acc[orgId]) {
            acc[orgId] = {
              organization_id: orgId,
              organization_name: orgMap[orgId] || `Org ${orgId}`,
              devices: []
            };
          }
          acc[orgId].devices.push(machine);
          return acc;
        }, {})
      ).sort((a: any, b: any) => a.organization_name.localeCompare(b.organization_name));

      //console.log(this.organizations);

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
      organization_id: this.user.Company.Organizations[0].OrganizationId,
      machine_code: "",
      token: this.generateToken(),
      sensors: []
    }
  }
  openAsEditMachine(machine: any) {
    this.isModalOpen = true
    this.machine = JSON.parse(JSON.stringify(machine))
    this.machine.isNew = false
    this.machine.organization_id = Number(this.machine.organization_id)
  }
  addNewMachine() {
    const machineBody = {
      organization_id: this.machine.organization_id,
      code: this.machine.machine_code,
      token: this.machine.token,
      name: this.machine.machine_name,
      work_center_id: 5,
      work_center: "Centro de Mecanizado",
      machine_class: "A1"
    };
    this.machine.sensors.forEach((sensor: any) => {
      sensor.created_by = this.user.UserId;
      sensor.updated_by = this.user.UserId;
    });
    this.api.PostRequestRender('machines', machineBody).then((response: any) => {
      const machineId = response.result.machine_id;
      if (this.machine.sensors.length > 0) {
        this.api.PostRequestRender('sensors/' + machineId, { "items": this.machine.sensors }).then((response: any) => {
          this.getMachines()
          this.isModalOpen = false;
        })
      } else {
        this.getMachines()
        this.isModalOpen = false;
      }
    })
  }
  updateMachine() {
    const machineBody = {
      machine_id: this.machine.machine_id,
      machine_name: this.machine.machine_name,
      sensors: this.machine.sensors.map((sensor: any) => {
        return {
          ...(sensor.sensor_id ? { sensor_id: sensor.sensor_id } : {}),
          "sensor_name": sensor.sensor_name,
          "sensor_icon": sensor.sensor_icon,
          "sensor_var": sensor.sensor_var,
        }
      })
    };
    this.api.PutRequestRender('machines/' + machineBody.machine_id, machineBody).then((response: any) => {
      //console.log(response);
      if (response.errorsExistFlag) {
        this.alerts.Info(response.message);
      } else {
        this.alerts.Success(response.message);
        this.getMachines()
        this.isModalOpen = false;
      }
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
    if (await this.alerts.ShowAlert("¿Deseas eliminar esta máquina?", "Alerta", "Atrás", "Eliminar")) {
      this.api.DeleteRequestRender('machines/' + (machine_id ? machine_id : this.machine.machine_id)).then((response: any) => {
        if (response.errorsExistFlag) {
          this.alerts.Info(response.message);
        } else {
          this.alerts.Success(response.message);
          this.getMachines()
          this.isModalOpen = false
          this.changeDetector.detectChanges()
        }
      })
    }
  }
  async removeSensor(sensor: any) {
    if (!sensor.sensor_id) {
      this.machine.sensors = this.machine.sensors.filter((se: any) => se !== sensor);
      this.changeDetector.detectChanges();
    } else
      if (await this.alerts.ShowAlert("¿Deseas eliminar este sensor?", "Alerta", "Atrás", "Eliminar")) {
        this.api.DeleteRequestRender('sensors' + sensor.sensor_id).then((response: any) => {
          //console.log(response);
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
