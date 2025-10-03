import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton, IonButtons, IonCard, IonCol, IonContent, IonFab, IonFabButton, IonFooter, IonGrid, IonHeader,
  IonIcon, IonInput, IonItem, IonLabel, IonMenuButton, IonModal, IonRow, IonTitle, IonToolbar
} from '@ionic/angular/standalone';

import { FloatLabel } from "primeng/floatlabel";
import { Select } from "primeng/select";
import { Toast } from 'primeng/toast';
import { InputText, InputTextModule } from 'primeng/inputtext';
import { Button } from "primeng/button";
import { Divider } from "primeng/divider";
import { Card } from "primeng/card";
import { Dialog } from "primeng/dialog";
import { AlertsService } from "../../../../services/alerts.service";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { PrimeTemplate } from "primeng/api";
import { ProgressBar } from "primeng/progressbar";
import { Slider } from "primeng/slider";
import { TableModule } from "primeng/table";
import { Tag } from "primeng/tag";
import { DialogModule } from 'primeng/dialog';

import { ApiService } from "../../../../services/api.service";
import { EndpointsService } from "../../../../services/endpoints.service";
import { Platform } from "@ionic/angular";
import { HeightTable } from "../../../../models/tables.prime";
import { Round, Truncate } from "../../../../models/math.operations";
import {
  cloudUploadOutline, menuOutline } from 'ionicons/icons';
import { addIcons } from "ionicons";
import { ToggleMenu } from 'src/app/models/design';

@Component({
  selector: 'app-transaction',
  templateUrl: './transaction.page.html',
  styleUrls: ['./transaction.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, FloatLabel, IonButtons, IonMenuButton,
    Select, IonGrid, IonRow, IonCol, IonIcon, IonModal, IonButton, InputText, Button, IonFooter, IconField, InputIcon,
    IonCard, PrimeTemplate, TableModule, Tag, Dialog, DialogModule]
})
export class TransactionPage implements OnInit {
  private resizeTimeout: any;
  modalSize: string = '';

  scrollHeight: string = '550px';
  rowsPerPage: number = 10;
  rowsPerPageOptions: number[] = [5, 10, 20];
  userData: any = {};
  organizationSelected: string | any = '';
  searchValueWO: string = '';

  isModaldispatchOpen: boolean = false;

  workOrdersToDispatch: any = { items: [] };
  selectedWorkOrder: any = {
    WorkOrderNumber: '',
    Operations: { items: [] },
    Materials: { items: [] },
    Resources: { items: [] },
    Outputs: { items: [] }
  };
  fusionOriginalData: any = {};

  completeGlobal: number = 0;
  scrapGlobal: number = 0;
  rejectGlobal: number = 0;

  totalGlobal: number = 0;

  private dataTransformers: { [key: string]: (data: any) => any } = {
    'P': (data: any) => ({
      WorkOrderId: data.WorkOrderId,
      WorkOrderNumber: data.WorkOrderNumber,
      WorkDefinitionId: data.WorkDefinitionId,
      ItemId: data.PrimaryProductId,
      ItemNumber: data.ItemNumber,
      Description: data.Description,
      UoM: data.PrimaryProductUOMCode,
      PlannedQuantity: data.PrimaryProductQuantity,
      CompletedQuantity: data.CompletedQuantity,
      Scrap: data.ScrappedQuantity,
      Reject: data.RejectedQuantity,
      StartDate: data.PlannedStartDate,
      CompletionDate: data.PlannedCompletionDate,
      StatusCode: data.WorkOrderSystemStatusCode,
      Operations: data.Operation,
      Materials: data.ProcessWorkOrderMaterial,
      Resources: data.ProcessWorkOrderResource,
      Outputs: data.ProcessWorkOrderOutput
    }),

    'D': (data: any) => ({
      WorkOrderId: data.WorkOrderId,
      WorkOrderNumber: data.WorkOrderNumber,
      WorkDefinitionId: data.WorkDefinitionId,
      ItemId: data.InventoryItemId,
      ItemNumber: data.ItemNumber,
      Description: data.Description,
      UoM: data.UOMCode,
      PlannedQuantity: data.PlannedStartQuantity,
      CompletedQuantity: data.CompletedQuantity,
      Scrap: data.ScrappedQuantity,
      Reject: data.RejectedQuantity,
      StartDate: data.PlannedStartDate,
      CompletionDate: data.PlannedCompletionDate,
      StatusCode: data.WorkOrderSystemStatusCode,
      Operations: data.WorkOrderOperation,
      Materials: data.WorkOrderMaterial,
      Resources: data.WorkOrderResource
    })
  };

