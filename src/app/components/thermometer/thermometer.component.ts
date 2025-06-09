import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

// ✅ INTERFACES EXPORTADAS PARA CONFIGURACIÓN PARAMETRIZABLE
export interface ThermometerRange {
  min: number;
  max: number;
}

export interface ThermometerThresholds {
  extremeCold: number;
  veryCold: number;
  cold: number;
  cool: number;
  warm: number;
  hot: number;
}

export interface ThermometerDisplay {
  showTitle: boolean;
  showStats: boolean;
  showControl: boolean;
  showSensorInfo: boolean;
  compactMode: boolean;
}

export interface ThermometerConfig {
  title: string;
  initialTemperature: number;
  range: ThermometerRange;
  sensorType: string;
  autoUpdate: boolean;
  updateInterval: number;
  thresholds: ThermometerThresholds;
  display: ThermometerDisplay;
  isConnected: boolean;
  connectionType: 'ble' | 'wifi' | 'simulation';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

@Component({
  selector: 'app-thermometer',
  templateUrl: './thermometer.component.html',
  styleUrls: ['./thermometer.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ height: '0px', opacity: 0, overflow: 'hidden' }),
        animate('300ms ease-in-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in-out', style({ height: '0px', opacity: 0, overflow: 'hidden' }))
      ])
    ])
  ]
})
export class ThermometerComponent implements OnInit, OnDestroy, OnChanges {

  @Input() externalConfig: Partial<ThermometerConfig> = {};

  // ✅ CONFIGURACIÓN POR DEFECTO PARAMETRIZABLE
  private defaultConfig: ThermometerConfig = {
    title: 'Termómetro',
    initialTemperature: 25,
    range: { min: -150, max: 60 },
    sensorType: 'DS18B20',
    autoUpdate: true,
    updateInterval: 2500,
    thresholds: {
      extremeCold: -120,
      veryCold: -60,
      cold: -30,
      cool: 0,
      warm: 30,
      hot: 45
    },
    display: {
      showTitle: true,
      showStats: true,
      showControl: true,
      showSensorInfo: true,
      compactMode: false
    },
    isConnected: false,
    connectionType: 'simulation',
    colors: {
      primary: '#DAA520',
      secondary: '#1a1a1a',
      accent: '#4A90E2'
    }
  };

  // Estado interno del componente
  public config: ThermometerConfig = { ...this.defaultConfig };
  private temperatureSubject = new BehaviorSubject<number>(25);
  public temperature$ = this.temperatureSubject.asObservable();

  // Estadísticas internas
  public minRecorded = 25;
  public maxRecorded = 25;
  public averageTemp = 25;
  private readings: number[] = [];

  // Control de simulación
  private simulationSubscription?: Subscription;
  public lastUpdate = new Date();
  public isSimulationActive = false;

  // ✅ CONTROL DE PANEL DE CONFIGURACIÓN
  public showConfigPanel = false;
  public tempConfig: ThermometerConfig = { ...this.defaultConfig };

  ngOnInit() {
    this.initializeConfig();
    this.initializeTemperature();
    this.startSimulation();
    console.log('🌡️ Termómetro con configuración integrada inicializado');
  }

