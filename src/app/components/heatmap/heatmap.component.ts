import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, Input, OnChanges, SimpleChanges, EventEmitter, Output, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonText, IonCard, IonCardTitle, IonCardContent, IonButtons, IonButton, IonIcon, IonPopover, IonList, IonItem, IonFab, IonFabButton, IonSelect, IonSelectOption, IonModal, IonInput, IonItemSliding, IonItemOptions, IonItemOption } from '@ionic/angular/standalone';
import { ApexAxisChartSeries, ApexTitleSubtitle, ApexDataLabels, ApexChart, NgApexchartsModule, ApexXAxis, ApexYAxis, ApexPlotOptions, ApexTooltip, ChartComponent } from "ng-apexcharts";
import { FormsModule } from '@angular/forms';
import { NgxColorsModule } from 'ngx-colors';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { WebSocketService } from 'src/app/services/web-socket.service';
import { ApiService } from 'src/app/services/api.service';
import { ellipsisVertical, moveOutline, pencilOutline, trashOutline, checkmark } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { AlertsService } from 'src/app/services/alerts.service';

export interface HeatmapData {
  [key: string]: any;
}
type HeatmapCell = {
  name: string;
  data: { x: string, y: number }[];
};
export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis,
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  colors: string[];
};

@Component({
  selector: 'app-heatmap',
  templateUrl: './heatmap.component.html',
  styleUrls: ['./heatmap.component.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [FormsModule, CommonModule, NgApexchartsModule, NgxColorsModule, IonText, IonCard, IonCardTitle, IonCardContent, IonButtons, IonButton, IonIcon, IonToolbar, IonPopover, IonContent, IonList, IonItem, IonFab, IonFabButton, IonInput, IonItemSliding, IonItemOptions, IonItemOption,
    IonHeader, IonTitle, IonSelect, IonSelectOption, IonModal, CdkDragHandle],
})
export class HeatmapComponent implements OnInit {
  @ViewChild("heatmapChart", { static: false }) chart: ChartComponent | undefined;
  widgetData: any = {}
  @Input() data: HeatmapData = {};
  @Input() refreshData: boolean = false;
  @Output() remove = new EventEmitter<number>();
  public chartOptions: ChartOptions;
  title = "Heatmap"
  copyWidgetData: any = {}
  machines: any
  isModalOpen = false;
  showChart: boolean = true;
  customStartDate = '2025-07-10T13:34:49';
  customEndDate = '2025-07-10T13:34:49';
  isPaused = false;
  nowDate = ''
  constructor(
    private api: ApiService,
    private ws: WebSocketService,
    private alerts: AlertsService,
    private changeDetector: ChangeDetectorRef,) {
    addIcons({ moveOutline, ellipsisVertical, pencilOutline, trashOutline, checkmark });
    this.chartOptions = {
      series: [],
      colors: ["#fd9800ff"],
      chart: {
        height: 350,
        type: "heatmap"
      },
      xaxis: {
        type: "category",
        categories: []
      },
      plotOptions: {
        heatmap: {
          colorScale: {
            ranges: [
            ]
          }
        }
      },
      dataLabels: {
        enabled: false
      }
    };

  }
  ngOnInit() {
    this.initializeConfig();
  }
  initializeConfig() {
    this.widgetData = this.data
    //console.log(this.widgetData);
    if (this.chartOptions?.plotOptions?.heatmap?.colorScale) {
      this.chartOptions.plotOptions.heatmap.colorScale.ranges = this.widgetData.rules
    }
    /*if (
      this.chartOptions?.plotOptions?.heatmap?.colorScale?.ranges?.[0] &&
      this.widgetData?.sensors?.[0]?.color
    ) {
      this.chartOptions.plotOptions.heatmap.colorScale.ranges[0].color =
        this.widgetData.sensors[0].color;
    }*/

    this.chart?.updateOptions(this.chartOptions);
    const { start, end } = this.getDateRangeFromOption(this.widgetData.dateRange);
    this.nowDate = this.formatLocalISO(new Date())
    this.loadSensorData(start, end)
    this.changeDetector.detectChanges()
  }
  async loadSensorData(start: Date, end: Date) {
    const startStr = start.toISOString()
    const endStr = end.toISOString()
    const sensors = this.widgetData.sensors;
    const sensorIDsString = sensors.map((sensor: any) => sensor.sensor_id).join(',');
    try {
      const response: any = await this.api.GetRequestRender(
        `sensorsData/?sensors=${sensorIDsString}&start=${startStr}&end=${endStr}`, false
      );
      const series = this.generateHeatmapMatrix(response.items[0].data);
      this.chartOptions.series = series
      console.log(response);

      console.log(series);

      //this.ajustarYaxis();
      if (this.chart && this.chart.updateOptions) {
        this.chart.updateOptions(this.chartOptions);
      }
      //this.startSubscriptions();
    } catch (error) {
      console.error('Error al cargar datos de sensores:', error);
    }
  }
  generateData(count: any, yrange: any) {
    var i = 0;
    var series = [];
    while (i < count) {
      var x = "w" + (i + 1).toString();
      var y =
        Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;

      series.push({
        x: x,
        y: y
      });
      i++;
    }
    return series;
  }
  generateHeatmapMatrix(data: { value: string, time: string }[]) {
    const grouped: { [day: string]: { [hour: number]: number[] } } = {};

    data.forEach(entry => {
      const date = new Date(entry.time);
      const day = date.getFullYear() + "-" +
        (date.getMonth() + 1).toString().padStart(2, '0') + "-" +
        date.getDate().toString().padStart(2, '0');
      const hour = date.getHours(); // Hora local
      const val = parseFloat(entry.value);

      if (!grouped[day]) {
        grouped[day] = {};
      }
      if (!grouped[day][hour]) {
        grouped[day][hour] = [];
      }
      grouped[day][hour].push(val);
    });

    const series: any = [];
    const days = Object.keys(grouped).sort();

    for (const day of days) {
      const row: { x: string, y: number }[] = [];

      for (let hour = 0; hour < 24; hour++) {
        const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
        const values = grouped[day][hour] || [];
        const avg = values.length > 0
          ? values.reduce((sum, v) => sum + v, 0) / values.length
          : 0;

        row.push({ x: hourLabel, y: parseFloat(avg.toFixed(2)) });
      }

      series.push({
        name: day,
        data: row
      });
    }

    return series;
  }


