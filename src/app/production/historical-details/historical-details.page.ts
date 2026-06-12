import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonLabel, IonMenuButton, IonIcon, IonButton, IonRow, IonCol, IonGrid, IonList, IonItem,
  IonSelectOption, IonSelect, IonItemOption, IonItemOptions, IonItemSliding, IonItemGroup, IonDatetime, IonModal, IonDatetimeButton, IonPopover
} from '@ionic/angular/standalone';
import { ToggleMenu } from 'src/app/models/design';
import { ApiService } from 'src/app/services/api.service';
import { AlertsService } from 'src/app/services/alerts.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import { menuOutline, timeOutline, hammerOutline, hourglassOutline, pencilOutline, checkmarkOutline, trashOutline, addOutline, closeOutline, documentOutline, textOutline, mailOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { ActivatedRoute } from '@angular/router';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext'; // Necesario para el buscador
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis, ApexDataLabels, ApexTooltip, ApexStroke, NgApexchartsModule, ChartType, ChartComponent } from "ng-apexcharts";
import { MultiSelectModule } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { FloatLabel } from "primeng/floatlabel"


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
  selector: 'app-historical-details',
  templateUrl: './historical-details.page.html',
  styleUrls: ['./historical-details.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [NgApexchartsModule, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonLabel, IonMenuButton, IonIcon, IonButton, IonRow, TableModule, MultiSelectModule, Select,
    IonCol, IonGrid, IonList, IonItem, IonSelectOption, IonSelect, IonItemOption, IonItemOptions, IonItemSliding, IonItemGroup, IonDatetime, IonModal, IonDatetimeButton, InputTextModule, IonPopover, FloatLabel

  ]
})
export class HistoricalDetailsPage {
  sensorId: any;
  sensorName: string = '';
  devices: any[] = [];
  userData: any = {};
  organizationSelected: any;
  user: any = {};
  sensorDetails: any
  siblingSensors: any
  // Datos crudos del backend
  public machines: any[] = [];
  // Filtros seleccionados
  public selectedMachine: any = null;
  public selectedSensor: any = null;
  // Rango de fechas
  public startDate: string = new Date().toISOString();
  public endDate: string = new Date().toISOString();

  public selectedPeriod: string = 'today';
  // Datos del historial
  public historyData: any[] = [];

