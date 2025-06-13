import { CommonModule } from '@angular/common';
import { Component, OnInit, OnChanges, SimpleChanges, ViewChild, Input, ChangeDetectorRef, EventEmitter, Output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgModel } from '@angular/forms';
//import { IonCard, IonCardHeader, IonText, IonCardTitle, IonCardContent, IonButtons, IonButton, IonIcon, IonToolbar, IonPopover, IonContent, IonList, IonItem, IonFab, IonFabButton, IonHeader, IonTitle, IonSelect, IonSelectOption, IonModal } from '@ionic/angular/standalone';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis, ApexDataLabels, ApexTooltip, ApexStroke, NgApexchartsModule, ChartType, ChartComponent } from "ng-apexcharts";
import { NgxColorsModule } from 'ngx-colors';
import { FormsModule } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';
//import { WebSocketService } from 'src/app/services/web-socket.service';
import { IonicModule } from '@ionic/angular';
import { WebSocketService } from 'src/app/services/web-socket.service';
import { EndpointsService } from 'src/app/services/endpoints.service';
import { addIcons } from 'ionicons';
import { ellipsisVertical, pencilOutline, trashOutline } from 'ionicons/icons';
export interface SplineData {
  [key: string]: any;
}

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
};

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, NgApexchartsModule, IonicModule, NgxColorsModule/*, IonText, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButtons, IonButton, IonIcon, IonToolbar, IonPopover, IonContent, IonList, IonItem, IonFab, IonFabButton, IonHeader, IonTitle, IonSelect, IonSelectOption, IonModal*/],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ChartsComponent implements OnInit {
  @ViewChild("splineChart", { static: false }) chart: ChartComponent | undefined;
  @Input() data: SplineData = {};
  @Input() refreshData: boolean = false;
  @Output() remove = new EventEmitter<number>();
  public chartOptions: ChartOptions;
  title = "Spline"
  widgetData: any = {}
  copyWidgetData: any = {}
  machines: any
  isModalOpen = false;
  showChart: boolean = true;
  private conexionesLocales: { [sensorId: string]: WebSocket } = {};
  isPaused = false;
  constructor(private changeDetector: ChangeDetectorRef,
    private ws: WebSocketService,
    private endPoints: EndpointsService,
    private api: ApiService) {
    addIcons({
      ellipsisVertical,
      pencilOutline,
      trashOutline
    })
    this.chartOptions = {
      series: [],
      chart: {
        animations: {
          enabled: true,
          speed: 1,
          animateGradually: {
            enabled: true,
            delay: 1
          },
          dynamicAnimation: {
            enabled: true,
            speed: 1
          }
        },
        height: 350,
        type: "area",
        toolbar: {
          show: true,
          tools: {
            download: window.innerWidth > 768,
            selection: true/*,
            zoom: window.innerWidth > 768, // Solo mostrar zoom en dispositivos con ancho > 768px
            zoomin: window.innerWidth > 768,
            zoomout: window.innerWidth > 768,
            pan: window.innerWidth > 768,
            reset: window.innerWidth > 768,*/
          }
        },
        zoom: {
          enabled: true,
          type: 'x'
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: "smooth",
        width: 2
      },
      xaxis: {
        type: "datetime",
        labels: {
          datetimeUTC: false,
          format: "dd/MM/yy hh:mm"
        }
      },
      yaxis: {
        /*min: 20,  // Valor mínimo en el eje Y
        max: 70,  // Valor máximo en el eje Y*/
      },
      tooltip: {
        x: {
          format: "dd/MM/yy hh:mm"
        }
      }
    };
  }

  ngOnInit() {
    this.widgetData = this.data
    this.initializeChart();
  }

  initializeChart() {
    //console.log(this.widgetData);    
    if (this.widgetData.chartType) {
      this.chartOptions.chart.type = this.widgetData.chartType;
      this.chart?.updateOptions(this.chartOptions);
    }
    this.loadSensorData()/*.then(() => {
      //
    });*/
  }

  async loadSensorData() {
    const now = new Date();
    const nowDate = now.toISOString().slice(0, 19); // "YYYY-MM-DDTHH:mm:ss"
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    midnight.setDate(midnight.getDate() - 3);
    const result = midnight.toISOString().slice(0, 19);
    const sensors = this.widgetData.sensors;
    const sensorIDsString = sensors.map((sensor: any) => sensor.sensor_id).join(',');//IDs separados por coma (,)
    this.api.GetRequestRender(this.endPoints.Render('sensorsData/?sensors=') + sensorIDsString + '&start=' + result + '&end=' + nowDate, false).then((response: any) => {
      const data = response.items.map((sensor: any) => {
        const colorObj = sensors.find((s: any) => s.sensor_id == sensor.sensor_id);
        return {
          color: colorObj.color,
          group: sensor.sensor_id,
          name: sensor.sensor_name,
          data: sensor.data.map((data: any) => ({
            x: new Date(data.time).getTime(),
            y: Number(data.value)
          }))
        }
      })
      this.chartOptions.series = data;
      this.ajustarYaxis();
      this.startSubscriptions();
    })
    /*
    const seriesData = await Promise.all(
      sensores.map((sensor: any) =>
        this.api.GetRequestRender(this.endPoints.Render('sensorData/') + sensor.sensor_id + '?start=' + result + '&end=' + nowDate).then((response: any) => (
          console.log(response),{
          color: sensor.color,
          group: sensor.sensor_id, // ID único
          name: response.sensor_name,
          data: response.items.map((item: any) => ({
            x: new Date(item.time).getTime(),
            y: Number(item.value)
          }))
        }))
      )
    );
    this.chartOptions.series = seriesData;*/
    if (this.chart && this.chart.updateOptions) {
      this.chart.updateOptions(this.chartOptions);
    }
  }
  startSubscriptions() {
    const sensores = this.widgetData.sensors;
    sensores.forEach((sensor: any) => {
      const sensor_id = sensor.sensor_id;
      this.ws.Suscribe(sensor_id, (data) => {
        if (this.isPaused) return;
        const timestamp = new Date(data.data.time).getTime();
        const sensorId = data.data.sensorId;
        const serie: any = this.chartOptions.series.find((s: any) => s.group == sensorId);
        if (serie) {
          serie.data.unshift({ x: timestamp, y: Number(data.data.value) });
          if (serie.data.length > 100) {
            serie.data.pop();
          }
          if (this.chart && this.chart.updateSeries) {
            this.chart.updateSeries(this.chartOptions.series);
            this.ajustarYaxis();
          }
        }
      }).then((ws) => {
        this.conexionesLocales[sensor_id] = ws;
      }).catch(err => {
        console.error('Error suscribiendo a sensor', sensor_id, err);
      });
    });
  }
  stopSubscriptions() {
    for (const sensorId in this.conexionesLocales) {
      const ws = this.conexionesLocales[sensorId];
      if (ws && ws.readyState === WebSocket.OPEN) {
        console.log("unsuscribed");

        ws.send(JSON.stringify({ type: 'unsuscribe', sensor_id: sensorId }));
        ws.close();
      }
    }
    this.conexionesLocales = {};
  }
  ajustarYaxis() {
    const allYValues: number[] = [];
    this.chartOptions.series.forEach((serie: any) => {
      serie.data.forEach((point: any) => {
        if (typeof point.y === 'number') {
          allYValues.push(point.y);
        }
      });
    });
    if (allYValues.length === 0) return;
    const min = Math.min(...allYValues);
    const max = Math.max(...allYValues);
    const padding = 2;
    const newYaxis = {
      min: min - padding < 10 ? min - padding : 10,
      max: max + padding > 25 ? max + padding : 25
    };
    this.chartOptions.yaxis = newYaxis;
    if (this.chart && this.chart.updateOptions) {
      this.chart.updateOptions({
        yaxis: newYaxis
      });
    }
  }

  ionViewWillLeave() {
    this.stopSubscriptions()
  }
  async addNewSensor() {
    this.copyWidgetData.sensors.push({ color: '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0') })
  }
  updateChartDB() {
    const body = {
      name: this.copyWidgetData.name,
      user_id: 1,
      color : this.copyWidgetData.color,
      updated_by : 1,
      parameters: {
        widgetType: this.copyWidgetData.widgetType,
        chartType: this.copyWidgetData.chartType,
        sensors: this.copyWidgetData.sensors,
      }
    }
    this.showChart = false;
    this.api.UpdateRequestRender(this.endPoints.Render('dashboards/') + this.widgetData.dashboard_id, body).then((response: any) => {
      //console.log(response);
      this.widgetData = JSON.parse(JSON.stringify(this.copyWidgetData))
      this.data = this.widgetData
      this.showChart = true;
      this.initializeChart()
      this.isModalOpen = false
      this.changeDetector.detectChanges()
    })
  }
  deleteChart() {
    this.remove.emit(this.widgetData.id);
  }
  editChart() {
    this.copyWidgetData = JSON.parse(JSON.stringify(this.widgetData))
    this.api.GetRequestRender(this.endPoints.Render('machinesAndSensors/1')).then((response: any) => {
      this.machines = response.items
      this.isModalOpen = true;
      //this.newWidgetData.machine = response.data[0].MachineId + ""
      //console.log(response.data[0].MachineId);
    })
  }
  getSensorsForMachine(MachineId: number) {
    const machine: any = this.machines.find((m: any) => m.machine_id == MachineId);
    return machine ? machine.sensors : [];
  }
  async removeSensor(sensor: any) {
    this.copyWidgetData.sensors = this.copyWidgetData.sensors.filter((se: any) => se !== sensor);
    this.changeDetector.detectChanges()
  }
}
