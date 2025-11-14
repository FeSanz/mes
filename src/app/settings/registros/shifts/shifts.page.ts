import { ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA, Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { ellipsisVerticalOutline, chevronForwardOutline, checkmarkOutline, addOutline, trashOutline, pauseSharp, pencilOutline, menuOutline, timeOutline } from 'ionicons/icons';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, IonIcon, IonMenuButton, IonFab, IonFabButton, IonModal, IonItem, 
  IonInput, IonSelect, IonSelectOption, IonToggle, IonText, IonLabel } from '@ionic/angular/standalone';
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
import {Tag} from "primeng/tag";
import {ConfirmDialog} from "primeng/confirmdialog";
import {Toast} from "primeng/toast";
import {ProgressSpinner} from "primeng/progressspinner";
import { DatePicker } from 'primeng/datepicker';
import {ConfirmationService} from "primeng/api";

@Component({
  selector: 'app-shifts',
  templateUrl: './shifts.page.html',
  styleUrls: ['./shifts.page.scss'],
  standalone: true,
    imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, 
    CommonModule, FormsModule, TableModule, CardModule, IonContent, IonTitle, IonToolbar, 
    CommonModule, FormsModule, IonButtons, IonMenuButton, IonFab, IonFabButton, IonModal,
    IonButton, IonIcon, IonItem, IonInput, IonSelect, IonSelectOption, IonToggle,
    TableModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule, TagModule, 
    DropdownModule,MultiSelectModule, Select, FloatLabel, IonText, Dialog, PrimeTemplate, 
    DialogModule, IonBreadcrumb, IonBreadcrumbs, Toast, ConfirmDialog, Tag, ProgressSpinner, IonLabel,
    DatePicker]
})


export class ShiftsPage implements OnInit {

  @ViewChild('regionContainer', { static: false }) regionContainer!: ElementRef;  
  modalSize: string = '';
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
  isFusion: boolean = false;

  searchValueDB: string = '';
  shifts: any = [];
  shift: any = {
    ShiftId: null,
    OrganizationId: null,
    Name: null,
    StartTime: null,
    EndTime: null,
    Duration: null,
    EnabledFlag: 'Y'
  };

  isNewFlag: boolean = true;
  isModalOpen: boolean = false;
  userData: any = {};
  validationMessage: string = '';
  selectedShifts: any[] = [];