  getSensorsForMachine(MachineId: number) {
    const machine: any = this.machines.find((m: any) => m.machine_id == MachineId);
    return machine ? machine.sensors : [];
  }
  async removeSensor(sensor: any) {
    this.copyWidgetData.sensors = this.copyWidgetData.sensors.filter((se: any) => se !== sensor);
    this.changeDetector.detectChanges()
  }
  updateChartDB() {
    const body = {
      name: this.copyWidgetData.name,
      user_id: 1,
      color: this.copyWidgetData.color,
      updated_by: 1,
      parameters: {
        rules: this.copyWidgetData.rules,
        widgetType: this.copyWidgetData.widgetType,
        selectedTimeRange: this.copyWidgetData.selectedTimeRange,
        chartType: this.copyWidgetData.chartType,
        sensors: this.copyWidgetData.sensors,
      }
    }
    this.isModalOpen = false;
    this.api.PutRequestRender('dashboards/' + this.widgetData.dashboard_id, body).then((response: any) => {
      if (response.errorsExistFlag) {
        this.alerts.Info(response.message);
      } else {
        this.widgetData = JSON.parse(JSON.stringify(this.copyWidgetData))
        this.data = this.widgetData
        this.showChart = true;
        this.initializeConfig()
        this.isModalOpen = false
        this.changeDetector.detectChanges()
      }
    })
  }
  Delete() {
    this.remove.emit(this.data['id']);
  }
  UpdateNow() {
    this.nowDate = this.formatLocalISO(new Date())
  }
  formatLocalISO(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T` +
      `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }
  getDateRangeFromOption(option: string): { start: Date; end: Date } {
    const now = new Date();
    const end = new Date(); // Fecha actual
    let start: Date;
    switch (option) {
      case 'last1h':
        start = new Date(now.getTime() - 1 * 60 * 60 * 1000); // Hace 1 hora
        break;

      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;

      case 'last24h':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;

      case 'last7days':
        start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
        start.setHours(0, 0, 0, 0);
        break;

      case 'thisWeek': {
        const dayOfWeek = now.getDay(); // 0 = domingo
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // lunes
        start = new Date(now.setDate(diff));
        start.setHours(0, 0, 0, 0);
        break;
      }
      case 'last30days':
        start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
        start.setHours(0, 0, 0, 0);
        break;

      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;

      default:
        throw new Error('Opción de rango de fechas no válida');
    }

    return { start, end };
  }
  localToISOString(localString: string): string {
    const localDate = new Date(localString);
    return localDate.toISOString();
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
  async removeRule(rule: any, index: number) {
    this.copyWidgetData.rules = this.copyWidgetData.rules.filter((ru: any) => ru !== rule);
    // Reajustar los valores min después de eliminar una regla
    this.recalculateRules();

    this.changeDetector.detectChanges();
  }
  async addNewRule() {
    let newMin = 0;
    // Si hay reglas anteriores, tomar el máximo de la última regla
    if (this.copyWidgetData.rules.length > 0) {
      const lastRule = this.copyWidgetData.rules[this.copyWidgetData.rules.length - 1];
      newMin = Number(lastRule.to);
    }
    this.copyWidgetData.rules.push({
      from: newMin,
      to: newMin + 20, // O el valor que prefieras por defecto
      name: "Regla " + Number(this.copyWidgetData.rules.length + 1),
      color: '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0')
    });
  }
  onMaxChange(rule: any, index: number) {
    // Actualizar el min de la siguiente regla si existe
    if (index < this.copyWidgetData.rules.length - 1) {
      this.copyWidgetData.rules[index + 1].from = Number(rule.to);
    }
    if (Number(rule.to) <= Number(rule.from)) {
      rule.to = Number(rule.from) + 1;
      this.copyWidgetData.rules[index + 1].from = Number(rule.from) + 1
    }

    this.changeDetector.detectChanges();
  }
  recalculateRules() {
    for (let i = 1; i < this.copyWidgetData.rules.length; i++) {
      this.copyWidgetData.rules[i].from = this.copyWidgetData.rules[i - 1].to;
    }
  }
  changeOnTimeRange(event: any) {
    const selectedValue = event.detail.value;
    if (selectedValue == 'custom') {
      this.isPaused = true
      const { start, end } = this.getDateRangeFromOption('last7days');
      this.customStartDate = this.formatLocalISO(start)//.toISOString()
      this.customEndDate = this.formatLocalISO(end)//.toISOString()
      this.changeDetector.detectChanges()
      this.loadSensorData(start, end)
    } else {
      this.api.PutRequestRender('dashboards/dateRange', { dateRange: selectedValue, dashboard_id: this.widgetData.dashboard_id }).then((response: any) => {
        if (response.errorsExistFlag) {
        } else {
          this.isPaused = false
          const { start, end } = this.getDateRangeFromOption(selectedValue);
          this.loadSensorData(start, end)
        }
      })
    }
  }
  onStartDateChange(event: any) {
    const selectedValue = event.detail.value;
    this.changeDetector.detectChanges()
    this.loadSensorData(new Date(selectedValue), new Date(this.customEndDate))
  }
  onEndDateChange(event: any) {
    const selectedValue = event.detail.value;
    this.changeDetector.detectChanges()
    this.loadSensorData(new Date(this.customStartDate), new Date(selectedValue))
  }
  deleteChart() {
    this.remove.emit(this.widgetData.id);
  }
  editChart() {
    this.copyWidgetData = JSON.parse(JSON.stringify(this.widgetData))
    this.api.GetRequestRender('machinesAndSensorsByOrganizations?organizations=' + this.widgetData.organization_id).then((response: any) => {
      this.machines = response.items
      this.isModalOpen = true;
      //this.copyWidgetData.machine = response.data[0].MachineId + ""
      //console.log(response.data[0].MachineId);
    })
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['refreshData'] && changes['refreshData'].currentValue === true) {
      //this.ajustarYaxis();
    }
  }
}