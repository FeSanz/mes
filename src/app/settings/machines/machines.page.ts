import { ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA, Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { ellipsisVerticalOutline, chevronForwardOutline, checkmarkOutline, addOutline, trashOutline, pauseSharp, pencilOutline } from 'ionicons/icons';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, IonIcon, IonMenuButton, IonFab, IonFabButton, IonModal, IonItem, IonInput, IonSelect, IonSelectOption, IonToggle, IonText } from '@ionic/angular/standalone';
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
import { HeightTable } from "../../models/tables.prime";
import { ApiService } from "../../services/api.service";
import { EndpointsService } from "../../services/endpoints.service";
import { AlertsService } from "../../services/alerts.service";
import { PermissionsService } from 'src/app/services/permissions.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';


@Component({
  selector: 'app-machines',
  templateUrl: './machines.page.html',
  styleUrls: ['./machines.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, CommonModule, FormsModule, TableModule, CardModule, IonContent, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonMenuButton, IonFab, IonFabButton, IonModal,
    IonButton, IonIcon, IonItem, IonInput, IonSelect, IonSelectOption, IonToggle,
    TableModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule, TagModule, DropdownModule,
    MultiSelectModule, Select, FloatLabel, IonText]
})

export class MachinesPage implements OnInit, AfterViewInit, OnDestroy {
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
  orgSelect: any = {};

  selectedItemsDB: any[] = [];

  searchValueDB: string = '';
  resources: any = [];
  resource: any = {
    OrganizationId: null,
    Code: '',
    Name: '',
    WorkCenterId: null,
    WorkCenter: null,
    Class: '',
    Token: null
  };

  isNewFlag = true;
  isModalOpen = false;  

  constructor(private apiService: ApiService,
    private endPoints: EndpointsService,
    private alerts: AlertsService,
    public permissions: PermissionsService,
    private changeDetector: ChangeDetectorRef    
  ) {
  
  addIcons({ ellipsisVerticalOutline, chevronForwardOutline, checkmarkOutline, addOutline, trashOutline, pencilOutline })
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
  }

  resetResource() {//se reinician los datos del usuario nuevo o a editar
    this.resource = {
      OrganizationId: null,
      Code: '',
      Name: '',
      WorkCenterId: null,
      WorkCenter: null,
      Class: '',
      Token: null
    };
  }

  AddNewResource() {
    if(this.organizationSelected) {
      const itemsArray = [this.resource];
      const payload = {
        items: itemsArray
      };
      // console.log(JSON.stringify(payload, null, 2))
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
    }else{
      this.alerts.Info('Seleccione una organización');
    }
  }

  RefreshTables() {
    let clause = `orgResourceMachines/${this.organizationSelected.OrganizationId}`;
    this.apiService.GetRequestRender(clause).then((response: any) => {
      response.totalResults == 0 && this.alerts.Warning(response.message);
      this.dbData = response;      
    });

    this.searchValueDB = '';
  }
  
}
