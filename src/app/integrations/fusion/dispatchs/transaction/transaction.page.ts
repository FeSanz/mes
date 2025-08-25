import {Component, HostListener, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton, IonButtons, IonCard, IonCol, IonContent, IonFab, IonFabButton, IonFooter, IonGrid, IonHeader,
  IonIcon, IonInput, IonItem, IonLabel, IonMenuButton, IonModal, IonRow, IonTitle, IonToolbar
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
import {IconField} from "primeng/iconfield";
import {InputIcon} from "primeng/inputicon";
import {PrimeTemplate} from "primeng/api";
import {ProgressBar} from "primeng/progressbar";
import {Slider} from "primeng/slider";
import {TableModule} from "primeng/table";
import {Tag} from "primeng/tag";

import {ApiService} from "../../../../services/api.service";
import {EndpointsService} from "../../../../services/endpoints.service";
import {Platform} from "@ionic/angular";
import {HeightTable} from "../../../../models/tables.prime";
import { cloudUploadOutline
} from 'ionicons/icons';
import {addIcons} from "ionicons";

@Component({
  selector: 'app-transaction',
  templateUrl: './transaction.page.html',
  styleUrls: ['./transaction.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, FloatLabel, IonButtons, IonMenuButton,
    Select, IonGrid, IonRow, IonCol, Toast, IonFab, IonFabButton, IonIcon, IonModal, IonButton, IonInput, IonItem, InputText, IonLabel, Button, Divider, Card, Dialog, IonFooter, IconField, InputIcon, IonCard, PrimeTemplate, ProgressBar, Slider, TableModule, Tag]
})
export class TransactionPage implements OnInit {
  scrollHeight: string = '550px';
  rowsPerPage: number = 10;
  rowsPerPageOptions: number[] = [5, 10, 20];
  userData: any = {};
  organizationSelected: string | any = '';
  searchValueWO: string = '';

  isModaldispatchOpen : boolean = false;

  selectedWorkOrder: any = null;

  workOrder: any = [
    {
      WorkOrderId: 1,
      WorkOrderNumber: "4461",
      PrimaryProductQuantity: 360,
      CompletedQuantity: 0,
      ScrappedQuantity: 0,
      RejectedQuantity: 0,
      UOMCode: "cj",
      WorkDefinitionId: 14726,
      Operation: {
        items: [
          {
            OperationSequenceNumber: 10,
            OperationName: "MEZCLADO",
            ReadyQuantity: 0,
            CompletedQuantity: 92,
            ScrappedQuantity: null,
            RejectedQuantity: null,
            UOMCode: "pza"
          },
          {
            OperationSequenceNumber: 20,
            OperationName: "EMPAQUE",
            ReadyQuantity: 408,
            CompletedQuantity: 92,
            ScrappedQuantity: null,
            RejectedQuantity: null,
            UOMCode: "cj"
          }
        ]
      },
      Output: {
        items: [
          {
            OperationSequenceNumber: 10,
            OutputSequenceNumber: 10,
            ItemNumber: "KSPSNG",
            OutputType: "PRODUCT",
            OutputQuantity: 360000,
            CompletedQuantity: 0,
            UOMCode: "pza",
            PrimaryFlag: false,
            ComplSubinventoryCode: "IPRHD"
          },
          {
            OperationSequenceNumber: 20,
            OutputSequenceNumber: 10,
            ItemNumber: "KSPSNG03",
            OutputType: "PRODUCT",
            OutputQuantity: 360,
            CompletedQuantity: 0,
            UOMCode: "cj",
            PrimaryFlag: true,
            ComplSubinventoryCode: "PT"
          }
        ]
      },
      Material: {
        items: [
          {
            OperationSequenceNumber: 10,
            MaterialSequenceNumber: 10,
            ItemNumber: "PGNEG-001",
            SupplySubinventory: "MP",
            Quantity: 15.9984,
            UOMCode: "kg"
          },
          {
            OperationSequenceNumber: 10,
            MaterialSequenceNumber: 20,
            ItemNumber: "PS-AI BL-MO",
            SupplySubinventory: "MP",
            Quantity: 479.952,
            UOMCode: "kg"
          },
          {
            OperationSequenceNumber: 10,
            MaterialSequenceNumber: 30,
            ItemNumber: "PS-CR-MO",
            SupplySubinventory: "MP",
            Quantity: 1103.8896,
            UOMCode: "kg"
          },
          {
            OperationSequenceNumber: 20,
            MaterialSequenceNumber: 10,
            ItemNumber: "CWGRWOW-12",
            SupplySubinventory: "IPRHD",
            Quantity: 360,
            UOMCode: "pza"
          },
          {
            OperationSequenceNumber: 20,
            MaterialSequenceNumber: 20,
            ItemNumber: "BWCUWOW-03-4",
            SupplySubinventory: "IPRHD",
            Quantity: 14400,
            UOMCode: "pza"
          },
        ]
      },
      Resource: {
        Items: [
          {
            OperationSequenceNumber: 10,
            ResourceSequenceNumber: 10,
            ResourceCode: "MF-H225D",
            ResourceName: "H225D",
            ResourceType: "EQUIPMENT",
            RequiredUsage: 23.436,
            UOMCode: "h"
          },
          {

            OperationSequenceNumber: 10,
            ResourceSequenceNumber: 20,
            ResourceCode: "MF-MOL-KUSO32A",
            ResourceName: "KUSO32A",
            ResourceType: "EQUIPMENT",
            RequiredUsage: 23.436,
            UOMCode: "h"
          },
          {

            OperationSequenceNumber: 10,
            ResourceSequenceNumber: 30,
            ResourceCode: "MF-LIP",
            ResourceName: "LIDER PLANTILLA",
            ResourceType: "LABOR",
            RequiredUsage: 23.436,
            UOMCode: "h"
          },
          {
            OperationSequenceNumber: 20,
            ResourceSequenceNumber: 40,
            ResourceCode: "MF-H225D-EMP",
            ResourceName: "H225D-EMP",
            ResourceType: "EQUIPMENT",
            RequiredUsage: 23.436,
            UOMCode: "h"
          },
          {
            OperationSequenceNumber: 20,
            ResourceSequenceNumber: 50,
            ResourceCode: "MF-AG A",
            ResourceName: "AUXILIAR GENERAL A",
            ResourceType: "LABOR",
            RequiredUsage: 23.436,
            UOMCode: "h"
          }
        ]
      }
    }
  ];

  workOrdersToDispatch: any = { items: [] };

  constructor(private apiService: ApiService,
              private endPoints: EndpointsService,
              private alerts: AlertsService,
              private platform: Platform,) {
    addIcons({cloudUploadOutline});
  }

  ngOnInit() {
    this.userData = JSON.parse(String(localStorage.getItem("userData")));
    console.log(this.userData);
    if (this.userData && this.userData.Company && this.userData.Company.Organizations) {

      const organizations = this.userData.Company.Organizations;

      // Validar si hay organizaciones
      if (organizations && Array.isArray(organizations) && organizations.length > 0) {
        const sortedOrganizations = organizations.sort((a, b) => a.OrganizationId - b.OrganizationId);
        this.organizationSelected = sortedOrganizations[0];
        this.GetWorkOrders();
      }else{
        this.alerts.Warning("No se encontraron organizaciones");
      }
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.UpdateScrollHeight();
  }

  private UpdateScrollHeight() {
    this.scrollHeight = HeightTable(this.platform.height());
  }


  GetWorkOrders(){
    this.workOrdersToDispatch = { items: [] };
    this.apiService.GetRequestRender(`dispatchPending/${this.organizationSelected.OrganizationId}`).then((response: any) => {
      this.workOrdersToDispatch = response;

      if (this.workOrdersToDispatch.items && Array.isArray(this.workOrdersToDispatch.items)) {
        console.log(this.workOrdersToDispatch);
      }

    }).catch(error => {
      console.error('Error al obtener OTs:', error);
    });
  }

  OpenDispatch(woSelected: any) {
    this.alerts.Contrast(woSelected.WorkOrderNumber);
    this.selectedWorkOrder = this.workOrder[0];
    this.isModaldispatchOpen = true;
  }

  GetWorkOrderFusion()
  {

  }

  onCloseModal() {
    this.isModaldispatchOpen = false;
  }

  onSaveDispatch() {
    // Implementar lógica de guardado
    console.log('Guardando despacho...');
    this.isModaldispatchOpen = false;
  }

  // Obtiene las operaciones de la orden de trabajo seleccionada
  getOperations() {
    return this.selectedWorkOrder?.Operation?.items || [];
  }

  // Obtiene las salidas para una operación específica
  getOutputsForOperation(operationSequence: number) {
    return this.selectedWorkOrder?.Output?.items?.filter(
      (output: any) => output.OperationSequenceNumber === operationSequence
    ) || [];
  }

  // Obtiene los materiales para una operación específica
  getMaterialsForOperation(operationSequence: number) {
    return this.selectedWorkOrder?.Material?.items?.filter(
      (material: any) => material.OperationSequenceNumber === operationSequence
    ) || [];
  }

  // Obtiene los recursos de equipo para una operación específica
  getEquipmentResourcesForOperation(operationSequence: number) {
    return this.selectedWorkOrder?.Resource?.Items?.filter(
      (resource: any) =>
        resource.OperationSequenceNumber === operationSequence &&
        resource.ResourceType === "EQUIPMENT"
    ) || [];
  }

  // Obtiene los recursos de personal para una operación específica
  getLaborResourcesForOperation(operationSequence: number) {
    return this.selectedWorkOrder?.Resource?.Items?.filter(
      (resource: any) =>
        resource.OperationSequenceNumber === operationSequence &&
        resource.ResourceType === "LABOR"
    ) || [];
  }

  OnFilterGlobal(event: Event, table: any) {
    const target = event.target as HTMLInputElement;
    table.filterGlobal(target.value, 'contains');
  }

  ClearWorkOrders(table: any) {
    table.clear();
    this.searchValueWO = '';
  }
}
