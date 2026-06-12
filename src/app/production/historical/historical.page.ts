import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonLabel, IonMenuButton, IonIcon, IonButton, IonRow, IonCol, IonGrid, IonList, IonItem, IonSelectOption, IonSelect } from '@ionic/angular/standalone';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis, ApexDataLabels, ApexTooltip, ApexStroke, NgApexchartsModule, ChartType, ChartComponent } from "ng-apexcharts";
import { AlertsService } from 'src/app/services/alerts.service';
import { ApiService } from 'src/app/services/api.service';
import { WebSocketService } from 'src/app/services/web-socket.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import { addIcons } from 'ionicons';
import { menuOutline, timeOutline, hammerOutline, hourglassOutline, pencilOutline, checkmarkOutline, trashOutline, addOutline, closeOutline } from 'ionicons/icons';
import { ToggleMenu } from 'src/app/models/design';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { FloatLabel } from "primeng/floatlabel"
import { NavController } from '@ionic/angular';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  legend: ApexLegend,
  annotations: ApexAnnotations; // <--- Agrégala aquí
};

@Component({
  selector: 'app-historical',
  templateUrl: './historical.page.html',
  styleUrls: ['./historical.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [NgApexchartsModule, CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonLabel, IonIcon, IonButton, IonRow, IonCol, IonGrid, IonList, IonItem, IonMenuButton, IonSelectOption, IonSelect,
    TableModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule, TagModule, DropdownModule,
    MultiSelectModule, Select, FloatLabel]
})
export class HistoricalPage {
  devices: any[] = [];
  userData: any = {};
  organizationSelected: any;
  user: any = {};

  // Configuración única y estática para todas las gráficas (Sparklines)
  public sparklineOptions: any = {
    chart: {
      type: 'line',
      height: 60,
      sparkline: { enabled: true }, // Mantiene la gráfica pequeña
      animations: { enabled: false },
      toolbar: { show: false }
    },
    stroke: { width: 2, curve: 'straight' },
    fill: { opacity: 0.5, type: 'solid' },

    tooltip: {
      enabled: true,
      shared: false, // Cambia esto a false para evitar que muestre todos los puntos a la vez
      intersect: true, // El tooltip solo aparecerá si pasas el ratón directamente sobre el punto
      x: {
        format: 'dd/MM HH:mm'
      }
    },
    markers: {
      size: 4, // Un tamaño pequeño ayuda a hacer clic más preciso
      hover: {
        size: 6 // Crece un poco al pasar el ratón para confirmar selección
      }
    },
    noData: { text: 'Sin datos' }
  };
  filteredDevices: any[] = [];   // Lo que realmente se muestra en pantalla
  selectedMachineIds: any[] = []; // IDs seleccionados en el UI
  constructor(
    private api: ApiService,
    public alerts: AlertsService,
    private websocket: WebSocketService,
    public permissions: PermissionsService,
    private navCtrl: NavController,
    private changeDetector: ChangeDetectorRef
  ) {
    this.userData = JSON.parse(String(localStorage.getItem("userData") || '{}'));
    this.organizationSelected = localStorage.getItem("organizationSelected") ? JSON.parse(localStorage.getItem("organizationSelected")!) : this.userData.Company?.Organizations[0];
    this.user = this.userData;
    addIcons({ menuOutline, timeOutline, hammerOutline, hourglassOutline, pencilOutline, checkmarkOutline, trashOutline, addOutline, closeOutline });
  }

  ionViewDidEnter() {
    this.GetDevices();
  }
  GetDevices() {
    const end = new Date().toISOString();
    const start = '05/06/2026'//new Date(Date.now() - 3600000).toISOString();
    //const url = `machinesAndSensorsLastValues?organization_id=${this.organizationSelected.OrganizationId}&start_date=${start}&end_date=${end}`;
    const limitValue = 15
    const url = `machinesAndSensorsLastValues?organization_id=${this.organizationSelected.OrganizationId}&limit=${limitValue}`;;

    this.api.GetRequestRender(url).then((response: any) => {
      this.devices = response.items || [];

      // Lógica para seleccionar el primero automáticamente
      if (this.devices.length > 0) {
        // Tomamos el ID del primer dispositivo
        this.selectedMachineIds = [this.devices[0].machine_id];
      } else {
        this.selectedMachineIds = [];
      }
      this.applyFilter(); // Inicialmente mostramos todo
      // Detectar cambios después de recibir datos
      this.changeDetector.detectChanges();
    });
  }
  // Función necesaria para transformar tus datos al formato que espera apx-chart
  getChartData(values: any[]): { x: any, y: number }[] {
    return values ? values.map(v => ({
      x: v.date,   // Asegúrate de que tu JSON tenga 'date' o el nombre que venga de la BD
      y: v.value
    })) : [];
  }

  onSensorClick(sensor: any) {
    // Navega a la ruta y pasa el ID como parámetro
    this.navCtrl.navigateForward('/historical-details', {
      queryParams: {
        sensor_id: sensor.sensor_id,
        sensor_name: sensor.sensor_name // También puedes pasar el nombre para el título
      }
    });
  }
  applyFilter() {
    if (this.selectedMachineIds.length === 0) {
      this.filteredDevices = this.devices; // Si no hay nada seleccionado, mostrar todos
    } else {
      this.filteredDevices = this.devices.filter(m =>
        this.selectedMachineIds.includes(m.machine_id)
      );
    }
  }
  protected readonly ToggleMenu = ToggleMenu;
}