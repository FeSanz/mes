import { ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA, Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { ellipsisVerticalOutline, chevronForwardOutline, checkmarkOutline, addOutline, trashOutline, pencilOutline, menuOutline } from 'ionicons/icons';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, IonIcon, IonMenuButton, IonItem, IonInput, IonText } from '@ionic/angular/standalone';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { Select } from 'primeng/select';
import { FloatLabel } from "primeng/floatlabel"
import { HeightTable } from "../../../models/tables.prime";
import { ApiService } from "../../../services/api.service";
import { EndpointsService } from "../../../services/endpoints.service";
import { AlertsService } from "../../../services/alerts.service";
import { PermissionsService } from 'src/app/services/permissions.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToggleMenu } from 'src/app/models/design';
import { Truncate } from "../../../models/math.operations";
import { Dialog } from "primeng/dialog";
import { PrimeTemplate } from "primeng/api";
import { DialogModule } from 'primeng/dialog';
import { IonBreadcrumb, IonBreadcrumbs } from '@ionic/angular/standalone';
import { ConfirmationService } from "primeng/api";

@Component({
  selector: 'app-machines',
  templateUrl: './machines.page.html',
  styleUrls: ['./machines.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, 
    CommonModule, FormsModule, TableModule, CardModule, IonContent, IonTitle, IonToolbar, 
    CommonModule, FormsModule, IonButtons, IonMenuButton,
    IonButton, IonIcon, IonItem, IonInput,
    TableModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule, TagModule, 
    DropdownModule,MultiSelectModule, Select, FloatLabel, IonText, Dialog, PrimeTemplate, 
    DialogModule, IonBreadcrumb, IonBreadcrumbs]
})

export class MachinesPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('regionContainer', { static: false }) regionContainer!: ElementRef;
  modalSize: string = '';
  private resizeObserver!: ResizeObserver;
  scrollHeight: string = '550px';
  rowsPerPage: number = 50;
  rowsPerPageOptions: number[] = [10, 25, 50];
  selectedMachines: any[] = [];

  fusionOriginalData: any = {};
  fusionData: any = {};
  dbData: any = {};

  dbOrganizations: any = {};
  organizationSelected: string | any = '';
  orgSelect: any = {};

  selectedItemsDB: any[] = [];
  isFusion: boolean = false;

  searchValueDB: string = '';
  resources: any = [];
  resource: any = {
    OrganizationId: null,
    Code: '',
    Name: '',
    WorkCenterId: null,    
    Class: '',
    Token: null
  };

  isNewFlag: boolean = true;
  isModalOpen: boolean = false;
  userData: any = {};

  workCenters: any[] = [];
  workCenterSelected: string | any = '';

  constructor(private apiService: ApiService,
    private endPoints: EndpointsService,
    public alerts: AlertsService,
    public permissions: PermissionsService,
    private changeDetector: ChangeDetectorRef,
    private confirmationService: ConfirmationService
  ) {

    addIcons({ menuOutline, checkmarkOutline, addOutline, ellipsisVerticalOutline, chevronForwardOutline, trashOutline, pencilOutline });
  }

  ngOnInit() {
    this.dbOrganizations = JSON.parse(String(localStorage.getItem("userData")));
    this.userData = JSON.parse(String(localStorage.getItem("userData")));
    if (this.userData && this.userData.Company && this.userData.Company.Organizations) {

      const organizations = this.userData.Company.Organizations;

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

  OnOrganizationSelected() {
    if (this.organizationSelected) {
      let clause = `orgResourceMachines/${this.organizationSelected.OrganizationId}`;
      this.orgSelect = this.organizationSelected.OrganizationId;
      this.apiService.GetRequestRender(clause).then((response: any) => {
        response.totalResults == 0 && this.alerts.Warning(response.message);
        this.dbData = response;        
      });
    }
  }

  OnFilterGlobal(event: Event, table: any) {
    const target = event.target as HTMLInputElement;
    table.filterGlobal(target.value, 'contains');
  }

  OpenAsNewResource() {    
    this.resetResource()
    this.isNewFlag = true
    this.resource.OrganizationId = this.orgSelect
    this.isModalOpen = true;
    
    this.getWorkCenters();    

    this.resource.Token = this.generateToken();

    const contentPart = document.querySelector('ion-modal.dispach-modal')?.shadowRoot?.querySelector('[part="content"]');
    if (contentPart) {
      const rect = contentPart.getBoundingClientRect();
      this.modalSize = `Modal: ${Truncate(rect.width)} x ${Truncate(rect.height)} | Viewport: ${window.innerWidth} (${((rect.width / window.innerWidth) * 100).toFixed(2)}%)`;
    }    
  }

  resetResource() {//se reinician los datos del usuario nuevo o a editar
    this.resource = {
      OrganizationId: null,
      Code: '',
      Name: '',
      WorkCenterId: null,      
      Class: '',
      Token: null
    };
  }

  AddOrEditResource() {    
    if (!this.resource.Code?.trim() || !this.resource.Name || !this.resource.Class) {
      this.alerts.ShowAlert('Llene todos los campos requeridos', 'danger');
      return;
    }    

    const itemsArray = [this.resource]; 
    const payload = {
      items: itemsArray
    };    

    if (this.isNewFlag) {
      if (this.organizationSelected) {        
        this.apiService.PostRequestRender('resourceMachines', payload).then(async (response: any) => {
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
      this.apiService.PutRequestRender('resourceMachines/' + this.resource.MachineId, payload).then(async (response: any) => {
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

  async DeleteResources() {
    if (this.selectedMachines.length === 0) {
      this.alerts.Warning("Seleccione algún elemento para eliminar");
      return;
    }    

    const payload = {
      items: this.selectedMachines
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
          this.apiService.DeleteMultipleRequestRender('resourceMachines', payload).then(async (response: any) => {
          if (!response.errorsExistFlag) {
            this.alerts.Success("Eliminación exitosa");
            this.RefreshTables();
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

  EditResource(mach: any) {      
    this.resource = mach;
    this.isNewFlag = false
    this.isModalOpen = true
    this.getWorkCenters()        
  }

  RefreshTables() {
    let clause = `orgResourceMachines/${this.organizationSelected.OrganizationId}`;
    this.apiService.GetRequestRender(clause).then((response: any) => {
      response.totalResults == 0 && this.alerts.Warning(response.message);
      this.dbData = response;      
    });

    this.searchValueDB = '';
  }

  getWorkCenters() {
    this.apiService.GetRequestRender(`workCenters/${this.organizationSelected.OrganizationId}`).then((response: any) => {
      // const parsed = JSON.parse(response).items;
      this.workCenters = response.items;           
      this.changeDetector.detectChanges()
    });
  }

  OnWorkCenterSelected() {
    this.resource.WorkCenterId = this.resource.WorkCenterId;    
    this.changeDetector.detectChanges()
  }

  generateToken(): string {
    let d = new Date().getTime();
    let d2 = (performance && performance.now && (performance.now() * 1000)) || 0; // alta precisión si disponible

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      let r = Math.random() * 16;

      if (d > 0) {
        r = (d + r) % 16 | 0;
        d = Math.floor(d / 16);
      } else {
        r = (d2 + r) % 16 | 0;
        d2 = Math.floor(d2 / 16);
      }

      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });

  }

  get transformedWorkCenters() {
    return this.workCenters.map(item => ({
      label: item.WorkCenterName,
      value: item.WorkCenterId.toString()
    }));
  }
  protected readonly ToggleMenu = ToggleMenu;
}

