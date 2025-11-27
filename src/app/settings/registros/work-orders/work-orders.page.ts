import { ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA, Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { ellipsisVerticalOutline, chevronForwardOutline, checkmarkOutline, addOutline, trashOutline, pencilOutline, menuOutline, timeOutline } from 'ionicons/icons';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, IonIcon, IonMenuButton, IonItem,
  IonInput, IonText, IonLabel
} from '@ionic/angular/standalone';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { FloatLabel } from "primeng/floatlabel"
import { HeightTable } from "../../../models/tables.prime";
import { ApiService } from "../../../services/api.service";
import { AlertsService } from "../../../services/alerts.service";
import { ToggleMenu } from 'src/app/models/design';
import { Truncate } from "../../../models/math.operations";
import { Dialog } from "primeng/dialog";
import { PrimeTemplate } from "primeng/api";
import { DialogModule } from 'primeng/dialog';
import { IonBreadcrumb, IonBreadcrumbs } from '@ionic/angular/standalone';
import { DatePicker } from 'primeng/datepicker';
import { ConfirmationService } from "primeng/api";
import { REACTIVE_NODE } from '@angular/core/weak_ref.d-DWHPG08n';

@Component({
  selector: 'app-work-orders',
  templateUrl: './work-orders.page.html',
  styleUrls: ['./work-orders.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonMenuButton,
    IonButton, IonIcon, IonBreadcrumbs, IonBreadcrumb, FloatLabel, SelectModule, PrimeTemplate, TableModule, ButtonModule,
    IonText, IonItem, DialogModule, Dialog, InputIconModule, IconFieldModule, IonInput, InputTextModule, DatePicker,
    IonLabel
  ]
})
export class WorkOrdersPage implements OnInit {

  @ViewChild('regionContainer', { static: false }) regionContainer!: ElementRef;
  modalSize: string = '';
  private resizeObserver!: ResizeObserver;
  scrollHeight: string = '550px';
  rowsPerPage: number = 50;
  rowsPerPageOptions: number[] = [10, 25, 50];

  protected readonly ToggleMenu = ToggleMenu;
  userData: any = {};
  dbOrganizations: any = {};
  organizationSelected: string | any = '';
  orgSelect: any = {};
  dbData: any = {};
  dbMachines: any = []
  dbItems: any = []
  searchValueDB: string = '';
  
  selectedWO: any[] = [];
  isNewFlag: boolean = true;
  isModalOpen: boolean = false;

  wo: any = {
    WorkOrderId: null,
    OrganizationId: null,
    WorkDefinitionId: null,
    MachineId: null,
    ItemId: null,    
    WorkOrderNumber: '',
    PlannedQuantity: null,
    DispatchedQuantity: null,
    CompletedQuantity: null,
    Status: '',
    StartDate: null,
    CompletionDate: null,
    Type: ''
  };

  actualDate: Date;
  companyId: number = 0;
  minDate: Date | undefined;

  constructor(
    private apiService: ApiService,
    public alerts: AlertsService,
    private changeDetector: ChangeDetectorRef,
    private confirmationService: ConfirmationService    
  ) { 
    this.actualDate = new Date();
    addIcons({
      menuOutline, checkmarkOutline, addOutline, ellipsisVerticalOutline, chevronForwardOutline,
      trashOutline, pencilOutline, timeOutline
    });
  }

  ngOnInit() {
    this.dbOrganizations = JSON.parse(String(localStorage.getItem("userData")));
    this.userData = JSON.parse(String(localStorage.getItem("userData")));
    if (this.userData && this.userData.Company && this.userData.Company.Organizations) {
      
      const organizations = this.userData.Company.Organizations;      
      this.companyId = this.userData.Company.CompanyId;        

      // Validar si hay organizaciones
      if (organizations && Array.isArray(organizations) && organizations.length > 0) {
        const sortedOrganizations = organizations.sort((a, b) => a.OrganizationId - b.OrganizationId);
        this.organizationSelected = sortedOrganizations[0];
        this.orgSelect = this.organizationSelected.OrganizationId;

        this.RefreshTables();        

      } else {
        this.alerts.Warning("No se encontraron organizaciones");
      }
    }
  }

