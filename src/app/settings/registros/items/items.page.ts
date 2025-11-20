import { ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA, Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { ellipsisVerticalOutline, chevronForwardOutline, checkmarkOutline, addOutline, trashOutline, pencilOutline, menuOutline, timeOutline } from 'ionicons/icons';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, IonIcon, IonMenuButton, IonItem,
  IonInput, IonText, IonLabel, IonToggle
} from '@ionic/angular/standalone';
import { Button, ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconField, IconFieldModule } from 'primeng/iconfield';
import { InputIcon, InputIconModule } from 'primeng/inputicon';
import { TableModule } from 'primeng/table';
import { Select } from 'primeng/select';
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
import { ConfirmationService } from "primeng/api";

@Component({
  selector: 'app-items',
  templateUrl: './items.page.html',
  styleUrls: ['./items.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonMenuButton,
    IonButton, IonIcon, IonBreadcrumbs, IonBreadcrumb, FloatLabel, Select, PrimeTemplate, TableModule, ButtonModule,
    IonText, IonItem, DialogModule, Dialog, InputIconModule, IconFieldModule, IonInput, InputTextModule, IonLabel,
    IonToggle]
})
export class ItemsPage implements OnInit {

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
  
  selectedItems: any[] = [];
  isNewFlag: boolean = true;
  isModalOpen: boolean = false;

  companyId: number | undefined; 
  lotFlag: boolean = false;

  item: any = {
    ItemId: null,
    CompanyId: null,
    Number: '',
    Description: '',
    UoM: '',
    Type: '',
    LotControl: ''
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
    this.userData = JSON.parse(String(localStorage.getItem("userData")));
    if (this.userData) {      
      this.companyId = this.userData.Company.CompanyId;    
      this.RefreshTables();      
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
    let clause = `items/${this.companyId}/Todos`;
    this.apiService.GetRequestRender(clause).then((response: any) => {
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

  OpenAsNewItem() {
    this.resetItem()
    this.isNewFlag = true
    this.item.CompanyId = this.companyId
    this.isModalOpen = true;
    this.item.LotControl = false;

    const contentPart = document.querySelector('ion-modal.dispach-modal')?.shadowRoot?.querySelector('[part="content"]');
    if (contentPart) {
      const rect = contentPart.getBoundingClientRect();
      this.modalSize = `Modal: ${Truncate(rect.width)} x ${Truncate(rect.height)} | Viewport: ${window.innerWidth} (${((rect.width / window.innerWidth) * 100).toFixed(2)}%)`;
    }
  }

  resetItem() {//se reinician los datos del usuario nuevo o a editar
    this.item = {
      ItemId: null,
      CompanyId: null,
      Number: '',
      Description: '',
      UoM: '',
      Type: '',
      LotControl: ''      
    };
  } 
  
  AddOrEditItem() {
    this.formatLotControl();
    const itemsArray = [this.item];

    if (this.isNewFlag) {    
        const payload = {
          CompanyId: this.companyId,
          items: itemsArray
        };
        
        this.apiService.PostRequestRender('items', payload).then(async (response: any) => {
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
      const payload = {
        items: itemsArray
      };

      this.apiService.PutRequestRender('items/' + this.item.ItemId, payload).then(async (response: any) => {
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

  async DeleteItems() {
    if (this.selectedItems.length === 0) {
      this.alerts.Warning("Seleccione algún elemento para eliminar");
      return;
    }

    const payload = {
      items: this.selectedItems
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
          this.apiService.DeleteMultipleRequestRender('items', payload).then(async (response: any) => {
            if (!response.errorsExistFlag) {
              this.alerts.Success("Eliminación exitosa");
              this.RefreshTables();
              this.selectedItems = [];
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

  EditItem(it: any) {    
    // this.item = it;
    this.item.ItemId = it.ItemId;
    this.item.CompanyId = it.Company;
    this.item.Number = it.Number;
    this.item.Description = it.Description;
    this.item.UoM = it.UoM;
    this.item.Type = it.Type;

    if (it.LotControl === null || it.LotControl == '' || it.LotControl === 'N'){
      this.lotFlag = false;
      this.item.LotControl = 'N';
    }else{
      this.lotFlag = true;
      this.item.LotControl = 'Y';
    }

    console.log(JSON.stringify(this.item, null, 2));
    this.isNewFlag = false
    this.isModalOpen = true

    this.changeDetector.detectChanges()    
  }

  ClearData(table: any) {
    table.clear();
    this.searchValueDB = '';
  }

  formatLotControl(){    
    if (this.lotFlag){
      this.item.LotControl = 'Y'
    } else {
      this.item.LotControl = 'N'
    }
  }
  
}

