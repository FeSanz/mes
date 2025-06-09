// src/app/components/gauge/humidity-gauge.component.ts
import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

export interface GaugeConfig {
  title: string;
  minColor: string;
  maxColor: string;
  minValue: number;
  maxValue: number;
  currentValue: number;
  autoUpdate: boolean;
  updateInterval: number;
  showStats: boolean;
  compactMode: boolean;
}

@Component({
  selector: 'app-gauge',
  templateUrl: './gauge.component.html',
  styleUrls: ['./gauge.component.scss'],
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
export class GaugeComponent implements OnInit, OnDestroy, OnChanges {

  @Input() config: Partial<GaugeConfig> = {};

  // ✅ CONFIGURACIÓN POR DEFECTO
  private defaultConfig: GaugeConfig = {
    title: 'Sensor de Humedad',
    minColor: '#ff4444',
    maxColor: '#44ff44',
    minValue: 0,
    maxValue: 100,
    currentValue: 50.00,
    autoUpdate: true,
    updateInterval: 3000,
    showStats: true,
    compactMode: false
  };

  // Estado interno del componente
  private humiditySubject = new BehaviorSubject<number>(50.00);
  public humidity$ = this.humiditySubject.asObservable();

  // Estadísticas
  public minRecorded = 100;
  public maxRecorded = 0;
  public averageHumidity = 50;
  private readings: number[] = [];
  
  // Control de simulación
  private simulationSubscription?: Subscription;
  public lastUpdate = new Date();
  public currentColor = '#4A90E2';

  // Configuración procesada
  public processedConfig: GaugeConfig = { ...this.defaultConfig };

  // ✅ CONTROL DE PANEL DE CONFIGURACIÓN
  public showConfigPanel = false;
  public tempConfig: GaugeConfig = { ...this.defaultConfig };

  ngOnInit() {
    this.initializeConfig();
    this.updateCurrentColor();
    this.startSimulation();
    console.log('💧 Componente Humedad con configuración integrada inicializado');
  }

  ngOnDestroy() {
    this.stopSimulation();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['config'] && !changes['config'].firstChange) {
      console.log('🔄 Configuración externa actualizada');
      this.initializeConfig();
      this.updateCurrentColor();
    }
  }

  private initializeConfig() {
    // ✅ DEEP MERGE DE CONFIGURACIÓN
    this.processedConfig = {
      ...this.defaultConfig,
      ...this.config
    };

    // Validar rangos
    if (this.processedConfig.minValue >= this.processedConfig.maxValue) {
      console.warn('⚠️ Rango inválido, usando valores por defecto');
      this.processedConfig.minValue = 0;
      this.processedConfig.maxValue = 100;
    }

    // ✅ VALIDAR COLORES
    if (!this.isValidColor(this.processedConfig.minColor)) {
      console.warn('⚠️ Color mínimo inválido, usando por defecto');
      this.processedConfig.minColor = '#ff4444';
    }
    
    if (!this.isValidColor(this.processedConfig.maxColor)) {
      console.warn('⚠️ Color máximo inválido, usando por defecto');
      this.processedConfig.maxColor = '#44ff44';
    }

    // Sincronizar configuración temporal
    this.tempConfig = { ...this.processedConfig };

    // Ajustar valor inicial
    const initialValue = Math.max(this.processedConfig.minValue, 
                                  Math.min(this.processedConfig.maxValue, this.processedConfig.currentValue));
    
    this.humiditySubject.next(initialValue);
    this.updateStatistics(initialValue);
    this.updateCurrentColor();
    
    console.log(`💧 Configuración procesada: ${this.processedConfig.minValue}-${this.processedConfig.maxValue}%`);
    console.log(`🎨 Colores: ${this.processedConfig.minColor} -> ${this.processedConfig.maxColor}`);
  }

  // ===== MÉTODOS DE CONFIGURACIÓN =====

  public toggleConfigPanel() {
    this.showConfigPanel = !this.showConfigPanel;
    if (this.showConfigPanel) {
      this.tempConfig = { ...this.processedConfig };
    }
  }

  public updateTempConfig(key: string, event: any) {
    let value: any;
    
    if (event.target && event.target.type === 'color') {
      value = event.target.value;
    } else if (event.detail) {
      value = event.detail.value;
    } else {
      value = event.target.value;
    }

    // Conversión de tipos
    if (key === 'minValue' || key === 'maxValue') {
      value = parseFloat(value);
      if (isNaN(value)) {
        console.warn('⚠️ Valor numérico inválido');
        return;
      }
    }

    // Validaciones específicas
    if (key === 'minValue' && value >= this.tempConfig.maxValue) {
      console.warn('⚠️ El valor mínimo debe ser menor que el máximo');
      return;
    }
    
    if (key === 'maxValue' && value <= this.tempConfig.minValue) {
      console.warn('⚠️ El valor máximo debe ser mayor que el mínimo');
      return;
    }

    // Validar colores
    if ((key === 'minColor' || key === 'maxColor') && value && !this.isValidColor(value)) {
      console.warn('⚠️ Color inválido');
      return;
    }

    this.tempConfig = {
      ...this.tempConfig,
      [key]: value
    };

    console.log(`⚙️ Configuración temporal actualizada: ${key} = ${value}`);
  }

  public applyConfig() {
    // ✅ APLICAR CONFIGURACIÓN TEMPORAL Y FORZAR ACTUALIZACIÓN
    this.processedConfig = { ...this.tempConfig };
    
    // ✅ VALIDAR Y AJUSTAR VALOR ACTUAL AL NUEVO RANGO
    const currentValue = this.humiditySubject.value;
    const newMin = this.processedConfig.minValue;
    const newMax = this.processedConfig.maxValue;
    
    if (currentValue < newMin || currentValue > newMax) {
      const adjustedValue = Math.max(newMin, Math.min(newMax, currentValue));
      this.updateHumidity(adjustedValue);
    }
    
    // ✅ REINICIAR ESTADÍSTICAS PARA NUEVO RANGO
    this.resetStatistics();
    
    // ✅ FORZAR ACTUALIZACIÓN DE COLOR CON NUEVA CONFIGURACIÓN
    this.updateCurrentColor();
    
    // ✅ REINICIAR SIMULACIÓN CON NUEVA CONFIGURACIÓN
    this.stopSimulation();
    this.startSimulation();
    
    // Cerrar panel
    this.showConfigPanel = false;
    
    console.log('✅ Configuración aplicada exitosamente');
    console.log('💧 Nuevo rango:', this.processedConfig.minValue, '-', this.processedConfig.maxValue);
    console.log('🎨 Nuevos colores:', this.processedConfig.minColor, '->', this.processedConfig.maxColor);
    console.log('🎨 Color actual calculado:', this.currentColor);
  }

  public resetToDefaults() {
    this.tempConfig = { ...this.defaultConfig };
    console.log('🔄 Configuración temporal reseteada');
  }

  // ===== MÉTODOS ORIGINALES MEJORADOS =====

  private startSimulation() {
    if (!this.processedConfig.autoUpdate) return;

    this.simulationSubscription = interval(this.processedConfig.updateInterval)
      .subscribe(() => {
        this.generateRandomHumidity();
      });
  }

  private stopSimulation() {
    if (this.simulationSubscription) {
      this.simulationSubscription.unsubscribe();
    }
  }

  private generateRandomHumidity() {
    const current = this.humiditySubject.value;
    const range = this.processedConfig.maxValue - this.processedConfig.minValue;
    const maxChange = range * 0.05;
    const change = (Math.random() - 0.5) * maxChange;
    let newValue = current + change;

    newValue = Math.max(this.processedConfig.minValue, 
                       Math.min(this.processedConfig.maxValue, newValue));

    newValue = Math.round(newValue * 10) / 10;
    this.updateHumidity(newValue);
  }

  public updateHumidity(value: number) {
    const clampedValue = Math.max(
      this.processedConfig.minValue,
      Math.min(this.processedConfig.maxValue, value)
    );

    const roundedValue = Math.round(clampedValue * 10) / 10;

    this.humiditySubject.next(roundedValue);
    this.updateStatistics(roundedValue);
    this.updateCurrentColor();
    this.lastUpdate = new Date();
  }

  private updateStatistics(value: number) {
    if (this.readings.length === 0) {
      this.minRecorded = value;
      this.maxRecorded = value;
    } else {
      this.minRecorded = Math.min(this.minRecorded, value);
      this.maxRecorded = Math.max(this.maxRecorded, value);
    }

    this.readings.push(value);
    if (this.readings.length > 50) {
      this.readings.shift();
    }

    const sum = this.readings.reduce((acc, val) => acc + val, 0);
    this.averageHumidity = Math.round((sum / this.readings.length) * 10) / 10;
  }

  // ✅ MÉTODO MEJORADO PARA ACTUALIZACIÓN DE COLOR
  private updateCurrentColor() {
    const current = this.humiditySubject.value;
    const percentage = (current - this.processedConfig.minValue) / 
                      (this.processedConfig.maxValue - this.processedConfig.minValue);
    
    const clampedPercentage = Math.max(0, Math.min(1, percentage));
    
    const newColor = this.interpolateColor(
      this.processedConfig.minColor,
      this.processedConfig.maxColor,
      clampedPercentage
    );
    
    if (this.currentColor !== newColor) {
      this.currentColor = newColor;
      console.log(`🎨 Color actualizado: ${newColor} (${(clampedPercentage * 100).toFixed(1)}%)`);
    }
  }

  // ✅ MÉTODO MEJORADO PARA INTERPOLACIÓN DE COLOR
  private interpolateColor(color1: string, color2: string, factor: number): string {
    factor = Math.max(0, Math.min(1, factor));
    
    if (!color1 || !color2 || !this.isValidColor(color1) || !this.isValidColor(color2)) {
      console.warn('⚠️ Colores inválidos para interpolación');
      return '#4A90E2';
    }
    
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) {
      console.warn('⚠️ Error al convertir colores a RGB');
      return '#4A90E2';
    }

    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);

    const clampedR = Math.max(0, Math.min(255, r));
    const clampedG = Math.max(0, Math.min(255, g));
    const clampedB = Math.max(0, Math.min(255, b));

    return `rgb(${clampedR}, ${clampedG}, ${clampedB})`;
  }

  // ✅ MÉTODO MEJORADO PARA CONVERSIÓN HEX A RGB
  private hexToRgb(hex: string): {r: number, g: number, b: number} | null {
    if (!hex) return null;
    
    const cleanHex = hex.replace('#', '');
    let fullHex = cleanHex;
    
    if (cleanHex.length === 3) {
      fullHex = cleanHex.split('').map(char => char + char).join('');
    }
    
    if (fullHex.length !== 6) {
      return null;
    }
    
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // ✅ MÉTODO PARA VALIDAR COLORES
  private isValidColor(color: string): boolean {
    if (!color) return false;
    
    // Validar formato hexadecimal
    const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (hexPattern.test(color)) return true;
    
    // Validar formato RGB
    const rgbPattern = /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/;
    if (rgbPattern.test(color)) return true;
    
    return false;
  }

  // ✅ MÉTODO PARA VALORES DE ESCALA DINÁMICOS
  public getScaleValue(percentage: number): number {
    const minValue = this.processedConfig.minValue;
    const maxValue = this.processedConfig.maxValue;
    const range = maxValue - minValue;
    const value = minValue + (range * percentage);
    
    // Redondear apropiadamente
    return Math.round(value * 10) / 10;
  }

  // ===== MÉTODOS PÚBLICOS =====

  public setHumidity(value: number) {
    this.updateHumidity(value);
  }

  public forceColorUpdate() {
    this.updateCurrentColor();
  }

  public resetStatistics() {
    const current = this.humiditySubject.value;
    this.minRecorded = current;
    this.maxRecorded = current;
    this.readings = [current];
    this.averageHumidity = current;
  }

  public toggleSimulation() {
    this.processedConfig.autoUpdate = !this.processedConfig.autoUpdate;
    
    if (this.processedConfig.autoUpdate) {
      this.startSimulation();
    } else {
      this.stopSimulation();
    }
  }

  public setRandomHumidity() {
    const range = this.processedConfig.maxValue - this.processedConfig.minValue;
    const randomValue = Math.random() * range + this.processedConfig.minValue;
    this.setHumidity(randomValue);
  }

  // ===== MÉTODOS PARA EL TEMPLATE =====

  public getHumidityStatus(humidity: number | null): string {
    const value = humidity ?? 0;
    const range = this.processedConfig.maxValue - this.processedConfig.minValue;
    const percentage = (value - this.processedConfig.minValue) / range;
    
    if (percentage < 0.2) return 'MUY SECO';
    else if (percentage < 0.4) return 'SECO';
    else if (percentage < 0.6) return 'IDEAL';
    else if (percentage < 0.8) return 'HÚMEDO';
    else return 'MUY HÚMEDO';
  }

  public onRangeChange(event: any) {
    const detail = event.detail;
    const value = typeof detail.value === 'number' ? detail.value : this.processedConfig.currentValue;
    this.setHumidity(value);
  }

  public getProgressDashArray(humidity: number): string {
    const clampedHumidity = Math.max(
      this.processedConfig.minValue, 
      Math.min(this.processedConfig.maxValue, humidity)
    );
    
    const percentage = (clampedHumidity - this.processedConfig.minValue) / 
                      (this.processedConfig.maxValue - this.processedConfig.minValue);
    
    const clampedPercentage = Math.max(0, Math.min(1, percentage));
    
    const radius = 120;
    const totalArcLength = radius * Math.PI;
    
    const visibleLength = totalArcLength * clampedPercentage;
    const invisibleLength = totalArcLength * 2;
    
    return `${visibleLength.toFixed(2)} ${invisibleLength.toFixed(2)}`;
  }
}