  constructor(private apiService: ApiService,
    private endPoints: EndpointsService,
    private alerts: AlertsService,
    private platform: Platform,) {
    addIcons({menuOutline,cloudUploadOutline});
  }

  ngOnInit() {
    this.userData = JSON.parse(String(localStorage.getItem("userData")));
    if (this.userData && this.userData.Company && this.userData.Company.Organizations) {

      const organizations = this.userData.Company.Organizations;

      // Validar si hay organizaciones
      if (organizations && Array.isArray(organizations) && organizations.length > 0) {
        const sortedOrganizations = organizations.sort((a, b) => a.OrganizationId - b.OrganizationId);
        this.organizationSelected = sortedOrganizations[0];
        this.GetWorkOrders();
      } else {
        this.alerts.Warning("No se encontraron organizaciones");
      }
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.UpdateScrollHeight();

    if (this.isModaldispatchOpen) {
      // Esperar 200ms después del último resize para imprimir
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.logModalSize();
      }, 200);
    }
  }

  private UpdateScrollHeight() {
    this.scrollHeight = HeightTable(this.platform.height());
  }


  GetWorkOrders() {
    this.workOrdersToDispatch = { items: [] };
    this.apiService.GetRequestRender(`dispatchPending/${this.organizationSelected.OrganizationId}`).then((response: any) => {

      if (response.items && Array.isArray(response.items)) {
        this.workOrdersToDispatch = response;
      }

    }).catch(error => {
      console.error('Error al obtener OTs:', error);
    });
  }

  OpenDispatch(WOSelected: any) {
    this.GetWorkOrderFusion(WOSelected);
    this.isModaldispatchOpen = true;

    this.logModalSize();
  }

  private logModalSize() {
    const contentPart = document.querySelector('ion-modal.dispach-modal')?.shadowRoot?.querySelector('[part="content"]');
    if (contentPart) {
      const rect = contentPart.getBoundingClientRect();
      this.modalSize = `Modal: ${Truncate(rect.width)} x ${Truncate(rect.height)} | Viewport: ${window.innerWidth} (${((rect.width / window.innerWidth) * 100).toFixed(2)}%)`;
    }
  }

  GetWorkOrderFusion(WOSelectedData: any) {
    this.completeGlobal = parseFloat(WOSelectedData.DispatchPending) || 0;
    this.scrapGlobal = parseFloat(WOSelectedData.ScrapPending) || 0;
    this.rejectGlobal = parseFloat(WOSelectedData.RejectPending) || 0;

    this.totalGlobal = this.completeGlobal + this.scrapGlobal + this.rejectGlobal;

    const path = WOSelectedData.Type === 'P' ? 'wo_process_dispatch' : 'wo_discrete_dispatch';
    this.apiService.GetRequestFusion(this.endPoints.Path(path, this.organizationSelected.Code, WOSelectedData.WorkOrderNumber)).then(async (response: any) => {
      const data = JSON.parse(response);
      this.fusionOriginalData = JSON.parse(JSON.stringify(data)); // Guardar estructura original

      //Para manufactura por PROCESOS O DISCRETA
      const transformer = this.dataTransformers[WOSelectedData.Type];
      if (!transformer) {
        this.alerts.Warning('Tipo de manufactura no identificada');
        return;
      }

      // Transformar y asignar datos
      const restructuredData = data.items.map((item: any) => transformer(item));

      this.selectedWorkOrder = restructuredData[0] || {};
    });
  }

  OnSaveDispatch() {
    // Implementar lógica de guardado
    console.log('Guardando despacho...');
    this.isModaldispatchOpen = false;
  }

  Operations() {
    return this.selectedWorkOrder?.Operations?.items || [];
  }

  //Metodo helper para obtener PlannedQuantity de forma segura
  private getPlannedQuantity(): number {
    return this.selectedWorkOrder?.PlannedQuantity || 1;
  }

  OutputsForOperation(operationSequence: number) {
    const outputs = this.selectedWorkOrder?.Outputs?.items || [];
    const filtered = outputs.filter((output: any) => output.OperationSequenceNumber === operationSequence);
    const plannedQuantity = this.getPlannedQuantity();

    // Agregar campo Standard a cada output
    filtered.forEach((output: any) => {
      output.Standard = (output.OutputQuantity || 0) / plannedQuantity;
      output.StandardReal = (output.Standard || 0) * (this.totalGlobal || 0);
    });

    return filtered;
  }

  MaterialsForOperation(operationSequence: number) {
    const materials = this.selectedWorkOrder?.Materials?.items || [];
    const filtered = materials.filter((material: any) => material.OperationSequenceNumber === operationSequence);
    const plannedQuantity = this.getPlannedQuantity();

    // Agregar campo Standard a cada material
    filtered.forEach((material: any) => {
      material.Standard = (material.Quantity || 0) / plannedQuantity;
      material.StandardReal = (material.Standard || 0) * (this.totalGlobal || 0);

      //material.QuantityOnhand = material.QuantityOnhand || 0;
      //material.AvailableToTransact = material.AvailableToTransact || 0;
      //material.OnHandMessage = material.OnHandMessage || 'Cargando...';

      //this.LoadMaterialOnHand(material);
    });

    return filtered;
  }

  private async LoadMaterialOnHand(material: any) {
    const payload = {
      OrganizationCode: this.organizationSelected.Code,
      ItemNumber: material.ItemNumber,
      SupplySubinventory: material.SupplySubinventory
    };

    try {
      const response: any = await this.apiService.PostRequestFusion('availableQuantityDetails', payload);

      if (response.ReturnStatus === 'SUCCESS') {
        material.QuantityOnhand = response.QuantityOnhand;
        material.AvailableToTransact = response.AvailableToTransact;
        material.OnHandMessage = response.ReturnStatus;
      } else {
        material.QuantityOnhand = response.QuantityOnhand || 0;
        material.AvailableToTransact = response.AvailableToTransact || 0;
        material.OnHandMessage = response.ReturnStatus;
      }
    } catch (error: any) {
      material.QuantityOnhand = 0;
      material.AvailableToTransact = 0;
      material.OnHandMessage = `Error: ${error.message || error}`;
    }
  }

  EquipmentResourcesForOperation(operationSequence: number) {
    const resources = this.selectedWorkOrder?.Resources?.items || [];
    const filtered = resources.filter((resource: any) =>
      resource.OperationSequenceNumber === operationSequence && resource.ResourceType === "EQUIPMENT"
    );
    const plannedQuantity = this.getPlannedQuantity();

    // Agregar campo Standard a cada equipment
    filtered.forEach((equipment: any) => {
      equipment.Standard = (equipment.RequiredUsage || 0) / plannedQuantity;
      equipment.StandardReal = (equipment.Standard || 0) * (this.totalGlobal || 0);
    });

    return filtered;
  }

  LaborResourcesForOperation(operationSequence: number) {
    const resources = this.selectedWorkOrder?.Resources?.items || [];
    const filtered = resources.filter((resource: any) =>
      resource.OperationSequenceNumber === operationSequence && resource.ResourceType === "LABOR"
    );
    const plannedQuantity = this.getPlannedQuantity();

    // Agregar campo Standard a cada labor
    filtered.forEach((labor: any) => {
      labor.Standard = (labor.RequiredUsage || 0) / plannedQuantity;
      labor.StandardReal = (labor.Standard || 0) * (this.totalGlobal || 0);
    });

    return filtered;
  }

  OnFilterGlobal(event: Event, table: any) {
    const target = event.target as HTMLInputElement;
    table.filterGlobal(target.value, 'contains');
  }

  ClearWorkOrders(table: any) {
    table.clear();
    this.searchValueWO = '';
  }

  protected readonly Truncate = Truncate;
  protected readonly ToggleMenu = ToggleMenu;
}
