import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonCol,
  IonContent,
  IonFab,
  IonFabButton,
  IonFooter,
  IonGrid,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonMenuButton,
  IonModal,
  IonRow,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';

import {FloatLabel} from "primeng/floatlabel";
import {Select} from "primeng/select";
import { Toast } from 'primeng/toast';
import {InputText, InputTextModule} from 'primeng/inputtext';
import {Button} from "primeng/button";
import {Divider} from "primeng/divider";
import {Card} from "primeng/card";
import {Dialog} from "primeng/dialog";
import {AlertsService} from "../../../../services/alerts.service";

@Component({
  selector: 'app-transaction',
  templateUrl: './transaction.page.html',
  styleUrls: ['./transaction.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, FloatLabel, IonButtons, IonMenuButton,
    Select, IonGrid, IonRow, IonCol, Toast, IonFab, IonFabButton, IonIcon, IonModal, IonButton, IonInput, IonItem, InputText, IonLabel, Button, Divider, Card, Dialog, IonFooter]
})
export class TransactionPage implements OnInit {

  isModaldispatchOpen : boolean = false;

  operaciones: any = [
    {
      numero: 30,
      faltante: 100,
      completo: 0,
      meta: 100,
      unidad: 'cj',
      materiales: [
        {
          codigo: 'JU19710 BL',
          disponible: 5000,
          requerido: 8.6,
          unidad: 'kg',
          meta: 8.6
        },
        {
          codigo: 'PPC-15217',
          disponible: 5000,
          requerido: 0.154,
          unidad: 'm',
          meta: 0.154
        }
      ],
      recursos: [
        {
          nombre: 'ENCSJ6',
          requerido: 0.835,
          unidad: 'h',
          meta: 0.835
        },
        {
          nombre: 'LIDER PLANTILLA',
          requerido: 0.835,
          unidad: 'h',
          meta: 0.835
        }
      ],
      salidas: []
    },
    {
      numero: 50,
      faltante: 100,
      completo: 0,
      meta: 100,
      unidad: 'cj',
      materiales: [
        {
          codigo: 'CWGRWOW-10',
          disponible: 5000,
          requerido: 10,
          unidad: 'pza',
          meta: 10
        }
      ],
      recursos: [
        {
          nombre: 'AUXILIAR GENERAL A',
          requerido: 0.835,
          unidad: 'h',
          meta: 0.835
        },
        {
          nombre: 'ENCSJ6-EMP',
          requerido: 0.835,
          unidad: 'h',
          meta: 0.835
        }
      ],
      salidas: [
        {
          codigo: 'JU197G0.BL C',
          cantidad: 10,
          unidad: 'cj'
        }
      ]
    }
  ];

  constructor(private alerts: AlertsService) { }

  ngOnInit() {
    console.log('ngOnInit');
  }

  OpenDispatch() {
    this.isModaldispatchOpen = true;
    this.alerts.Success('Dados actualizado');
  }

  onCloseModal() {
    this.isModaldispatchOpen = false;
  }

  onSaveDispatch() {
    // Implementar lógica de guardado
    console.log('Guardando despacho...');
    this.isModaldispatchOpen = false;
  }


  trackByOperacion(index: number, operacion: any): number {
    return operacion.numero;
  }

  trackByMaterial(index: number, material: any): string {
    return material.codigo;
  }

  trackByRecurso(index: number, recurso: any): string {
    return recurso.nombre;
  }

  trackBySalida(index: number, salida: any): string {
    return salida.codigo;
  }

}
