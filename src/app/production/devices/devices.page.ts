import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, HostListener, inject, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonFab, IonFabButton, IonButtons, IonButton, IonIcon, IonItem, IonText, IonNote, IonCard, IonItemOption, IonItemOptions, IonItemSliding, IonToggle,
  RefresherCustomEvent, IonRefresher, IonRefresherContent, IonMenuButton, IonCardContent, IonPopover, IonList, IonModal, IonInput, IonCol, IonGrid, IonRow, IonSelect, IonSelectOption, IonChip, PopoverController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addCircleOutline, checkmarkOutline, copyOutline, documentOutline, flashOutline, hardwareChipOutline, speedometerOutline, sunnyOutline, thermometerOutline, trashOutline, waterOutline, ellipsisVertical, pencilOutline, helpOutline, menu, menuOutline, addOutline, closeCircleOutline, openOutline } from 'ionicons/icons';
import { ApiService } from 'src/app/services/api.service';
import { AlertsService } from 'src/app/services/alerts.service';
import { Clipboard } from '@capacitor/clipboard';
import { EndpointsService } from 'src/app/services/endpoints.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import { ActivatedRoute } from '@angular/router';
import { ToggleMenu } from 'src/app/models/design';
import { CustomTooltipDirective } from 'app-tooltip.directive';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

interface Block {
  id: string;
  type: 'variable' | 'operator' | 'function' | 'number';
  value: string;
}

