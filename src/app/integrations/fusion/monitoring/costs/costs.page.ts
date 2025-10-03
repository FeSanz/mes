import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonButton,
  IonButtons,
  IonCard,
  IonCol,
  IonContent,
  IonFooter,
  IonGrid,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonModal,
  IonRow,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { ToggleMenu } from 'src/app/models/design';

import { FloatLabel } from "primeng/floatlabel";
import { Select } from "primeng/select";
import { InputText } from 'primeng/inputtext';
import { Button } from "primeng/button";
import { AlertsService } from "../../../../services/alerts.service";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { PrimeTemplate } from "primeng/api";
import { TableModule } from "primeng/table";
import { Tag } from "primeng/tag";

import { ApiService } from "../../../../services/api.service";
import { EndpointsService } from "../../../../services/endpoints.service";
import { Platform } from "@ionic/angular";
import { HeightTable } from "../../../../models/tables.prime";
import { TruncatePoint } from "../../../../models/math.operations";
import { cloudUploadOutline, readerOutline, menuOutline } from 'ionicons/icons';
import { addIcons } from "ionicons";
import { TodayDateForFusion } from "../../../../models/date.format";
import { Badge } from "primeng/badge";


@Component({
  selector: 'app-costs',
  templateUrl: './costs.page.html',
  styleUrls: ['./costs.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, FloatLabel, IonButtons, IonMenuButton,
    Select, IonGrid, IonRow, IonCol, IonIcon, IonModal, IonButton, InputText, Button, IonFooter, IconField, InputIcon,
    IonCard, PrimeTemplate, TableModule, Tag, Badge]
})
export class CostsPage implements OnInit {

  scrollHeight: string = '550px';
  rowsPerPage: number = 15;
  rowsPerPageOptions: number[] = [5, 15, 20];
  userData: any = {};
  organizationSelected: string | any = '';
  searchValueWO: string = '';

  isModaldispatchOpen: boolean = false;