  ngOnDestroy() {
    this.stopSimulation();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['externalConfig'] && !changes['externalConfig'].firstChange) {
      console.log('🔄 Configuración externa actualizada');
      this.initializeConfig();

      // Validar que el valor actual esté dentro del nuevo rango
      const currentValue = this.temperatureSubject.value;
      const minValue = this.config.range.min;
      const maxValue = this.config.range.max;

      if (currentValue < minValue || currentValue > maxValue) {
        const newValue = Math.max(minValue, Math.min(maxValue, currentValue));
        this.updateTemperature(newValue);
      }

      // Reiniciar simulación si cambió el intervalo
      if (changes['externalConfig'].currentValue?.updateInterval !== changes['externalConfig'].previousValue?.updateInterval) {
        this.stopSimulation();
        this.startSimulation();
      }
    }
  }

  // ===== MÉTODOS DE CONFIGURACIÓN =====

  public toggleConfigPanel() {
    this.showConfigPanel = !this.showConfigPanel;
    if (this.showConfigPanel) {
      // ✅ Deep copy con asegurar que todas las propiedades estén definidas
      this.tempConfig = JSON.parse(JSON.stringify(this.config));

      // ✅ Asegurar que range y display estén siempre definidos
      if (!this.tempConfig.range) {
        this.tempConfig.range = { min: -150, max: 60 };
      }
      if (!this.tempConfig.display) {
        this.tempConfig.display = { ...this.defaultConfig.display };
      }
    }
  }

  public updateTempRange(type: 'min' | 'max', event: any) {
    const value = parseFloat(event.detail.value);

    if (isNaN(value)) {
      console.warn('⚠️ Valor de temperatura inválido');
      return;
    }

    if (type === 'min') {
      if (value >= this.tempConfig.range.max) {
        console.warn('⚠️ Temperatura mínima debe ser menor que máxima');
        return;
      }
      this.tempConfig.range.min = value;
    } else {
      if (value <= this.tempConfig.range.min) {
        console.warn('⚠️ Temperatura máxima debe ser mayor que mínima');
        return;
      }
      this.tempConfig.range.max = value;
    }

    console.log(`🌡️ Rango temporal actualizado: ${this.tempConfig.range.min}°C - ${this.tempConfig.range.max}°C`);
  }

  public updateTempConfig(key: string, event: any) {
    let value: any;

    if (event.detail) {
      value = event.detail.value;
    } else {
      value = event.target.value;
    }

    // Conversión de tipos específicos
    if (key === 'updateInterval') {
      value = parseInt(value);
      if (isNaN(value) || value < 500) {
        console.warn('⚠️ Intervalo debe ser mayor a 500ms');
        return;
      }
    }

    (this.tempConfig as any)[key] = value;
    console.log(`⚙️ Configuración temporal actualizada: ${key} = ${value}`);
  }

  public updateDisplayConfig(key: string, event: any) {
    const value = event.detail.checked;

    if (!this.tempConfig.display) {
      this.tempConfig.display = { ...this.defaultConfig.display };
    }

    (this.tempConfig.display as any)[key] = value;
    console.log(`👁️ Display config actualizado: ${key} = ${value}`);
  }

  public applyConfig() {
    // ✅ APLICAR CONFIGURACIÓN TEMPORAL Y FORZAR ACTUALIZACIÓN
    this.config = JSON.parse(JSON.stringify(this.tempConfig));

    // ✅ VALIDAR Y AJUSTAR VALOR ACTUAL AL NUEVO RANGO
    const currentValue = this.temperatureSubject.value;
    const newMin = this.config.range.min;
    const newMax = this.config.range.max;

    if (currentValue < newMin || currentValue > newMax) {
      const adjustedValue = Math.max(newMin, Math.min(newMax, currentValue));
      this.updateTemperature(adjustedValue);
    }

    // ✅ RECALCULAR UMBRALES CON NUEVO RANGO
    this.adjustThresholds();

    // ✅ REINICIAR ESTADÍSTICAS PARA NUEVO RANGO
    this.resetStatistics();

    // ✅ REINICIAR SIMULACIÓN CON NUEVA CONFIGURACIÓN
    this.stopSimulation();
    this.startSimulation();

    // Cerrar panel
    this.showConfigPanel = false;

    console.log('✅ Configuración aplicada exitosamente');
    console.log('🌡️ Nuevo rango:', this.config.range);
    console.log('🌡️ Nuevos umbrales:', this.config.thresholds);
  }

  public resetToDefaults() {
    this.tempConfig = JSON.parse(JSON.stringify(this.defaultConfig));
    console.log('🔄 Configuración temporal reseteada');
  }

  // ===== MÉTODOS ORIGINALES MEJORADOS =====

  private initializeConfig() {
    // Combinar configuración por defecto con externa
    this.config = this.deepMerge(this.defaultConfig, this.externalConfig);

    // Asegurar que range y display estén definidos
    if (!this.config.range) {
      this.config.range = { min: -150, max: 60 };
    }

    if (!this.config.display) {
      this.config.display = { ...this.defaultConfig.display };
    }

    // Validar rango
    const minValue = this.config.range.min;
    const maxValue = this.config.range.max;

    if (minValue >= maxValue) {
      console.warn('⚠️ Rango de temperatura inválido, usando valores por defecto');
      this.config.range = { min: -150, max: 60 };
    }

    // Ajustar umbrales basados en el nuevo rango
    this.adjustThresholds();

    console.log('⚙️ Configuración procesada:', this.config);
  }

  private adjustThresholds() {
    const minValue = this.config.range.min;
    const maxValue = this.config.range.max;
    const range = maxValue - minValue;

    // ✅ CALCULAR UMBRALES DINÁMICAMENTE BASADOS EN EL RANGO
    this.config.thresholds = {
      extremeCold: Math.round((minValue + (range * 0.1)) * 10) / 10,
      veryCold: Math.round((minValue + (range * 0.25)) * 10) / 10,
      cold: Math.round((minValue + (range * 0.4)) * 10) / 10,
      cool: Math.round((minValue + (range * 0.55)) * 10) / 10,
      warm: Math.round((minValue + (range * 0.7)) * 10) / 10,
      hot: Math.round((minValue + (range * 0.85)) * 10) / 10
    };

    console.log('🌡️ Umbrales recalculados:', this.config.thresholds);
  }

  private initializeTemperature() {
    const minValue = this.config.range.min;
    const maxValue = this.config.range.max;
    let initialTemp = this.config.initialTemperature;
    initialTemp = Math.max(minValue, Math.min(maxValue, initialTemp));

    this.temperatureSubject.next(initialTemp);
    this.updateStatistics(initialTemp);
  }

  private startSimulation() {
    if (!this.config.autoUpdate) return;

    this.isSimulationActive = true;
    this.simulationSubscription = interval(this.config.updateInterval)
      .subscribe(() => {
        this.generateRandomTemperature();
      });
  }

  private stopSimulation() {
    this.isSimulationActive = false;
    if (this.simulationSubscription) {
      this.simulationSubscription.unsubscribe();
    }
  }

  private generateRandomTemperature() {
    const current = this.temperatureSubject.value;
    const minValue = this.config.range.min;
    const maxValue = this.config.range.max;

    const totalRange = maxValue - minValue;
    const maxChange = totalRange * 0.03;
    const change = (Math.random() - 0.5) * maxChange;
    let newTemp = current + change;

    newTemp = Math.max(minValue, Math.min(maxValue, newTemp));
    this.updateTemperature(newTemp);
  }

  public updateTemperature(temperature: number) {
    const minValue = this.config.range.min;
    const maxValue = this.config.range.max;
    const clampedTemp = Math.max(minValue, Math.min(maxValue, temperature));

    this.temperatureSubject.next(clampedTemp);
    this.updateStatistics(clampedTemp);
    this.lastUpdate = new Date();
  }

  private updateStatistics(temperature: number) {
    if (this.readings.length === 0) {
      this.minRecorded = temperature;
      this.maxRecorded = temperature;
    } else {
      this.minRecorded = Math.min(this.minRecorded, temperature);
      this.maxRecorded = Math.max(this.maxRecorded, temperature);
    }

    this.readings.push(temperature);
    if (this.readings.length > 100) {
      this.readings.shift();
    }

    const sum = this.readings.reduce((acc, val) => acc + val, 0);
    this.averageTemp = sum / this.readings.length;
  }

  // === MÉTODOS PÚBLICOS PARA CONTROL ===

  public setTemperature(event: any) {
    const value = typeof event === 'number' ? event : event.detail.value;
    this.updateTemperature(value);
  }

  public resetStatistics() {
    const current = this.temperatureSubject.value;
    this.minRecorded = current;
    this.maxRecorded = current;
    this.readings = [current];
    this.averageTemp = current;
  }

  public toggleSimulation() {
    if (this.isSimulationActive) {
      this.stopSimulation();
    } else {
      this.startSimulation();
    }
  }

  public setRandomTemperature() {
    const minValue = this.config.range.min;
    const maxValue = this.config.range.max;
    const randomTemp = Math.random() * (maxValue - minValue) + minValue;
    this.updateTemperature(randomTemp);
  }

  // === MÉTODOS PARA EL TEMPLATE ===

  public get title(): string {
    return this.config.title;
  }

  public get sensorType(): string {
    return this.config.sensorType;
  }

  public get isConnected(): boolean {
    return this.config.isConnected;
  }

  // ✅ MÉTODO MEJORADO PARA VALORES DE ESCALA DINÁMICOS
  public getScaleValue(percentage: number): number {
    const minValue = this.config.range.min;
    const maxValue = this.config.range.max;
    const range = maxValue - minValue;
    const value = minValue + (range * percentage);

    // Redondear apropiadamente basado en el rango
    if (range > 1000) {
      return Math.round(value);
    } else if (range > 100) {
      return Math.round(value * 10) / 10;
    } else {
      return Math.round(value * 100) / 100;
    }
  }

  // ✅ MÉTODO PARA CALCULAR LA POSICIÓN DE LA MARCA DE CERO
  public getZeroPosition(): number | null {
    const minValue = this.config.range.min;
    const maxValue = this.config.range.max;

    // Solo mostrar la marca de cero si está dentro del rango
    if (0 < minValue || 0 > maxValue) {
      return null; // Cero está fuera del rango, no mostrar
    }

    // Calcular la posición Y del cero
    const percentage = (0 - minValue) / (maxValue - minValue);
    const clampedPercentage = Math.max(0, Math.min(1, percentage));

    const topY = 50;
    const bottomY = 330;
    const zeroY = bottomY - (clampedPercentage * (bottomY - topY));

    return Math.max(topY, Math.min(bottomY, zeroY));
  }

  // ✅ VERIFICAR SI CERO COINCIDE CON MIN O MAX EXACTAMENTE
  public isZeroAtPosition(percentage: number): boolean {
    const minValue = this.config.range.min;
    const maxValue = this.config.range.max;

    // Verificar si cero es exactamente el min o max
    if (percentage === 0.0 && minValue === 0) return true;
    if (percentage === 1.0 && maxValue === 0) return true;

    return false;
  }

  // ✅ DETERMINAR SI MOSTRAR LA MARCA DE CERO (SIEMPRE EXCEPTO SI MIN O MAX ES 0)
  public shouldShowZeroMark(): boolean {
    const minValue = this.config.range.min;
    const maxValue = this.config.range.max;

    // Si cero está fuera del rango, no mostrar
    if (0 < minValue || 0 > maxValue) {
      return false;
    }

    // Si cero es exactamente el mínimo o máximo, no mostrar marca separada
    if (minValue === 0 || maxValue === 0) {
      return false;
    }

    return true; // Mostrar marca de cero independiente SIEMPRE si está en rango
  }

  public get temperatureColor(): string {
    const temp = this.temperatureSubject.value;
    const thresholds = this.config.thresholds;

    if (temp <= thresholds.extremeCold) return '#00bfff';
    else if (temp <= thresholds.veryCold) return '#4169e1';
    else if (temp <= thresholds.cold) return '#1e90ff';
    else if (temp <= thresholds.cool) return '#00ced1';
    else if (temp <= thresholds.warm) return '#ffd700';
    else if (temp <= thresholds.hot) return '#ff8c00';
    else return '#ff4500';
  }

  public get temperatureLabel(): string {
    const temp = this.temperatureSubject.value;
    const thresholds = this.config.thresholds;

    if (temp <= thresholds.extremeCold) return 'EXTREMO FRÍO';
    else if (temp <= thresholds.veryCold) return 'MUY FRÍO';
    else if (temp <= thresholds.cold) return 'FRÍO';
    else if (temp <= thresholds.cool) return 'FRESCO';
    else if (temp <= thresholds.warm) return 'TEMPLADO';
    else if (temp <= thresholds.hot) return 'CÁLIDO';
    else return 'CALIENTE';
  }

  public getIndicatorPosition(temperature: number): number {
    const minValue = this.config.range.min;
    const maxValue = this.config.range.max;
    const percentage = (temperature - minValue) / (maxValue - minValue);
    const clampedPercentage = Math.max(0, Math.min(1, percentage));

    const topY = 50;
    const bottomY = 330;
    const indicatorY = bottomY - (clampedPercentage * (bottomY - topY));

    return Math.max(topY, Math.min(bottomY, indicatorY));
  }

  public getStatColor(value: number): string {
    const thresholds = this.config.thresholds;
    if (value <= thresholds.cold) return '#4169e1';
    else if (value <= thresholds.warm) return '#ffd700';
    else return '#ff8c00';
  }

  // === UTILIDADES ===

  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  public get Math() {
    return Math;
  }
}