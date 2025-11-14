import { ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA, Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { ellipsisVerticalOutline, chevronForwardOutline, checkmarkOutline, addOutline, trashOutline, pencilOutline, menuOutline, timeOutline } from 'ionicons/icons';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, IonIcon, IonMenuButton, IonItem,
  IonInput, IonText, IonLabel
} from '@ionic/angular/standalone';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { Button, ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconField, IconFieldModule } from 'primeng/iconfield';
import { InputIcon, InputIconModule } from 'primeng/inputicon';
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
import { ToggleMenu } from 'src/app/models/design';
import { Truncate } from "../../../models/math.operations";
import { Dialog } from "primeng/dialog";
import { PrimeTemplate } from "primeng/api";
import { DialogModule } from 'primeng/dialog';
import { IonBreadcrumb, IonBreadcrumbs } from '@ionic/angular/standalone';
import { DatePicker } from 'primeng/datepicker';
import { ConfirmationService } from "primeng/api";

@Component({
  selector: 'app-work-centers',
  templateUrl: './work-centers.page.html',
  styleUrls: ['./work-centers.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonMenuButton,
    IonButton, IonIcon, IonBreadcrumbs, IonBreadcrumb, FloatLabel, Select, PrimeTemplate, TableModule, ButtonModule,
    IonText, IonItem, DialogModule, Dialog, InputIconModule, IconFieldModule, IonInput, InputTextModule
  ]
})
export class WorkCentersPage implements OnInit {

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
  searchValueDB: string = '';
  
  selectedWC: any[] = [];
  isNewFlag: boolean = true;
  isModalOpen: boolean = false;

  wc: any = {
    WorkCenterId: null,
    OrganizationId: null,
    WorkCenterCode: '',
    WorkCenterName: '',
    WorkAreaCode: '',
    WorkAreaName: '',
    FusionId: null
  };

  constructor(
    private apiService: ApiService,
    public alerts: AlertsService,
    private changeDetector: ChangeDetectorRef,
    private confirmationService: ConfirmationService
  ) { 
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
    let clause = `workCenters/${this.organizationSelected.OrganizationId}`;
    this.apiService.GetRequestRender(clause).then((response: any) => {
      response.totalResults == 0 && this.alerts.Warning(response.message);
      this.dbData = response;
    });

    this.searchValueDB = '';
  }

  OnOrganizationSelected() {
    if (this.organizationSelected) {
      let clause = `workCenters/${this.organizationSelected.OrganizationId}`;
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

  OpenAsNewWorkCenter() {
    this.resetWC()
    this.isNewFlag = true
    this.wc.OrganizationId = this.orgSelect
    this.isModalOpen = true;

    const contentPart = document.querySelector('ion-modal.dispach-modal')?.shadowRoot?.querySelector('[part="content"]');
    if (contentPart) {
      const rect = contentPart.getBoundingClientRect();
      this.modalSize = `Modal: ${Truncate(rect.width)} x ${Truncate(rect.height)} | Viewport: ${window.innerWidth} (${((rect.width / window.innerWidth) * 100).toFixed(2)}%)`;
    }
  }

  resetWC() {//se reinician los datos del usuario nuevo o a editar
    this.wc = {
      WorkCenterId: null,
      OrganizationId: null,
      WorkCenterCode: '',
      WorkCenterName: '',
      WorkAreaCode: '',
      WorkAreaName: '',
      FusionId: null      
    };
  } 
  
  AddOrEditWorkCenter() {
    const itemsArray = [this.wc];

    if (this.isNewFlag) {
      if (this.organizationSelected) {
        const payload = {
          OrganizationId: this.wc.OrganizationId,
          items: itemsArray
        };

        this.apiService.PostRequestRender('workCenters', payload).then(async (response: any) => {
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
      const payload = {
        items: itemsArray
      };

      this.apiService.PutRequestRender('workCenters/' + this.wc.WorkCenterId, payload).then(async (response: any) => {
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

  async DeleteWorkCenters() {
    if (this.selectedWC.length === 0) {
      this.alerts.Warning("Seleccione algún elemento para eliminar");
      return;
    }

    const payload = {
      items: this.selectedWC
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
          this.apiService.DeleteMultipleRequestRender('workCenters', payload).then(async (response: any) => {
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

  EditWorkCenter(ct: any) {
    this.wc = ct;
    this.isNewFlag = false
    this.isModalOpen = true
    this.changeDetector.detectChanges()    
  }
  
}
