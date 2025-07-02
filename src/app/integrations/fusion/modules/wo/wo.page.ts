import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton, IonTitle,
  IonToolbar } from '@ionic/angular/standalone';

import {ApiService} from "../../../../services/api.service";
import {EndpointsService} from "../../../../services/endpoints.service";
import {AlertsService} from "../../../../services/alerts.service";
import {HeightTable} from "../../../../models/tables.prime";
import {Iso8601ToCDMX, FormatForDisplayUser} from "../../../../models/date.format";
import {addIcons} from "ionicons";

import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { FloatLabel } from "primeng/floatlabel"

import { closeOutline, cloudOutline, chevronDownOutline, arrowForward, trash, serverOutline } from 'ionicons/icons';


@Component({
  selector: 'app-wo',
  templateUrl: './wo.page.html',
  styleUrls: ['./wo.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonMenuButton,
    IonButton, IonIcon,
    TableModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule, TagModule, DropdownModule,
    MultiSelectModule, Select, FloatLabel]
})
export class WoPage implements OnInit, AfterViewInit, OnDestroy{

  @ViewChild('regionContainer', { static: false }) regionContainer!: ElementRef;
  private resizeObserver!: ResizeObserver;
  scrollHeight: string = '550px';
  rowsPerPage: number = 50;
  rowsPerPageOptions: number[] = [10, 25, 50];

  fusionOriginalData: any = {};
  fusionData: any = {};
  dbData: any = {};

  dbOrganizations: any = {};
  organizationSelected: string | any = '';

  selectedItemsFusion: any[] = [];
  selectedItemsDB: any[] = [];

  searchValueFusion: string = '';
  searchValueDB: string = '';

  private dataTransformers: { [key: string]: (data: any) => any } = {
    'PROCESOS': (data: any) => ({
      WorkOrderId: data.WorkOrderId,
      WorkOrderNumber: data.WorkOrderNumber,
      WorkDefinitionId: data.WorkDefinitionId,
      ItemId: data.PrimaryProductId,
      ItemNumber:data.ItemNumber,
      Description: data.Description,
      UoM: data.PrimaryProductUOMCode,
      Resources: data.ProcessWorkOrderResource,
      PlannedQuantity: data.PrimaryProductQuantity,
      CompletedQuantity: data.CompletedQuantity,
      StartDate: Iso8601ToCDMX(data.PlannedStartDate),
      CompletionDate: Iso8601ToCDMX(data.PlannedCompletionDate)
    }),

    'DISCRETA': (data: any) => ({
      WorkOrderId: data.WorkOrderId,
      WorkOrderNumber: data.WorkOrderNumber,
      WorkDefinitionId: data.WorkDefinitionId,
      ItemId: data.InventoryItemId,
      ItemNumber:data.ItemNumber,
      Description: data.Description,
      UoM: data.UOMCode,
      Resources: data.WorkOrderResource,
      PlannedQuantity: data.PlannedStartQuantity,
      CompletedQuantity: data.CompletedQuantity,
      StartDate: Iso8601ToCDMX(data.PlannedStartDate),
      CompletionDate: Iso8601ToCDMX(data.PlannedCompletionDate)
    })
  };


  constructor(private apiService: ApiService,
              private endPoints: EndpointsService,
              private alerts: AlertsService) {
    addIcons({
      closeOutline, cloudOutline, chevronDownOutline, arrowForward, trash, serverOutline
    });
  }


  ngOnInit() {
    this.dbOrganizations = JSON.parse(String(localStorage.getItem("userData")));
  }

  ngAfterViewInit() {
    this.ObserveResize();
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  ObserveResize() {
    if (this.regionContainer) {
      this.resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          this.scrollHeight = HeightTable(entry.contentRect.height);
        }
      });