@Component({
  selector: 'app-devices',
  templateUrl: './devices.page.html',
  styleUrls: ['./devices.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, IonFab, IonFabButton, IonButtons, IonButton, IonIcon, IonItemOption, IonItemOptions, IonItem, IonItemSliding, IonToggle, CustomTooltipDirective, IonChip, DragDropModule,
    IonRefresher, IonRefresherContent, IonText, IonNote, IonCard, IonMenuButton, IonCardContent, IonPopover, IonList, IonModal, IonInput, IonCol, IonGrid, IonRow, IonSelect, IonSelectOption],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
    private popoverCtrl: PopoverController,
    public permissions: PermissionsService,
    private changeDetector: ChangeDetectorRef) {
    addIcons({ openOutline, closeCircleOutline, menuOutline, hardwareChipOutline, ellipsisVertical, addCircleOutline, pencilOutline, trashOutline, copyOutline, addOutline, checkmarkOutline, documentOutline, thermometerOutline, waterOutline, speedometerOutline, sunnyOutline, flashOutline, helpOutline });
    this.user = JSON.parse(String(localStorage.getItem("userData")))
  }

  handleRefresh(event: RefresherCustomEvent) {
    setTimeout(() => {
      this.user = JSON.parse(String(localStorage.getItem("userData")))
      this.ionViewDidEnter()
      event.target.complete();
    }, 10);
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
    })
  }
  convertirFormulaABloques(formula: string): any[] {
    if (!formula) return [];

    // Dividimos la fórmula manteniendo los operadores y espacios
    const tokens = formula.split(/(\+|\-|\*|\/|\(|\)|\s+)/).filter(t => t.trim() !== '');

    return tokens.map(token => {
      let type: 'variable' | 'operator' | 'function' | 'number' = 'number';

      if (['+', '-', '*', '/'].includes(token)) type = 'operator';
      else if (token.includes('X') || token.toLowerCase().includes('var')) type = 'variable';
      else if (token.includes('(')) type = 'function';

      return {
        id: Date.now().toString() + Math.random(), // ID único
        type: type,
        value: token
      };
    });
  }
  addNewSensor() {
    this.machine.sensors.push({
      sensor_icon: "thermometer-outline",
      sensor_var: "",
      sensor_name: "",
      formula: "",
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
    this.isModalOpen = true;
    this.machine = JSON.parse(JSON.stringify(machine));

    // AQUÍ ESTÁ LA MAGIA: Convertimos la fórmula de cada sensor en bloques
    if (this.machine.sensors) {
      this.machine.sensors.forEach((sensor: any) => {
        // Si ya tiene bloques, déjalos; si no, genéralos desde la fórmula
        if (!sensor.blocks) {
          sensor.blocks = this.convertirFormulaABloques(sensor.formula);
        }
      });
    }

    this.machine.isNew = false;
    this.machine.organization_id = Number(this.machine.organization_id);
  }
  addNewMachine() {
    const machineBody = {
      organization_id: this.machine.organization_id,
      code: this.machine.machine_code,
      token: this.machine.token,
      name: this.machine.machine_name,
      is_active: 'Y',
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
      machine_code: this.machine.machine_code,
      is_active: this.machine.is_active,
      sensors: this.machine.sensors.map((sensor: any) => {
        return {
          ...(sensor.sensor_id ? { sensor_id: sensor.sensor_id } : {}),
          "sensor_name": sensor.sensor_name,
          "sensor_icon": sensor.sensor_icon,
          "sensor_var": sensor.sensor_var,
          "formula": sensor.blocks.map((block: any) => block.value).join(' '),
        }
      })
    };
    this.api.PutRequestRender('machines/' + machineBody.machine_id, machineBody).then((response: any) => {
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
        this.api.DeleteRequestRender('sensors/' + sensor.sensor_id).then((response: any) => {
          //console.log(response);
          this.machine.sensors = this.machine.sensors.filter((se: any) => se !== sensor);
          this.getMachines()
          this.changeDetector.detectChanges()
        })
      }
  }
  DeactiveDev(event: any, machine: any) {
    const isChecked = event.detail.checked;
    machine.is_active = isChecked ? 'Y' : 'N'
    this.api.PutRequestRender('updateMachineStatus/' + machine.machine_id, { is_active: isChecked ? 'Y' : 'N' }).then((response: any) => {
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
  // Ya no necesitas @ViewChildren porque no estamos usando el cursor del input oculto
  // solo manipulamos el array de tokens del sensor.

  insertarEnFormula(valor: string, sensor: any) {
    // 1. Aseguramos que el array exista
    if (!sensor.blocks) {
      sensor.blocks = [];
    }

    // 2. Definimos el tipo de bloque según el valor
    let tipo: 'variable' | 'operator' | 'function' | 'number' = 'number';
    if (['+', '-', '*', '/'].includes(valor.trim())) tipo = 'operator';
    else if (valor.includes('var_value')) tipo = 'variable';
    else if (valor.includes('(')) tipo = 'function';

    // 3. Empujamos el objeto al array, NO un string
    sensor.blocks.push({
      id: Date.now().toString(),
      type: tipo,
      value: valor
    });
  }

  getTokens(formula: string): string[] {
    if (!formula) return [];
    // Expresión regular que separa operadores, paréntesis y funciones
    return formula.split(/(\+|\-|\*|\/|\(|\)|\,|\s+)/).filter(t => t.trim() !== '');
  }

  removerToken(sensor: any, tokenIndex: number) {
    const tokens = this.getTokens(sensor.formula);
    tokens.splice(tokenIndex, 1);
    sensor.formula = tokens.join(' ');
  }

  borrarUltimo(sensor: any) {
    const tokens = this.getTokens(sensor.formula);
    tokens.pop();
    sensor.formula = tokens.join(' ');
  }

  detectarCambio(event: any, sensor: any) {
    const input = event.target as HTMLInputElement;
    const valor = input.value.trim();

    // Si el usuario escribe un operador simple, lo insertamos
    if (['+', '-', '*', '/'].includes(valor)) {
      this.insertarEnFormula(valor, sensor);
      input.value = ''; // Limpiar el input para el siguiente token
    }
  }
  drop(event: CdkDragDrop<any[]>, sensor: any) {
    moveItemInArray(sensor.blocks, event.previousIndex, event.currentIndex);
  }

  // Para insertar bloques desde los botones superiores
  insertarBloque(type: 'variable' | 'operator' | 'function' | 'number', value: string, sensor: any) {
    if (!sensor.blocks) sensor.blocks = [];
    sensor.blocks.push({
      id: Date.now().toString(),
      type: type,
      value: value
    });
  }
  insertarNumero(input: any, sensor: any) {
    const val = input.value;
    if (val) {
      this.insertarBloque('number', val, sensor);
      input.value = ''; // Limpiar
    }
  }
  removerBloque(sensor: any, index: number) {
    sensor.blocks.splice(index, 1);
  }
  getBlockColor(type: string): string {
    const colors: any = {
      'variable': 'warning',
      'operator': 'secondary',
      'function': 'tertiary',
      'number': 'danger'
    };
    return colors[type] || 'medium';
  }
  // Función para "desarmar" el bloque MAP y editarlo
  guardarCambiosMap(bloque: any, inMin: string, inMax: string, outMin: string, outMax: string) {
    bloque.value = `map(X, ${inMin}, ${inMax}, ${outMin}, ${outMax})`;
  }
  @ViewChild('popoverMap') popover!: IonPopover;
  mapData = { inMin: 0, inMax: 1023, outMin: 0, outMax: 100 };
  // Variable para controlar qué bloque estamos editando
  editingBlock: any = null;

  editarMap(sensor: any, index: number, event: any) {
    this.editingBlock = sensor.blocks[index];

    // Extraer valores actuales usando regex
    const match = this.editingBlock.value.match(/map\(X, (\d+), (\d+), (\d+), (\d+)\)/);
    if (match) {
      this.mapData = { inMin: match[1], inMax: match[2], outMin: match[3], outMax: match[4] };
    }

    // Pasamos el evento del click para que el popover sepa dónde aparecer
    this.popover.present(event);
  }


  // Esta función es opcional, la dejamos vacía si no necesitas limpiar nada al cerrar
  onPopoverDismiss(event: any) {
    //console.log('Popover cerrado', event);
  }
  @ViewChild('popoverNumber') popoverNumber!: IonPopover;
  @ViewChild('popoverMap') popoverMap!: IonPopover;

  valorTemporal: number = 0;

  // Método central para abrir el editor correcto
  manejarClick(sensor: any, index: number, event: any) {
    const block = sensor.blocks[index];
    this.editingBlock = block;

    if (block.type === 'number') {
      this.valorTemporal = parseInt(block.value);
      this.popoverNumber.present(event);
    } else if (block.value.includes('map')) {
      // Aquí inicializas tu mapData (inMin, etc.) como hicimos antes
      this.popoverMap.present(event);
    }
  }

  // Lógica de guardado separada
  guardarNumero() {
    if (this.editingBlock) {
      this.editingBlock.value = this.valorTemporal.toString();
    }
    this.popoverNumber.dismiss();
  }

  guardarMapa() {
    // Aquí tu lógica anterior para el MAP
    this.editingBlock.value = `map(X, ${this.mapData.inMin}, ${this.mapData.inMax}, ${this.mapData.outMin}, ${this.mapData.outMax})`;
    this.popoverMap.dismiss();
  }
  protected readonly ToggleMenu = ToggleMenu;
}
