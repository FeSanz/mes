import {AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, HostListener,
  OnDestroy, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader, IonIcon,
  IonMenuButton,
  IonRow,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {Platform} from '@ionic/angular';

import {ApiService} from "../../../../services/api.service";
import {EndpointsService} from "../../../../services/endpoints.service";
import {AlertsService} from "../../../../services/alerts.service";
import {HeightTable, RowsPerPageProduction} from "../../../../models/tables.prime";
import {FormatForDisplayFromISO} from "../../../../models/date.format";
import {ToggleMenu} from "../../../../models/design";

import {Button} from "primeng/button";
import {IconField} from "primeng/iconfield";
import {InputIcon} from "primeng/inputicon";
import {InputText} from "primeng/inputtext";
import {PrimeTemplate} from "primeng/api";
import {TableModule} from "primeng/table";
import { Table as PrimeTable } from 'primeng/table';
import {Tag} from "primeng/tag";
import {ProgressBar} from "primeng/progressbar";
import {Slider} from "primeng/slider";
import {WebSocketService} from "../../../../services/web-socket.service";
import {FloatLabel} from "primeng/floatlabel";
import {Select} from "primeng/select";
import {
  contract,
  menuOutline
} from "ionicons/icons";
import {addIcons} from "ionicons";


@Component({
  selector: 'app-production',
  templateUrl: './production.page.html',
  styleUrls: ['./production.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonMenuButton, IonCard, IonCol, IonGrid, IonRow, Button, IconField, InputIcon, InputText, PrimeTemplate, TableModule,
    Tag, ProgressBar, Slider, FloatLabel, Select, IonButton, IonIcon]
})
export class ProductionPage implements OnInit, AfterViewInit, OnDestroy  {
  scrollHeight: string = '550px';
  rowsPerPage: number = 18;
  rowsPerPageOptions: number[] = [5, 10, 20];

  userData: any = {};
  workOrders: any = { items: [] };
  lastWorkOrders: any = { items: [] };
  progressValue: number[] = [0, 100];

  searchValueWO: string = '';

  organizationSelected: string | any = '';

  //Loop paginacion
  @ViewChild('dtWorkOrders') dtWorkOrders!: PrimeTable;
  private autoPaginationInterval: any;
  private readonly AUTO_PAGINATION_DELAY = 10000;

  constructor(private cdr: ChangeDetectorRef,
              private apiService: ApiService,
              private endPoints: EndpointsService,
              private alerts: AlertsService,
              private platform: Platform,
              private websocket: WebSocketService) {
    addIcons({ contract, menuOutline });
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

    this.RowsPerPage();
  }

  ngAfterViewInit() {
    this.UpdateScrollHeight();
    this.StartAutoPagination();
  }

  ngOnDestroy() {
    /*this.websocket.unsubscribe('workorders-new');
    this.websocket.unsubscribe('workorders-advance');*/
    this.StopAutoPagination();
    console.log('ngOnDestroy');
  }

  private RowsPerPage() {
    const viewportHeight = window.innerHeight;

    // Calcular filas por pagina
    this.rowsPerPage = RowsPerPageProduction(viewportHeight);

    // Actualizar opciones del selector
    this.rowsPerPageOptions = [
      Math.max(5, Math.floor(this.rowsPerPage / 2)),
      this.rowsPerPage,
      Math.min(50, this.rowsPerPage * 2)
    ];

    // Forzar actualización de la tabla si ya existe
    if (this.dtWorkOrders) {
      this.dtWorkOrders.rows = this.rowsPerPage;
      this.cdr.detectChanges();
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
    this.workOrders = { items: [] };
    this.apiService.GetRequestRender(`workOrders/${this.organizationSelected.OrganizationId}`).then((response: any) => {
      this.workOrders = response;

      if (this.workOrders.items && Array.isArray(this.workOrders.items)) {
        this.workOrders.items = this.workOrders.items.map((item: any) => ({
          ...item,
          Advance: this.CalculateAdvance(item.PlannedQuantity, item.CompletedQuantity)
        }));
      }

      this.OnStartSuscriptionNewWO(this.organizationSelected.OrganizationId);
      this.OnSuscriptionAdvanceWO(this.organizationSelected.OrganizationId);

      this.GetLastWorkOrders();

    }).catch(error => {
      console.error('Error al obtener OTs:', error);
    });
  }

  GetLastWorkOrders(){
    this.apiService.GetRequestRender(`lastWOCompleted/${this.organizationSelected.OrganizationId}`, false).then((response: any) => {
      this.lastWorkOrders = response;

      this.cdr.detectChanges();
    }).catch(error => {
      console.error('Error al obtener últimas OTs registradas:', error);
      this.lastWorkOrders = { items: [] };
    });
  }

  OnStartSuscriptionNewWO(orgId:number){
    const wsType = 'workorders-new';
    this.websocket.SuscribeById({ organization_id: orgId, typews: wsType }, wsType, (response) => {
      const newWorkOrders = response;
      if (newWorkOrders.items && Array.isArray(newWorkOrders.items)) {
        const newItems = newWorkOrders.items.map((item: any) => ({
          ...item,
          Advance: this.CalculateAdvance(item.PlannedQuantity, item.CompletedQuantity)
        }));

        this.workOrders.items = [...this.workOrders.items, ...newItems];
      }
    }).then((ws) => {
    }).catch(err => {
      console.log(err);
    });
  }

  OnSuscriptionAdvanceWO(orgId: number) {
    const wsType = 'workorders-advance';
    this.websocket.SuscribeById({ organization_id: orgId, typews: wsType }, wsType, (response) => {

      if (response && response.items) {
        const woAdvanced = response.items;

        // Buscar y actualizar la orden correspondiente
        const orderIndex = this.workOrders.items.findIndex(
          (item: any) => item.WorkOrderId === woAdvanced.WorkOrderId
        );

        if (orderIndex !== -1) {
          // Actualizar los campos que llegaron por WebSocket
          const updatedItem = {
            ...this.workOrders.items[orderIndex],
            CompletedQuantity: woAdvanced.CompletedQuantity || this.workOrders.items[orderIndex].CompletedQuantity,
            Status: woAdvanced.Status || this.workOrders.items[orderIndex].Status,
          };

          // Recalcular el avance con la nueva cantidad completada
          updatedItem.Advance = this.CalculateAdvance(
            updatedItem.PlannedQuantity,
            updatedItem.CompletedQuantity
          );

          // Crear un nuevo objeto completo usando el  actualizado
          this.workOrders.items = [
            ...this.workOrders.items.slice(0, orderIndex),
            updatedItem,
            ...this.workOrders.items.slice(orderIndex + 1)
          ];

          this.cdr.detectChanges();
          this.GetLastWorkOrders();

        } else {
          console.warn(`No se encontró la orden con ID: ${woAdvanced.WorkOrderId}`);
        }
      }
    }).then((ws) => {
    }).catch(err => {
      console.log(err);
    });
  }

  private CalculateAdvance(planned: number, completed: number): number {
    //Validaiones para evitar errores en operaciones
    if (!planned || planned === 0 || !completed) { return 0; }
    if (completed < 0 || planned < 0) { return 0; }

    const percentage = (completed / planned) * 100;

    return Math.min(Math.max(Math.round(percentage), 0), 100);
  }

  OnAdvanceFilter(values: number[], filterCallback: any) {
    this.progressValue = values;
    filterCallback(values);
  }

  GetColorByAdvanced(advance: number) {
   if(advance == 0 || advance == null){
     return "danger"; //rojo
   }else if(advance >= 1){
     return "success"; //verde
   }else if(advance == -1){
     return "warn"; //naranja
   }else if(advance == -2){
     return "info"; //azul
   }else {
     return "contrast"; //blanco
   }
  }

  OnFilterGlobal(event: Event, table: any) {
    const target = event.target as HTMLInputElement;
    table.filterGlobal(target.value, 'contains');
  }

  ClearWorkOrders(table: any) {
    table.clear();
    this.searchValueWO = '';
    this.progressValue = [0, 100];
  }

  private autoPaginationTimeout: any;

  private StartAutoPagination() {
    // Limpiar timeout anterior si existe
    if (this.autoPaginationTimeout) {
      clearTimeout(this.autoPaginationTimeout);
    }

    const paginate = () => {
      if (!this.dtWorkOrders || this.searchValueWO || this.workOrders.items.length === 0) {
        // Si no se puede paginar, reintentar después
        this.autoPaginationTimeout = setTimeout(paginate, this.AUTO_PAGINATION_DELAY);
        return;
      }

      const table = this.dtWorkOrders;
      const dataSource = table.filteredValue || this.workOrders.items;
      const totalRecords = dataSource.length;
      const rowsPerPage = table.rows || this.rowsPerPage;
      const totalPages = Math.ceil(totalRecords / rowsPerPage);

      if (totalPages > 1) {
        const currentFirst = table.first || 0;
        const currentPage = Math.floor(currentFirst / rowsPerPage);

        if (currentPage + 1 >= totalPages) {
          table.first = 0;
        } else {
          table.first = currentFirst + rowsPerPage;
        }
      }

      // Programar la siguiente paginación
      this.autoPaginationTimeout = setTimeout(paginate, this.AUTO_PAGINATION_DELAY);
    };

    // Iniciar la paginación
    this.autoPaginationTimeout = setTimeout(paginate, this.AUTO_PAGINATION_DELAY);
  }

  private StopAutoPagination() {
    if (this.autoPaginationTimeout) {
      clearTimeout(this.autoPaginationTimeout);
      this.autoPaginationTimeout = null;
    }
  }

  //Pausar al interactuar con la tabla
  OnTableInteraction() {
    this.StopAutoPagination();
    // Reiniciar después de 10 segundos de inactividad
    setTimeout(() => this.StartAutoPagination(), 10000);
  }

  protected readonly FormatForDisplayFromISO = FormatForDisplayFromISO;
  protected readonly contract = contract;
  protected readonly ToggleMenu = ToggleMenu;
}
