import { ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA, Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { ellipsisVerticalOutline, chevronForwardOutline, checkmarkOutline, addOutline, 
  trashOutline, pencilOutline, menuOutline, timeOutline, keyOutline, square } from 'ionicons/icons';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, IonIcon, IonMenuButton, IonItem,
  IonInput, IonText, IonLabel, IonToggle
} from '@ionic/angular/standalone';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TableModule } from 'primeng/table';
import { Select } from 'primeng/select';
import { FloatLabel } from "primeng/floatlabel"
import { HeightTable } from "../../models/tables.prime";
import { ApiService } from "../../services/api.service";
import { AlertsService } from "../../services/alerts.service";
import { ToggleMenu } from 'src/app/models/design';
import { Truncate } from "../../models/math.operations";
import { Dialog } from "primeng/dialog";
import { PrimeTemplate } from "primeng/api";
import { DialogModule } from 'primeng/dialog';
import { IonBreadcrumb, IonBreadcrumbs } from '@ionic/angular/standalone';
import { ConfirmationService } from "primeng/api";
import { Observable } from 'rxjs/internal/Observable';

@Component({
  selector: 'app-verification-codes',
  templateUrl: './verification-codes.page.html',
  styleUrls: ['./verification-codes.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonMenuButton,
    IonButton, IonIcon, IonBreadcrumbs, IonBreadcrumb, FloatLabel, Select, PrimeTemplate, TableModule, ButtonModule,
    IonText, IonItem, DialogModule, Dialog, InputIconModule, IconFieldModule, IonInput, InputTextModule, IonLabel,
    IonToggle]
})
export class VerificationCodesPage implements OnInit {
  
    @ViewChild('regionContainer', { static: false }) regionContainer!: ElementRef;
    modalSize: string = '';
    private resizeObserver!: ResizeObserver;
    scrollHeight: string = '550px';
    rowsPerPage: number = 50;
    rowsPerPageOptions: number[] = [10, 25, 50];
    
    protected readonly ToggleMenu = ToggleMenu;

    userData: any = {};    
    dbData: any = {};
    searchValueDB: string = '';
    
    selectedCodes: any[] = [];
    isNewFlag: boolean = true;
    isModalOpen: boolean = false;          
  
    cod: any = {
      Id: null,
      Code: '',
      EnabledFlag: '',
      UsedDate: '',
      CreatedDate: ''
    };
  

  constructor(
    private apiService: ApiService,
    public alerts: AlertsService,
    private changeDetector: ChangeDetectorRef,
    private confirmationService: ConfirmationService
  ) { 
    addIcons({menuOutline,square,checkmarkOutline,addOutline,ellipsisVerticalOutline,chevronForwardOutline,trashOutline,pencilOutline,timeOutline,keyOutline});
  }

  ngOnInit() {    
    this.RefreshTables();          
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
    this.apiService.GetRequestRender('codes').then((response: any) => {
      response.totalResults == 0 && this.alerts.Warning(response.message);
      this.dbData = response;      
    });

    this.searchValueDB = '';
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

  resetCode() {//se reinician los datos del usuario nuevo o a editar
    this.cod = {
      Id: null,
      Code: '',
      EnabledFlag: '',
      UsedDate: '',
      CreatedDate: ''    
    };
  } 
  
  async AddCode() {   
    this.cod.Code = await this.generarCodigoUnico();      
    const itemsArray = [this.cod];    
      
    const payload = {          
      items: itemsArray
    };
               
    this.apiService.PostRequestRender('codes', payload).then(async (response: any) => {
      if (response.errorsExistFlag) {
        this.alerts.Info(response.message);
      } else {
        this.alerts.Success(response.message);
        this.resetCode()

        setTimeout(() => {
          this.RefreshTables();
        }, 1500);

      }
    });
              
  }

  async DeleteCodes() {
    if (this.selectedCodes.length === 0) {
      this.alerts.Warning("Seleccione algún elemento para eliminar");
      return;
    }

    const payload = {
      items: this.selectedCodes
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
          this.apiService.DeleteMultipleRequestRender('codes', payload).then(async (response: any) => {
            if (!response.errorsExistFlag) {
              this.alerts.Success("Eliminación exitosa");
              this.RefreshTables();
              this.selectedCodes = [];
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
  
  ClearData(table: any) {
    table.clear();
    this.searchValueDB = '';
  }

  // Verificar si el código existe en la base de datos
  private async verificarCodigoEnBD(codigo: string): Promise<boolean> {
    try {
      const response = await this.apiService.GetRequestRender('codes/'+ codigo);      
      if (response.errorsExistFlag && response.message === 'Registro no encontrado') {
        return true; 
      } else {
        return false;
      }
    } catch (error) {    
      console.error('Error al verificar código en BD:', error);
      return false;
    }
  }

  // Generar un código único
  async generarCodigoUnico(): Promise<string> {
    let esUnico = false;
    let codigo = '';
        
    while (!esUnico) {      
      codigo = crypto.randomUUID().toString().substring(0, 6).toUpperCase(); 
      
      // Check against the database
      const existe = await this.verificarCodigoEnBD(codigo);      
      esUnico = existe; 
    }
    
    return codigo;
  }    
}

