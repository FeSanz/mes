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
import {Round, Truncate} from "../../../../models/math.operations";
import { cloudUploadOutline, readerOutline
} from 'ionicons/icons';
import {addIcons} from "ionicons";


@Component({
  selector: 'app-costs',
  templateUrl: './costs.page.html',
  styleUrls: ['./costs.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, FloatLabel, IonButtons, IonMenuButton,
    Select, IonGrid, IonRow, IonCol, IonIcon, IonModal, IonButton, InputText, Button, IonFooter, IconField, InputIcon,
    IonCard, PrimeTemplate, TableModule, Tag]
})
export class CostsPage implements OnInit {

  scrollHeight: string = '550px';
  rowsPerPage: number = 10;
  rowsPerPageOptions: number[] = [5, 10, 20];
  userData: any = {};
  organizationSelected: string | any = '';
  searchValueWO: string = '';

  isModaldispatchOpen : boolean = false;

  workOrdersCost: any = { items: [] };
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
      ItemNumber:data.ItemNumber,
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
      ItemNumber:data.ItemNumber,
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
    addIcons({cloudUploadOutline, readerOutline});
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


  async GetWorkOrders() {
    this.workOrdersCost = { items: [] };

    try {
      await this.alerts.ShowLoading('Obteniendo órdenes de trabajo...');

      const [processResponse, discreteResponse] = await Promise.all([
        this.apiService.GetRequestFusion(this.endPoints.Path('wo_process_cost', this.organizationSelected.Code), false),
        this.apiService.GetRequestFusion(this.endPoints.Path('wo_discrete_cost', this.organizationSelected.Code), false),
      ]);

      // Validar que las respuestas no sean null
      if (!processResponse || !discreteResponse) {
        this.alerts.Warning('Error al obtener datos de órdenes de trabajo');
        return;
      }

      const dataProcess = JSON.parse(processResponse);
      const dataDiscrete = JSON.parse(discreteResponse);

      // Validar transformadores
      if (!this.dataTransformers['P'] || !this.dataTransformers['D']) {
        this.alerts.Warning('Tipo de manufactura no identificada');
        return;
      }

      // Transformar datos
      const processItems = dataProcess.items.map((item: any) => ({
        ...this.dataTransformers['P'](item),
        ManufactureType: 'PROCESOS'
      }));

      const discreteItems = dataDiscrete.items.map((item: any) => ({
        ...this.dataTransformers['D'](item),
        ManufactureType: 'DISCRETA'
      }));

      // Combinar todos los items
      this.workOrdersCost = {
        items: [...processItems, ...discreteItems]
      };
      await this.alerts.HideLoading();

    } catch (error) {
      console.error('Error al obtener órdenes de trabajo:', error);
      await this.alerts.HideLoading();
    }
  }

  OpenDispatch(WOSelected: any) {
    this.isModaldispatchOpen = true;
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
      output.StandardReal = (output.Standard || 0) * (this.totalGlobal|| 0);
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
      material.StandardReal = (material.Standard || 0) * (this.totalGlobal|| 0);

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
      equipment.StandardReal = (equipment.Standard || 0) * (this.totalGlobal|| 0);
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
      labor.StandardReal = (labor.Standard || 0) * (this.totalGlobal|| 0);
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
}