  constructor(private apiService: ApiService,
    private endPoints: EndpointsService,
    public alerts: AlertsService,
    public permissions: PermissionsService,
    private changeDetector: ChangeDetectorRef,
    private confirmationService: ConfirmationService
  ) {

    addIcons({ menuOutline, checkmarkOutline, addOutline, ellipsisVerticalOutline, chevronForwardOutline, 
      trashOutline, pencilOutline, timeOutline });    
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
      let clause = `shifts/${this.organizationSelected.OrganizationId}`;
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

  OpenAsNewShift() {    
    this.resetShift()
    this.isNewFlag = true
    this.shift.OrganizationId = this.orgSelect
    this.isModalOpen = true;  

    const contentPart = document.querySelector('ion-modal.dispach-modal')?.shadowRoot?.querySelector('[part="content"]');
    if (contentPart) {
      const rect = contentPart.getBoundingClientRect();
      this.modalSize = `Modal: ${Truncate(rect.width)} x ${Truncate(rect.height)} | Viewport: ${window.innerWidth} (${((rect.width / window.innerWidth) * 100).toFixed(2)}%)`;
    }
  }

  resetShift() {//se reinician los datos del usuario nuevo o a editar
    this.shift = {
      ShiftId: null,
      OrganizationId: null,      
      Name: '',
      StartTime: '',
      EndTime: '',
      Duration: null,
      EnabledFlag: 'Y'
    };
  }

  AddOrEditShift() {   
    const itemsArray = [this.shift]; 
    this.shift.StartTime = this.formatTime(this.shift.StartTime); 
    this.shift.EndTime = this.formatTime(this.shift.EndTime); 

    const validation = this.isValidShift(this.shift);
    if (!validation.isValid) {
      this.alerts.Info(validation.message);
      this.alerts.HideLoading();
      return; // Detener ejecución si no es válido
    }

    if (this.isNewFlag) {
      if (this.organizationSelected) {  
        const payload = {
          OrganizationId: this.shift.OrganizationId,
          items: itemsArray
        };             

        this.apiService.PostRequestRender('shifts', payload).then(async (response: any) => {
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

      this.apiService.PutRequestRender('shifts/' + this.shift.ShiftId, payload).then(async (response: any) => {
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

  async DeleteShifts() {
    if (this.selectedShifts.length === 0) {
      this.alerts.Warning("Seleccione algún elemento para eliminar");
      return;
    }    

    const payload = {
      items: this.selectedShifts
    }

    console.log(JSON.stringify(payload, null, 2));
    
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
          this.apiService.DeleteMultipleRequestRender('shifts', payload).then(async (response: any) => {
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

  EditShift(sh: any) {
    this.shift = sh;
    this.isNewFlag = false
    this.isModalOpen = true
    this.changeDetector.detectChanges()    
  }

  RefreshTables() {
    let clause = `shifts/${this.organizationSelected.OrganizationId}`;
    this.apiService.GetRequestRender(clause).then((response: any) => {
      response.totalResults == 0 && this.alerts.Warning(response.message);
      this.dbData = response;           
    });

    this.searchValueDB = '';    
  }

  formatTime(timeValue: any): string {
    // Si ya es string en formato "HH:MM", devolverlo tal cual
    if (this.isTimeString(timeValue)) {
      return timeValue;
    }
    
    // Si es un objeto Date válido
    if (timeValue instanceof Date && !isNaN(timeValue.getTime())) {
      return this.extractTimeFromDate(timeValue);
    }
    
    // Si es null, undefined o tipo no reconocido
    return timeValue || '';
  }
  
  extractTimeFromDate(date: Date): string {
    if (!date) return '';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // Función para detectar si ya está en formato "HH:MM"
  private isTimeString(value: any): boolean {
    if (typeof value !== 'string') return false;
    // Verificar formato HH:MM (06:00, 23:59, etc.)
    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
  }

  isValidShift(newShift: any): { isValid: boolean; message: string } {
    try {
      if (!this.dbData?.items || !Array.isArray(this.dbData.items)) {
        console.warn('No hay turnos existentes para validar');
        return { isValid: true, message: '' };
      }

      const newStart = this.timeToMinutes(newShift.StartTime);
      const newEnd = this.timeToMinutes(newShift.EndTime);

      // Validación especial para turnos nocturnos (que cruzan medianoche)
      const isOvernightShift = newEnd <= newStart;
      
      if (!isOvernightShift && newStart >= newEnd) {
        return { isValid: false, message: 'La hora de inicio debe ser menor a la hora de fin' };
      }

      for (const existingShift of this.dbData.items) {
        // Excluir el turno actual en edición
        if (!this.isNewFlag && existingShift.ShiftId === this.shift.ShiftId) {
          continue;
        }

        if (existingShift.EnabledFlag === 'N') {
          continue;
        }

        const existingStart = this.timeToMinutes(existingShift.StartTime);
        const existingEnd = this.timeToMinutes(existingShift.EndTime);
        const isExistingOvernight = existingEnd <= existingStart;

        // Verificar solapamiento considerando turnos nocturnos
        if (this.isOverlapping(newStart, newEnd, existingStart, existingEnd, isOvernightShift, isExistingOvernight)) {
          return { 
            isValid: false, 
            message: `El turno se solapa con "${existingShift.Name}" (${existingShift.StartTime} - ${existingShift.EndTime})` 
          };
        }
      }

      return { isValid: true, message: '' };
      
    } catch (error) {
      console.error('Error en validación de turno:', error);
      return { isValid: true, message: '' };
    }
  }

  private isOverlapping(
    start1: number, 
    end1: number, 
    start2: number, 
    end2: number,
    isOvernight1: boolean = false,
    isOvernight2: boolean = false
  ): boolean {
    
    // Caso 1: Ambos turnos son normales (no cruzan medianoche)
    if (!isOvernight1 && !isOvernight2) {
      // Permitir que un turno termine exactamente cuando otro comienza
      return (start1 < end2 && end1 > start2) && !(end1 === start2 || end2 === start1);
    }

    // Caso 2: Nuevo turno es nocturno, existente es normal
    if (isOvernight1 && !isOvernight2) {
      // El turno nocturno se divide en dos partes: [start1, 1440] y [0, end1]
      const overlapsFirstPart = start1 < end2; // Parte tarde/noche
      const overlapsSecondPart = end1 > start2; // Parte madrugada
      return overlapsFirstPart || overlapsSecondPart;
    }

    // Caso 3: Nuevo turno es normal, existente es nocturno
    if (!isOvernight1 && isOvernight2) {
      // El turno existente se divide en dos partes: [start2, 1440] y [0, end2]
      const overlapsFirstPart = start1 < end2; // Con la parte madrugada del existente
      const overlapsSecondPart = end1 > start2; // Con la parte tarde/noche del existente
      return overlapsFirstPart || overlapsSecondPart;
    }

    // Caso 4: Ambos turnos son nocturnos
    if (isOvernight1 && isOvernight2) {
      // Ambos cruzan medianoche, siempre se solapan a menos que sean exactamente iguales
      return !(start1 === start2 && end1 === end2);
    }

    return false;
  }

  validateShift() {
    if (this.shift.StartTime && this.shift.EndTime) {
      const validation = this.isValidShift(this.shift);
      this.validationMessage = validation.isValid ? '' : validation.message;
    }
  }

  private timeToMinutes(time: string | Date): number {
    if (!time) return 0;
    
    let timeString: string;
    
    if (time instanceof Date) {
      // Si es Date, extraer hora y minutos
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      timeString = `${hours}:${minutes}`;
    } else {
      timeString = time;
    }
    
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  protected readonly ToggleMenu = ToggleMenu;
}

