import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonLabel, IonMenuButton, IonIcon, IonButton, IonRow, IonCol, IonGrid, IonList, IonItem, IonCard, IonCardContent, IonCardHeader,
  IonSelectOption, IonSelect, IonItemOption, IonItemOptions, IonItemSliding, IonItemGroup, IonDatetime, IonModal, IonDatetimeButton, IonPopover, IonRange, IonToggle, IonBadge
} from '@ionic/angular/standalone';
import { ToggleMenu } from 'src/app/models/design';
import { ApiService } from 'src/app/services/api.service';
import { AlertsService } from 'src/app/services/alerts.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import { menuOutline, timeOutline, hammerOutline, hourglassOutline, pencilOutline, checkmarkOutline, trashOutline, addOutline, closeOutline, documentOutline, textOutline, mailOutline, save } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { ActivatedRoute } from '@angular/router';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext'; // Necesario para el buscador
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis, ApexDataLabels, ApexTooltip, ApexStroke, NgApexchartsModule, ChartType, ChartComponent } from "ng-apexcharts";
import { MultiSelectModule } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { FloatLabel } from "primeng/floatlabel"
import { NgxColorsModule } from 'ngx-colors';
import { CustomTooltipDirective } from 'app-tooltip.directive';


export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  legend: ApexLegend,
  annotations: ApexAnnotations;
};