  // Define el tipo para evitar errores de compilación (si usas TypeScript estricto)
  public chartOptions: any = {
    series: [{ name: 'Sensor Data', data: [] }], // Se inicializa vacío
    chart: {
      type: 'area',
      stacked: false,
      height: 350,
      zoom: {
        type: 'x',
        enabled: true,
        autoScaleYaxis: true,
      },
      animations: { enabled: false },
      toolbar: { autoSelected: 'zoom' },
    },
    dataLabels: { enabled: false },
    markers: { size: 0 },
    title: { text: 'Historial de Sensor', align: 'left' },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.5,
        opacityTo: 0,
        stops: [0, 90, 100],
      },
    },
    yaxis: {
      labels: {
        show: true,
        minWidth: 40, // Asegura un ancho mínimo para que el texto sea visible
        formatter: (val: number) => (val)
      },
      title: {
        text: 'Valor',
        margin: 10 // Margen entre el título y las etiquetas
      }
    },
    xaxis: { type: 'datetime' },
    tooltip: {
      theme: 'dark',
      enabled: true,
      shared: false,
      x: {
        format: 'dd/MM HH:mm tt'
      },
      y: {
        formatter: (val: number) => (val)
      },
    },
  };
  constructor(
    private api: ApiService,
    public alerts: AlertsService,
    public permissions: PermissionsService,
    private route: ActivatedRoute,
    private changeDetector: ChangeDetectorRef
  ) {
    this.userData = JSON.parse(String(localStorage.getItem("userData") || '{}'));
    this.organizationSelected = localStorage.getItem("organizationSelected") ? JSON.parse(localStorage.getItem("organizationSelected")!) : this.userData.Company?.Organizations[0];
    this.user = this.userData;
    addIcons({ menuOutline, timeOutline, hammerOutline, hourglassOutline, pencilOutline, checkmarkOutline, trashOutline, addOutline, closeOutline, documentOutline, textOutline, mailOutline });
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    this.startDate = yesterday.toISOString(); // Fecha de ayer
    this.endDate = new Date().toISOString();  // Fecha actual
  }
  ionViewDidEnter() {
    this.loadInitialData();
  }
  loadSensorHistory() {
    const url = `sensorHistory?sensor_id=${this.sensorId}&start_date=${this.startDate}&end_date=${this.endDate}`;
    this.api.GetRequestRender(url).then((response: any) => {
      this.sensorDetails = response.sensor;
      this.siblingSensors = response.siblings; // Lista para mostrar en un select o menú
      this.historyData = response.history;
    });
  }
  async deleteData(item: any) {
    // 1. Aquí llamarías a tu API para borrar
    // await this.api.deleteRecord(item.sensor_data_id);

    // 2. Eliminar del array local para que desaparezca de la UI
    this.historyData = this.historyData.filter((d: any) => d.sensor_data_id !== item.sensor_data_id);

    // 3. Importante: Cierra los items deslizados
    const list = document.querySelector('ion-list');
    if (list) await list.closeSlidingItems();
  }

  // 1. Carga inicial
  async loadInitialData() {
    localStorage.setItem("organizationSelected", JSON.stringify(this.organizationSelected))
    const url = `machinesAndSensorsByOrganizations?organizations=${this.organizationSelected.OrganizationId}`;
    const res: any = await this.api.GetRequestRender(url);
    this.machines = res.items;

    if (this.machines.length > 0) {
      // Seleccionar la primera máquina
      this.selectedMachine = this.machines[0];

      // Seleccionar el primer sensor si existe
      if (this.selectedMachine.sensors && this.selectedMachine.sensors.length > 0) {
        this.selectedSensor = this.selectedMachine.sensors[0].sensor_id;

        // Cargar historial automáticamente tras la selección
        this.loadHistory();
      }
    }
  }

  // 2. Cuando cambia la máquina, reiniciamos la selección del sensor
  onMachineChange() {
    this.selectedSensor = null;
    this.historyData = [];
  }

  // 3. Cuando cambia el sensor o las fechas, llamamos al nuevo endpoint
  async loadHistory() {
    if (!this.selectedSensor) return;

    const url = `sensorsData?sensors=${this.selectedSensor}&start=${this.startDate}&end=${this.endDate}`;
    const res: any = await this.api.GetRequestRender(url);

    // 1. Procesamos los datos para la tabla y el gráfico
    const rawData = res.items[0]?.data || [];

    this.historyData = rawData.map((d: any) => ({
      sensor_data_id: d.id,
      date_time: d.time,
      value: d.value,
      comment: d.comment
    }));

    // 2. Actualizamos la serie del gráfico
    // Nota: Creamos un nuevo objeto para asegurar que ApexCharts detecte el cambio (inmutabilidad)
    this.chartOptions = {
      ...this.chartOptions,
      series: [{
        name: 'Valor',
        data: rawData.map((d: any) => ({
          x: new Date(d.time).getTime(),
          y: d.value
        }))
      }]
    };
  }
  exportTo(format: string) {
    /*this.api.GetRequestExport(format, this.selectedSensor, this.startDate, this.endDate)
      .subscribe((blob: Blob) => {
        // 1. Crear un enlace temporal en el DOM
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_${format.toUpperCase()}.xlsx`; // Nombre del archivo

        // 2. Simular clic y limpiar
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      });*/
  }
  async exportarExcel() {
    // 1. Preparamos los nombres y fechas
    // Usamos replace para quitar caracteres que no son válidos en nombres de archivo
    const sensorObj = this.selectedMachine.sensors.find((s: any) => s.sensor_id === this.selectedSensor);
    const sensorName = sensorObj ? sensorObj.sensor_name : 'Sensor';

    // 2. Limpieza para el nombre del archivo
    const safeSensor = sensorName.replace(/[^a-z0-9]/gi, '_');
    const safeDevice = this.selectedMachine.machine_id.toString().replace(/[^a-z0-9]/gi, '_');
    const dateRange = `${this.startDate}_al_${this.endDate}`.replace(/[^a-z0-9]/gi, '_');

    // Resultado: Reporte_MEDIO_PISO_122_2026_06_11_al_2026_06_12.xlsx
    const fileName = `Reporte_${safeSensor}_${safeDevice}_${dateRange}.xlsx`;

    const endpoint = `sensorsData/export?type=excel&sensor=${this.selectedSensor}&start=${this.startDate}&end=${this.endDate}`;
    const data = await this.api.GetRequestExport(endpoint);

    if (data) {
      let blob: Blob;

      if (typeof data === 'string') {
        const byteCharacters = atob(data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      } else {
        blob = data as Blob;
      }

      // 2. Usamos el nombre dinámico aquí
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName; // Aquí se aplica el nombre generado
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  }
  onPeriodChange() {
    const now = new Date();
    let start = new Date();

    switch (this.selectedPeriod) {
      case 'last_hour':
        start.setHours(now.getHours() - 1);
        break;
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        now.setDate(now.getDate() - 1);
        now.setHours(23, 59, 59);
        break;
      case 'last_week':
        start.setDate(now.getDate() - 7);
        break;
      case 'custom':
        // No hacemos nada, dejamos que el usuario elija
        return;
    }

    this.startDate = start.toISOString();
    this.endDate = now.toISOString();
    this.loadHistory();
  }
  // Función para manejar el cambio y cerrar
  onDateChange(type: 'start' | 'end', modal: IonModal) {
    // 1. Cierra el modal
    modal.dismiss();

    // 2. Recarga los datos
    this.loadHistory();
  }
  sendEmail() {
    // Lógica para preparar el reporte y enviarlo
  }
  protected readonly ToggleMenu = ToggleMenu;
}