      this.resizeObserver.observe(this.regionContainer.nativeElement);
    }
  }

  GetScrollHeight(): string {
    return this.scrollHeight;
  }

  GetOrganizationsRender(){
    this.apiService.GetRequestRender(this.endPoints.Render('organizations')).then((response: any) => {
      this.dbOrganizations = response;
    });
  }

  async OnOrganizationSelected() {
    if(this.organizationSelected) {
      let clause = `workOrders/${this.organizationSelected.OrganizationId}`;
      this.apiService.GetRequestRender(this.endPoints.Render(clause)).then((response: any) => {
        response.totalResults == 0 && this.alerts.Warning(response.message);
        this.dbData = response;

        const path = this.organizationSelected.WorkMethod === 'PROCESOS' ? 'wo_process' : 'wo_discrete';
        this.apiService.GetRequestFusion(this.endPoints.Path(path, this.organizationSelected.Code)).then(async (response: any) => {
          const data = JSON.parse(response);

          if (this.organizationSelected.WorkMethod === 'MIXTA') {
            this.MixedManufacturingCase();
          }

          //Para manufactura por PROCESOS O DISCRETA
          const transformer = this.dataTransformers[this.organizationSelected.WorkMethod];
          if (!transformer) {
            this.alerts.Warning('Tipo de manufactura no identificado');
            return;
          }

          // Transformar y asignar datos
          const restructuredData = data.items.map((item: any) => transformer(item));

          const objRestructured = { items: restructuredData };

          //Obtener IDs de maquinas y articulos render
          const matchMachines = await this.apiService.PostRequestRender(this.endPoints.Render('workOrdersMachines'), this.PayloadWOMachines(objRestructured));
          const matchItems = await this.apiService.PostRequestRender(this.endPoints.Render('workOrdersItems'), this.PayloadItems(objRestructured));

          //Mezclar datos de IDs de render con datos de fusion
          const  mergeData = this.MergeWOData(restructuredData, matchMachines, matchItems);
          this.fusionData = {
            items: mergeData,
            totalResults: data.totalResults,
            count: data.count,
            hasMore: false,
          };

          console.log(this.fusionData);
          this.fusionOriginalData = JSON.parse(JSON.stringify(this.fusionData)); // Guardar estructura original

          this.FilterRegisteredItems();
        });
      });
    }
  }

  PayloadWOMachines(WO_Resources: any)
  {
    const payloadMachine: any[] = [];

    WO_Resources.items.forEach((i: any) => {
      // Para cada OT, recorrer sus recursos
      i.Resources.items.forEach((r: any) => {
        payloadMachine.push({
          MachineCode: r.ResourceCode,
          WorkOrderNumber: i.WorkOrderNumber
        });
      });
    });

    return { items: payloadMachine };
  }

  PayloadItems(WO_Items: any)
  {
    const payloadItems: any[] = [];

    WO_Items.items.forEach((i: any) => {
      payloadItems.push({
        Number: i.ItemNumber,
        Description: i.Description,
        UoM: i.UoM,
        WorkOrderNumber: i.WorkOrderNumber
      });
    });

    return {
      CompanyId: this.dbOrganizations.Company.CompanyId,
      items: payloadItems
    };
  }

  // Mezclar datos de Fusion y Render
  private MergeWOData(restructuredData: any[], matchMachines: any, matchItems: any): any[] {
    if (!restructuredData?.length) return [];
    return restructuredData.map((item: any) => {
      // Buscar la máquina correspondiente por OT
      const machine = matchMachines.items?.find((m: any) => m.workOrderNumber === item.WorkOrderNumber);
      // Buscar el item correspondiente por OT
      const product = matchItems.items?.find((it: any) => it.WorkOrderNumber === item.WorkOrderNumber);

      return {
        WorkOrderId: item.WorkOrderId,
        WorkOrderNumber:  item.WorkOrderNumber,
        WorkDefinitionId: item.WorkDefinitionId,
        ItemId: product ? parseInt(product.ItemId) : null,
        ItemNumber: item.ItemNumber,
        Description: item.Description,
        UoM: item.UOM,
        ResourceId: machine ? parseInt(machine.MachineId) : null,
        ResourceCode: machine ? machine.Code : "*****",
        PlannedQuantity: item.PlannedQuantity,
        CompletedQuantity: item.CompletedQuantity,
        StartDate: item.StartDate,
        CompletionDate: item.CompletionDate,
      };
    });
  }


  async MixedManufacturingCase()
  {
    let paths: string[] =  ['wo_process', 'wo_discrete'];
    let method: string[] = ['PROCESOS', 'DISCRETA'];
    try {
      // Ejecutar todas las peticiones en paralelo
      const promises = paths.map(path =>
        this.apiService.GetRequestFusion(this.endPoints.Path(path, this.organizationSelected.Code))
      );

      const responses = await Promise.all(promises);

      // Inicializar el objeto para acumular datos
      this.fusionData = {
        items: [],
        totalResults: 0,
        count: 0,
        hasMore: false,
      };

      // Procesar cada respuesta
      responses.forEach((response: any, index) => {
        const data = JSON.parse(response);

        const transformer = this.dataTransformers[method[index]];
        if (!transformer) {
          this.alerts.Warning('Tipo de manufactura no identificado');
          return;
        }

        const restructuredData = data.items.map((item: any) => transformer(item));

        // Acumular los datos
        this.fusionData.items = [...this.fusionData.items, ...restructuredData];
        this.fusionData.totalResults += data.totalResults || 0;
        this.fusionData.count += data.count || 0;
      });

      this.fusionOriginalData = JSON.parse(JSON.stringify(this.fusionData)); // Guardar estructura original
      this.FilterRegisteredItems();

    } catch (error) {
      console.error('Error al procesar manufactura mixta:', error);
      this.alerts.Warning('Error al obtener los datos');
    }
  }

  OnFilterGlobal(event: Event, table: any) {
    const target = event.target as HTMLInputElement;
    table.filterGlobal(target.value, 'contains');
  }

  FilterRegisteredItems() {
    if (this.fusionOriginalData.items && this.dbData.items) {
      // Set de ID's para filtrar posteriormente
      const dbOrdersNumbers = new Set(this.dbData.items.map((item: any) => String(item.WorkOrderNumber)));
      // Filtrar items de fusion que no estén en DB
      this.fusionData.items = this.fusionOriginalData.items.filter((fusionItem: any) => {
        return !dbOrdersNumbers.has(String(fusionItem.WorkOrderNumber));
      });
    }else{ //Si DB no tiene datos a comparar, solo imprimir datos originales de Fusion
      if(this.fusionOriginalData.items) {
        this.fusionData = JSON.parse(JSON.stringify(this.fusionOriginalData));
      }
    }
  }

  UploadResources() {
    if (this.fusionData.items) {

      if (this.selectedItemsFusion.length === 0) {
        this.alerts.Warning("Seleccione algún elemento para cargar");
        return;
      }

      const itemsData = this.selectedItemsFusion.map((item: any) => ({
        OrganizationId: this.organizationSelected.OrganizationId,
        MachineId: item.ResourceId,
        WorkOrderNumber: item.WorkOrderNumber,
        WorkDefinitionId: item.WorkDefinitionId,
        ItemId: item.ItemId,
        PlannedQuantity: item.PlannedQuantity,
        CompletedQuantity: item.CompletedQuantity,
        Status: item.CompletedQuantity > 0 ? 'IN_PROCESS' : 'RELEASED',
        StartDate: item.StartDate,
        CompletionDate: item.CompletionDate,
        Type: this.organizationSelected.WorkMethod.charAt(0)
      }));

      const payload = {
        items: itemsData
      };

      this.apiService.PostRequestRender(this.endPoints.Render('workOrders'), payload).then(async (response: any) => {
        if(response.errorsExistFlag) {
          this.alerts.Info(response.message);
        }else {
          this.alerts.Success(response.message);

          setTimeout(() => {
            this.RefreshTables();
          }, 1500);

        }
      });
    }
  }

  async DeleteResources() {
    if (this.dbData.items) {

      if (this.selectedItemsDB.length === 0) {
        this.alerts.Warning("Seleccione algún elemento para eliminar");
        return;
      }

      try {
        let successCount = 0;

        // Eliminar uno por uno (secuencial)
        for (const item of this.selectedItemsDB) {
          const response = await this.apiService.DeleteRequestRender(
            this.endPoints.Render('workOrders/' + item.WorkOrderId),
          );

          if (!response.errorsExistFlag) {
            successCount++;
          }
        }

        this.alerts.Success(`Eliminados exitosamente [${successCount}/ ${this.selectedItemsDB.length}]`);

        // Recargar la página solo si hubo eliminaciones exitosas
        if (successCount > 0) {
          setTimeout(() => {
            this.RefreshTables();
          }, 1500);
        }

      } catch (error) {
        console.error('Error al eliminar:', error);
        this.alerts.Error('Error al eliminar');
      }
    }
  }

  ClearFusion(table: any) {
    table.clear();
    this.searchValueFusion = '';
  }

  ClearDB(table: any) {
    table.clear();
    this.searchValueDB = '';
  }

  RefreshTables() {
    let clause = `workOrders/${this.organizationSelected.OrganizationId}`;
    this.apiService.GetRequestRender(this.endPoints.Render(clause)).then((response: any) => {
      response.totalResults == 0 && this.alerts.Warning(response.message);
      this.dbData = response;

      this.FilterRegisteredItems();
    });

    // Limpiar valores de búsqueda
    this.searchValueFusion = '';
    this.searchValueDB = '';

    // Limpiar selecciones
    this.selectedItemsFusion = [];
    this.selectedItemsDB = [];
  }

  protected readonly FormatForDisplayUser = FormatForDisplayUser;
}