  ngAfterViewInit() {
    this.ObserveResize();
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  RefreshTables() {
    let clause = `workOrders/${this.organizationSelected.OrganizationId}`;
    this.apiService.GetRequestRender(clause).then((response: any) => {
      response.totalResults == 0 && this.alerts.Warning(response.message);
      this.dbData = response;
    });

    this.searchValueDB = '';
  }

  OnOrganizationSelected() {
    if (this.organizationSelected) {
      let clause = `workOrders/${this.organizationSelected.OrganizationId}`;
      this.orgSelect = this.organizationSelected.OrganizationId;
      this.apiService.GetRequestRender(clause).then((response: any) => {
        response.totalResults == 0 && this.alerts.Warning(response.message);
        this.dbData = response;        
      });
      
    }
  }
  
  GetScrollHeight(): string {
    return this.scrollHeight;
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

  OnFilterGlobal(event: Event, table: any) {
    const target = event.target as HTMLInputElement;
    table.filterGlobal(target.value, 'contains');
  }

  OpenAsNewWorkOrder() {
    this.resetWO()
    this.isNewFlag = true
    this.wo.OrganizationId = this.orgSelect    
    this.wo.CompletedQuantity = 0
    this.wo.Status = 'RELEASED'
    this.isModalOpen = true;

    const workMethod = this.getWorkMethodByOrganizationId(this.wo.OrganizationId)

    if (workMethod === 'PROCESOS'){
      this.wo.Type = 'P'
    }else if (workMethod === 'DISCRETA'){
      this.wo.Type = 'D'
    } else {
      this.wo.Type = ''
    }

    this.loadDataSequentially()   

    this.changeDetector.detectChanges()
    this.alerts.HideLoading()

    const contentPart = document.querySelector('ion-modal.dispach-modal')?.shadowRoot?.querySelector('[part="content"]');
    if (contentPart) {
      const rect = contentPart.getBoundingClientRect();
      this.modalSize = `Modal: ${Truncate(rect.width)} x ${Truncate(rect.height)} | Viewport: ${window.innerWidth} (${((rect.width / window.innerWidth) * 100).toFixed(2)}%)`;
    }
  }

  resetWO() {
    this.wo = {
    WorkOrderId: null,
    OrganizationId: null,
    WorkDefinitionId: null,
    MachineId: null,
    ItemId: null,    
    WorkOrderNumber: '',
    PlannedQuantity: null,
    DispatchedQuantity: null,
    CompletedQuantity: null,
    Status: '',
    StartDate: null,
    CompletionDate: null,
    Type: ''
    };
  } 
  
  AddOrEditWorkOrder() {
    const itemsArray = [this.wo];

    if (this.isNewFlag) {
      if (this.organizationSelected) {
        const payload = {          
          items: itemsArray
        };

        this.apiService.PostRequestRender('workOrders', payload).then(async (response: any) => {
          if (response.errorsExistFlag) {
            this.alerts.Info(response.message);
          } else {
            this.alerts.Success(response.message);

            setTimeout(() => {
              this.RefreshTables();
            }, 1500);

          }
        });
        this.isModalOpen = false
      } else {
        this.alerts.Info('Seleccione una organización');
      }
    } else {
      if (this.wo.CompletedQuantity > 0 ){
        this.wo.Status = 'IN_PROCESS'
      }
      const payload = {
        items: itemsArray
      };      

      this.apiService.PutRequestRender('workOrders/' + this.wo.WorkOrderId, payload).then(async (response: any) => {
        if (response.errorsExistFlag) {
          this.alerts.Info(response.message);
        } else {
          this.alerts.Success(response.message);
          this.isNewFlag = true
          this.isModalOpen = false
          this.RefreshTables()
        }
      });
    }
    this.alerts.HideLoading();
  }

  async DeleteWorkOrders() {
    if (this.selectedWO.length === 0) {
      this.alerts.Warning("Seleccione algún elemento para eliminar");
      return;
    }

    const payload = {
      items: this.selectedWO
    }    

    this.confirmationService.confirm({
      message: '¿Está seguro de que desea eliminar los elementos seleccionados?',
      header: 'Confirm',
      icon: 'fas fa-circle-exclamation',
      rejectButtonProps: {
        label: 'No',
        severity: 'secondary',
        variant: 'text'
      },
      acceptButtonProps: {
        severity: 'danger',
        label: 'Si'
      },
      accept: async () => {
        try {
          this.apiService.DeleteMultipleRequestRender('workOrders', payload).then(async (response: any) => {
            if (!response.errorsExistFlag) {
              this.alerts.Success("Eliminación exitosa");
              this.RefreshTables();
              this.selectedWO = [];
            } else {
              this.alerts.Info(response.error);
            }
          });

        } catch (error) {
          console.error('Error al eliminar:', error);
          this.alerts.Error('Error al eliminar');
        }
      }
    });

  }

  EditWorkOrder(ot: any) {          
    this.wo.WorkOrderId = ot.WorkOrderId
    this.wo.OrganizationId = this.orgSelect
    this.wo.WorkDefinitionId = ot.WorkDefinitionId,
    this.wo.MachineId = ot.ResourceId
    this.wo.ItemId = ot.ItemId
    this.wo.WorkOrderNumber = ot.WorkOrderNumber
    this.wo.PlannedQuantity = Number(ot.PlannedQuantity)
    this.wo.DispatchedQuantity = ot.DispatchedQuantity
    this.wo.CompletedQuantity = Number(ot.CompletedQuantity)
    this.wo.Status = ot.Status
    this.wo.StartDate = new Date(ot.StartDate)
    this.wo.CompletionDate = new Date(ot.CompletionDate)
    this.wo.Type = ot.Type
    this.minDate = this.wo.StartDate

    this.isNewFlag = false
    this.isModalOpen = true    
    this.loadDataSequentially()       
    
    this.changeDetector.detectChanges()    
  }
  
  ClearData(table: any) {
    table.clear();
    this.searchValueDB = '';
  }

  getWorkMethodByOrganizationId(orgId: number): string | undefined {      
    const organization = this.dbOrganizations.Company.Organizations.find((org: { OrganizationId: number; }) => org.OrganizationId === orgId);
    return organization?.WorkMethod;
  }

  async loadDataSequentially() {
    try {                  
      await this.getMachines();
            
      await this.getItems();
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      this.alerts.Error('Error al cargar los datos');
    } finally {
      this.alerts.HideLoading();
    }
  }
  
  getMachines(): Promise<void> {
    return new Promise((resolve, reject) => {
      let clause = `orgResourceMachines/${this.orgSelect}`;
      this.apiService.GetRequestRender(clause).then((response: any) => {      
        if (response.totalResults == 0) {
          this.alerts.Warning(response.message);
          this.dbMachines = [];
        } else {
          this.dbMachines = response.items;        
        }
        resolve(); 
      }).catch(error => {
        reject(error); 
      });  
    });
  }
  
  getItems(): Promise<void> {
    return new Promise((resolve, reject) => {
      let clause = `items/${this.companyId}/Todos`;
      this.apiService.GetRequestRender(clause).then((response: any) => {
        if (response.totalResults == 0) {
          this.alerts.Warning(response.message);
          this.dbItems = [];
        } else {
          this.dbItems = response.items;          
        }
        resolve(); 
      }).catch(error => {
        reject(error);
      });    
    });
  }

  get transformedMachines() {    
    return this.dbMachines.map((item: { Code: any; MachineId: any; }) => ({
      label: item.Code,
      value: item.MachineId
    }));
  }

  get transformedItems() {    
    return this.dbItems.map((item: { Number: any; ItemId: any; }) =>  ({
      label: item.Number,
      value: item.ItemId.toString()
    }));
  }  

}