  workOrdersCost: any = { items: [] };
  selectedWorkOrder: any = {
    WorkOrderNumber: '',
    Operations: { items: [] },
    Materials: { items: [] },
    Resources: { items: [] },
    Outputs: { items: [] }
  };

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
      Resources: data.WorkOrderResource,
      Outputs: { items: [] }
    })
  };

  constructor(private apiService: ApiService,
    private endPoints: EndpointsService,
    private alerts: AlertsService,
    private platform: Platform,) {
    addIcons({ menuOutline, readerOutline, cloudUploadOutline });
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
        ManufactureType: 'P'
      }));

      const discreteItems = dataDiscrete.items.map((item: any) => ({
        ...this.dataTransformers['D'](item),
        ManufactureType: 'D'
      }));

      // Combinar todos los items
      this.workOrdersCost = {
        items: [...processItems, ...discreteItems]
      };

      const filters = this.FilterItemsAndResources();
      const today: string = TodayDateForFusion();

      const [itemsCostResponse, resorcesCostResponse] = await Promise.all([
        this.apiService.GetRequestFusion(this.endPoints.Path('standard_costs',
          'COST_PLANTA1', filters.itemNumberFilter,
          today), false),
        this.apiService.GetRequestFusion(this.endPoints.Path('resource_rates',
          'COST_PLANTA1', filters.resourceCodeFilter,
          today), false),
      ]);


      // Validar que las respuestas no sean null
      if (!itemsCostResponse || !resorcesCostResponse) {
        this.alerts.Warning('Error al obtener datos de órdenes de trabajo');
        return;
      }

      const dataCostItems = JSON.parse(itemsCostResponse);
      const dataCostResources = JSON.parse(resorcesCostResponse);

      this.CombineCostData(dataCostItems, dataCostResources);

      await this.alerts.HideLoading();

    } catch (error) {
      console.error('Error al obtener órdenes de trabajo:', error);
      await this.alerts.HideLoading();
    }
  }

  FilterItemsAndResources(): { itemNumberFilter: string, resourceCodeFilter: string } {
    const itemNumbers = new Set<string>();
    const resourceCodes = new Set<string>();

    // Recorrer todas las órdenes de trabajo
    this.workOrdersCost.items.forEach((workOrder: any) => {

      // Agregar ItemNumber de la orden principal
      if (workOrder.ItemNumber) {
        itemNumbers.add(workOrder.ItemNumber);
      }

      // Extraer ItemNumbers de Materials
      if (workOrder.Materials && workOrder.Materials.items) {
        workOrder.Materials.items.forEach((material: any) => {
          if (material.ItemNumber) {
            itemNumbers.add(material.ItemNumber);
          }
        });
      }

      // Extraer ItemNumbers de Outputs
      if (workOrder.Outputs && workOrder.Outputs.items) {
        workOrder.Outputs.items.forEach((output: any) => {
          if (output.ItemNumber) {
            itemNumbers.add(output.ItemNumber);
          }
        });
      }

      // Extraer ResourceCodes de Resources
      if (workOrder.Resources && workOrder.Resources.items) {
        workOrder.Resources.items.forEach((resource: any) => {
          if (resource.ResourceCode) {
            resourceCodes.add(resource.ResourceCode);
          }
        });
      }
    });

    // Construir cadenas de filtro
    const itemNumberFilter = Array.from(itemNumbers)
      .map(item => `ItemNumber='${item}'`)
      .join(' or ');

    const resourceCodeFilter = Array.from(resourceCodes)
      .map(resource => `ResourceCode='${resource}'`)
      .join(' or ');

    return {
      itemNumberFilter,
      resourceCodeFilter
    };
  }

  // Función para agregar datos de costos dentro de cada elemento
  private CombineCostData(dataCostItems: any, dataCostResources: any) {

    // Combinar datos con workOrdersCost
    this.workOrdersCost.items.forEach((workOrder: any) => {

      // Agregar costos del item principal de la WorkOrder
      const workOrderCosts = dataCostItems?.items?.filter((item: any) =>
        item.ItemNumber === workOrder.ItemNumber) || [];

      if (workOrderCosts.length > 0) {
        workOrder.CostData = {
          items: workOrderCosts.map((cost: any) => ({
            TotalCost: cost.TotalCost || 0,
            CurrencyCode: cost.CurrencyCode || 'MXN',
            EffectiveStartDate: cost.EffectiveStartDate,
            EffectiveEndDate: cost.EffectiveEndDate,
            ScenarioNumber: cost.ScenarioNumber,
            CostBookCode: cost.CostBookCode,
            TotalStandardCost: (workOrder.PlannedQuantity || 0) * (cost.TotalCost || 0)
          }))
        };
      } else {
        workOrder.CostData = { items: [] };
      }

      // Agregar costos de Materials
      if (workOrder.Materials?.items) {
        workOrder.Materials.items.forEach((material: any) => {
          const matchingCosts = dataCostItems?.items?.filter((item: any) =>
            item.ItemNumber === material.ItemNumber) || [];

          if (matchingCosts.length > 0) {
            material.CostData = {
              items: matchingCosts.map((cost: any) => ({
                TotalCost: cost.TotalCost || 0,
                CurrencyCode: cost.CurrencyCode || 'MXN',
                EffectiveStartDate: cost.EffectiveStartDate,
                EffectiveEndDate: cost.EffectiveEndDate,
                ScenarioNumber: cost.ScenarioNumber,
                CostBookCode: cost.CostBookCode,
                TotalStandardCost: (material.Quantity || 0) * (cost.TotalCost || 0)
              }))
            };
          } else {
            material.CostData = { items: [] };
          }
        });
      }

      // Agregar costos de Outputs
      if (workOrder.Outputs?.items) {
        workOrder.Outputs.items.forEach((output: any) => {
          const matchingCosts = dataCostItems?.items?.filter((item: any) =>
            item.ItemNumber === output.ItemNumber) || [];

          if (matchingCosts.length > 0) {
            output.CostData = {
              items: matchingCosts.map((cost: any) => ({
                TotalCost: cost.TotalCost || 0,
                CurrencyCode: cost.CurrencyCode || 'MXN',
                EffectiveStartDate: cost.EffectiveStartDate,
                EffectiveEndDate: cost.EffectiveEndDate,
                ScenarioNumber: cost.ScenarioNumber,
                CostBookCode: cost.CostBookCode,
                TotalStandardCost: (output.OutputQuantity || 0) * (cost.TotalCost || 0)
              }))
            };
          } else {
            output.CostData = { items: [] };
          }
        });
      }

      // Agregar costos de Resources
      if (workOrder.Resources?.items) {
        workOrder.Resources.items.forEach((resource: any) => {
          const matchingRates = dataCostResources?.items?.filter((resourceCost: any) =>
            resourceCost.ResourceCode === resource.ResourceCode) || [];

          if (matchingRates.length > 0) {
            resource.RateData = {
              items: matchingRates.map((rate: any) => ({
                TotalRate: rate.TotalRate || 0,
                CurrencyCode: rate.CurrencyCode || 'MXN',
                EffectiveStartDate: rate.EffectiveStartDate,
                EffectiveEndDate: rate.EffectiveEndDate,
                ScenarioNumber: rate.ScenarioNumber,
                CostBookCode: rate.CostBookCode,
                TotalStandardCost: (resource.RequiredUsage || 0) * (rate.TotalRate || 0)
              }))
            };
          } else {
            resource.RateData = { items: [] };
          }
        });
      }
    });

    this.CalculateWorkOrderCostTotals();

    console.log('Datos combinados con costos:', this.workOrdersCost);
  }

  // Función para calcular totales de costos por WorkOrder
  private CalculateWorkOrderCostTotals() {
    this.workOrdersCost.items.forEach((workOrder: any) => {
      // Calcular costo de BOM Global
      if (workOrder.Materials?.items) {
        let bomCost = 0;
        workOrder.Materials.items.forEach((material: any) => {
          if (material.CostData && material.CostData.items && material.CostData.items.length > 0) {
            bomCost += material.CostData.items[0].TotalStandardCost || 0;
          }
        });
        workOrder.Materials.BOMCost = bomCost;
      }

      // Calcular costo de SALIDAS Global
      if (workOrder.Outputs?.items) {
        let outputCost = 0;
        workOrder.Outputs.items.forEach((output: any) => {
          if (output.CostData && output.CostData.items && output.CostData.items.length > 0) {
            outputCost += output.CostData.items[0].TotalStandardCost || 0;
          }
        });
        workOrder.Outputs.OutputCost = outputCost;
      } else {
        // Inicializar Outputs si no existe (para órdenes discretas)
        workOrder.Outputs = { items: [], OutputCost: 0 };
      }

      // Calcular sotos de RECURSOS Global
      if (workOrder.Resources?.items) {
        let laborCost = 0;
        let equipmentCost = 0;

        workOrder.Resources.items.forEach((resource: any) => {
          if (resource.RateData && resource.RateData.items && resource.RateData.items.length > 0) {
            const totalStandardCost = resource.RateData.items[0].TotalStandardCost || 0;

            if (resource.ResourceType === 'LABOR') {
              laborCost += totalStandardCost;
            } else if (resource.ResourceType === 'EQUIPMENT') {
              equipmentCost += totalStandardCost;
            }
          }
        });

        workOrder.Resources.LaborCost = laborCost;
        workOrder.Resources.EquipmentCost = equipmentCost;
        workOrder.Resources.ResoucesCost = equipmentCost + laborCost;
      }
    });
  }

  OpenWOCostDetail(WOSelected: any) {
    this.selectedWorkOrder = WOSelected || {};
    this.isModaldispatchOpen = true;
  }

  Operations() {
    return this.selectedWorkOrder?.Operations?.items || [];
  }

  OutputsForOperation(operationSequence: number) {
    const outputs = this.selectedWorkOrder?.Outputs?.items || [];
    return outputs.filter((output: any) => output.OperationSequenceNumber === operationSequence);
  }

  MaterialsForOperation(operationSequence: number) {
    const materials = this.selectedWorkOrder?.Materials?.items || [];
    return materials.filter((material: any) => material.OperationSequenceNumber === operationSequence);
  }

  EquipmentResourcesForOperation(operationSequence: number) {
    const resources = this.selectedWorkOrder?.Resources?.items || [];
    return resources.filter((resource: any) =>
      resource.OperationSequenceNumber === operationSequence && resource.ResourceType === "EQUIPMENT"
    );
  }

  LaborResourcesForOperation(operationSequence: number) {
    const resources = this.selectedWorkOrder?.Resources?.items || [];
    return resources.filter((resource: any) =>
      resource.OperationSequenceNumber === operationSequence && resource.ResourceType === "LABOR"
    );
  }

  // Función para calcular costo total de materiales por operación
  GetMaterialsCostByOperation(operationSequence: number): number {
    const materials = this.MaterialsForOperation(operationSequence);
    let totalCost = 0;

    materials.forEach((material: any) => {
      if (material.CostData?.items && material.CostData.items.length > 0) {
        totalCost += material.CostData.items[0].TotalStandardCost || 0;
      }
    });

    return totalCost;
  }

  // Función para calcular costo total de equipos por operación
  GetEquipmentCostByOperation(operationSequence: number): number {
    const equipment = this.EquipmentResourcesForOperation(operationSequence);
    let totalCost = 0;

    equipment.forEach((equip: any) => {
      if (equip.RateData?.items && equip.RateData.items.length > 0) {
        totalCost += equip.RateData.items[0].TotalStandardCost || 0;
      }
    });

    return totalCost;
  }

  // Función para calcular costo total de personal por operación
  GetLaborCostByOperation(operationSequence: number): number {
    const labor = this.LaborResourcesForOperation(operationSequence);
    let totalCost = 0;

    labor.forEach((lab: any) => {
      if (lab.RateData?.items && lab.RateData.items.length > 0) {
        totalCost += lab.RateData.items[0].TotalStandardCost || 0;
      }
    });

    return totalCost;
  }

  // Función para calcular costo total de outputs por operación
  GetOutputsCostByOperation(operationSequence: number): number {
    if (!this.selectedWorkOrder?.Outputs?.items) {
      return 0;
    }
    const outputs = this.OutputsForOperation(operationSequence);
    let totalCost = 0;

    outputs.forEach((output: any) => {
      if (output.CostData?.items && output.CostData.items.length > 0) {
        totalCost += output.CostData.items[0].TotalStandardCost || 0;
      }
    });

    return totalCost;
  }

  // Función para calcular costo total de recursos (equipos + personal) por operación
  GetResourcesCostByOperation(operationSequence: number): number {
    return this.GetEquipmentCostByOperation(operationSequence) +
      this.GetLaborCostByOperation(operationSequence);
  }

  // Función para calcular costo total de operación (materiales + recursos)
  GetTotalOperationCost(operationSequence: number): number {
    return this.GetMaterialsCostByOperation(operationSequence) +
      this.GetResourcesCostByOperation(operationSequence);
  }

  OnFilterGlobal(event: Event, table: any) {
    const target = event.target as HTMLInputElement;
    table.filterGlobal(target.value, 'contains');
  }

  ClearWorkOrders(table: any) {
    table.clear();
    this.searchValueWO = '';
  }

  DifferenceCostSeverity(saldo: any) {
    if (saldo === 0) return 'warn';
    else if (saldo < 0) return 'danger';
    else return 'success';
  }

  MfgType(mfg: any) {
    if (mfg === 'P') return 'info';
    else if (mfg === 'D') return 'warn';
    else return 'contrast';
  }


  //protected readonly Truncate = Truncate;
  protected readonly TruncatePoint = TruncatePoint;
  protected readonly ToggleMenu = ToggleMenu;
}