@Component({
  selector: 'app-historical-details',
  templateUrl: './historical-details.page.html',
  styleUrls: ['./historical-details.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [NgApexchartsModule, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonLabel, IonMenuButton, IonIcon, IonButton, IonRow, TableModule, MultiSelectModule, Select, IonCard, IonCardContent, IonCardHeader, IonToggle, IonRange,
    IonCol, IonGrid, IonList, IonItem, IonSelectOption, IonSelect, IonItemOption, IonItemOptions, IonItemSliding, IonItemGroup, IonDatetime, IonModal, IonDatetimeButton, InputTextModule, IonPopover, FloatLabel, NgxColorsModule, CustomTooltipDirective, IonBadge

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
  groupByPeriod: string = '';       // Por defecto "Sin lapso"
  selectedAggregation: string = 'avg'; // Cálculo por defecto cuando se active
  mostrarPuntos: boolean = false;
  // Define el tipo para evitar errores de compilación (si usas TypeScript estricto)
  public chartOptions: any = {
    series: [{ name: 'Sensor Data', data: [] }], // Se inicializa vacío
    chart: {
      type: 'area', // Tu valor por defecto inicial (puedes cambiarlo a 'line')
      stacked: false,
      height: 350,
      zoom: {
        enabled: true,
        type: 'x',
        autoScaleYaxis: true,
      },
      animations: { enabled: false },
      toolbar: { autoSelected: 'zoom' },
    },
    // ─── NUEVO: REQUISITO PARA EL CONTROL DE GROSOR Y CURVATURA ───
    stroke: {
      curve: 'smooth', // 'smooth', 'straight', o 'stepline'
      width: 3         // El valor inicial (1 a 10) que leerá tu ion-range
    },
    // ─── NUEVO: REQUISITO PARA EL CONTROL DE COLOR EN TIEMPO REAL ───
    colors: ['#3880ff'], // Color inicial de la gráfica (azul primario de Ionic)

    dataLabels: { enabled: false },
    markers: { size: 0 },/*
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.5,
        opacityTo: 0,
        stops: [0, 90, 100],
      },
    },*/
    yaxis: {
      labels: {
        show: true,
        formatter: (val: number) => val
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
        formatter: (val: number) => val
      },
    },
    noData: {
      text: 'No hay datos para este sensor y este rango de fechas',
      align: 'center',
      verticalAlign: 'middle',
      style: {
        color: 'var(--ion-color-medium)',
        fontSize: '14px'
      }
    }
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
    this.loadChartPreferences();
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
    const sensorObj = this.selectedMachine.sensors.find((s: any) => s.sensor_id === this.selectedSensor);
    const sensorName = sensorObj ? sensorObj.sensor_name : 'Sensor';
    if (await this.alerts.ShowAlert("¿Deseas eliminar el dato (" + item.value + ") del sensor " + sensorName + "?", "Alerta", "Atrás", "Eliminar")) {

      this.api.DeleteRequestRender('sensorData/' + item.sensor_data_id).then((response: any) => {
        if (!response.errorsExistFlag) {
          this.historyData = this.historyData.filter((data: any) => data.sensor_data_id !== item.sensor_data_id);
          this.chartOptions = {
            ...this.chartOptions,
            series: [{
              name: 'Valor',
              data: this.historyData.map((d: any) => ({
                x: new Date(d.date_time).getTime(), // Nota: usamos 'date_time' porque es la propiedad mapeada en historyData
                y: d.value
              }))
            }]
          };
          // Forzamos el renderizado para que Ionic/Angular actualice la lista
          this.changeDetector.detectChanges();
          this.alerts.Success("Dato del sensor " + sensorName + " eliminado");
        } else {
          this.alerts.Info(response.error);
        }
      });
    }
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

    // 1. Construcción dinámica de la URL con los nuevos parámetros opcionales
    let url = `sensorsData?sensors=${this.selectedSensor}&start=${this.startDate}&end=${this.endDate}`;

    // Si el usuario seleccionó un lapso de tiempo válido, lo anexamos junto con la operación
    if (this.groupByPeriod && this.groupByPeriod !== '') {
      url += `&period=${this.groupByPeriod}&aggregation=${this.selectedAggregation}`;
    }

    const res: any = await this.api.GetRequestRender(url);

    // 2. Procesamos los datos para la tabla y el gráfico
    const rawData = res.items[0]?.data || [];
    console.log(rawData)
    this.historyData = rawData.map((d: any) => ({
      sensor_data_id: d.id,
      date_time: d.time,
      value: d.value,
      comment: d.comment,// Mandamos las propiedades del lapso por si quieres usarlas en el frontend
      //time_end: d.date_time_end || null
      date_time_end: d.date_time_end, // NUEVO: Fecha de fin del lapso agrupado
    }));

    // 3. Actualizamos la serie del gráfico asegurando la reactividad (inmutabilidad)
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

    // 4. Forzamos la detección de cambios para renderizar los nuevos datos e interfaz al instante
    this.changeDetector.detectChanges();
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
    const sensorObj = this.selectedMachine.sensors.find((s: any) => s.sensor_id === this.selectedSensor);
    const sensorName = sensorObj ? sensorObj.sensor_name : 'Sensor';

    // Limpieza para el nombre del archivo
    const safeSensor = sensorName.replace(/[^a-z0-9]/gi, '_');
    const safeDevice = this.selectedMachine.machine_id.toString().replace(/[^a-z0-9]/gi, '_');
    const dateRange = `${this.startDate}_al_${this.endDate}`.replace(/[^a-z0-9]/gi, '_');

    const fileName = `Reporte_${safeSensor}_${safeDevice}_${dateRange}.xlsx`;

    // 1. NUEVO: Agregamos las variables de agrupación a la URL del Endpoint
    let endpoint = `sensorsData/export?type=excel&sensor=${this.selectedSensor}&start=${this.startDate}&end=${this.endDate}`;

    if (this.groupByPeriod && this.groupByPeriod !== '') {
      endpoint += `&period=${this.groupByPeriod}&aggregation=${this.selectedAggregation}`;
    }

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

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
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
  updateChartSettings() {
    this.chartOptions = {
      ...this.chartOptions,
      chart: { ...this.chartOptions.chart },
      stroke: { ...this.chartOptions.stroke }
    };

    this.saveChartPreferences();

    this.changeDetector.detectChanges();
  }

  toggleMarkers() {
    this.chartOptions = {
      ...this.chartOptions,
      markers: {
        size: this.mostrarPuntos ? 5 : 0
      }
    };

    // 💾 Guardamos el cambio en LocalStorage
    this.saveChartPreferences();

    this.changeDetector.detectChanges();
  }
  cambiarColorGrafico(event: any) {
    const nuevoColor = event.target.value;
    this.chartOptions = {
      ...this.chartOptions,
      colors: [nuevoColor]
    };
    this.changeDetector.detectChanges();
  }
  saveChartPreferences() {
    const preferences = {
      type: this.chartOptions.chart.type,
      curve: this.chartOptions.stroke.curve,
      width: this.chartOptions.stroke.width,
      color: this.chartOptions.colors[0],
      mostrarPuntos: this.mostrarPuntos
    };

    localStorage.setItem('mes_chart_prefs', JSON.stringify(preferences));
    const savedPrefs = localStorage.getItem('mes_chart_prefs');
  }
  // 2. Recupera las opciones y las aplica al objeto chartOptions
  loadChartPreferences() {
    const savedPrefs = localStorage.getItem('mes_chart_prefs');
    if (savedPrefs) {
      const preferences = JSON.parse(savedPrefs);

      // Aplicamos los valores recuperados al objeto base
      this.chartOptions.chart.type = preferences.type || 'area';
      this.chartOptions.stroke.curve = preferences.curve || 'smooth';
      this.chartOptions.stroke.width = preferences.width || 3;
      this.chartOptions.colors = [preferences.color || '#3880ff'];
      this.mostrarPuntos = preferences.mostrarPuntos ?? false;

      // Sincronizamos el tamaño de los marcadores (puntos) basados en la preferencia
      this.chartOptions.markers.size = this.mostrarPuntos ? 5 : 0;
    }
  }
  protected readonly ToggleMenu = ToggleMenu;
}
