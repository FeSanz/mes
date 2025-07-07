import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';

import {ApiService} from "../../../../services/api.service";
import {EndpointsService} from "../../../../services/endpoints.service";
import {AlertsService} from "../../../../services/alerts.service";
import {HeightTable} from "../../../../models/tables.prime";
import {addIcons} from "ionicons";

import {TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {DropdownModule} from 'primeng/dropdown';
import {MultiSelectModule} from 'primeng/multiselect';

import {arrowForward, chevronDownOutline, closeOutline, cloudOutline, serverOutline, trash} from 'ionicons/icons';


@Component({
  selector: 'app-organizations',
  templateUrl: './organizations.page.html',
  styleUrls: ['./organizations.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonMenuButton,
    IonButton, IonIcon,
    TableModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule, TagModule,DropdownModule,
    MultiSelectModule ]
})
export class OrganizationsPage implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('regionContainer', { static: false }) regionContainer!: ElementRef;
  private resizeObserver!: ResizeObserver;
  scrollHeight: string = '550px';
  rowsPerPage: number = 50;
  rowsPerPageOptions: number[] = [10, 25, 50];

  userData: any = {};

  fusionOriginalData: any = {};
  fusionData: any = {};
  dbData: any = {};

  selectedItemsFusion: any[] = [];
  selectedItemsDB: any[] = [];

  searchValueFusion: string = '';
  searchValueDB: string = '';

  constructor(private apiService: ApiService,
              private endPoints: EndpointsService,
              private alerts: AlertsService) {
    addIcons({
      closeOutline, cloudOutline, chevronDownOutline, arrowForward, trash, serverOutline
    });
  }

  ngOnInit() {
    this.userData = JSON.parse(String(localStorage.getItem("userData")));
    this.GetOrganizations();
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

  GetOrganizations(){
    this.apiService.GetRequestRender(`organizations/${this.userData.Company.CompanyId}`).then((response: any) => {
      this.dbData = response;

      this.apiService.GetRequestFusion(this.endPoints.Path('organizations')).then((response: any) => {
        this.fusionData = JSON.parse(response);
        this.fusionOriginalData = JSON.parse(JSON.stringify(this.fusionData)); // Guardar estructura original

        this.FilterRegisteredItems();
      });
    });
  }

  //Metodo para manejar el filtro global
  OnFilterGlobal(event: Event, table: any) {
    const target = event.target as HTMLInputElement;
    table.filterGlobal(target.value, 'contains');
  }

  FilterRegisteredItems() {
    if (this.fusionOriginalData.items && this.dbData.items) {
      // Set de ID's para filtrar posteriormente
      const dbOrganizationCodes = new Set(this.dbData.items.map((item: any) => String(item.Code)));
      // Filtrar items de fusion que no estén en DB
      this.fusionData.items = this.fusionOriginalData.items.filter((fusionItem: any) => {
        return !dbOrganizationCodes.has(String(fusionItem.OrganizationCode));
      });
    }else{ //Si DB no tiene datos a comparar, solo imprimir datos originales de Fusion
      if(this.fusionOriginalData.items) {
        this.fusionData = JSON.parse(JSON.stringify(this.fusionOriginalData));
      }
    }
  }

  //Metodo para cargar organizaciones seleccionadas de FUSION
  UploadOrganization() {
    if (this.fusionData.items) {
      if (this.selectedItemsFusion.length === 0) {
        this.alerts.Warning("Seleccione algún elemento para cargar");
        return;
      }

      const itemsData = this.selectedItemsFusion.map((item: any) => ({
        CompanyId: this.userData.Company.CompanyId,
        Code: item.OrganizationCode,
        Name: item.OrganizationName,
        Location: item.LocationCode,
        WorkMethod: this.WorkMethodFormat(item.plantParameters.items[0].DefaultWorkMethod),
        BUId: item.ManagementBusinessUnitId,
        Coordinates: null
      }));

      const payload = {
        items: itemsData
      };

      this.apiService.PostRequestRender('organizations', payload).then(async (response: any) => {
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

  WorkMethodFormat(mfgType: string){
    return mfgType === 'PROCESS_MANUFACTURING' ? 'PROCESOS' : mfgType === 'DISCRETE_MANUFACTURING' ? 'DISCRETA' : 'NA';
  }

  //Metodo para eliminar organizaciones seleccionadas de DB
  async DeleteOrganizations() {
    if (this.dbData.items) {
      if (this.selectedItemsDB.length === 0) {
        this.alerts.Warning("Seleccione algún elemento para eliminar");
        return;
      }

      try {
        let successCount = 0;

        // Eliminar uno por uno (secuencial)
        for (const item of this.selectedItemsDB) {
          const response = await this.apiService.DeleteRequestRender('organizations/' + item.OrganizationId);

          if (!response.errorsExistFlag) {
            successCount++;
          }
        }

        this.alerts.Success(`Organizaciones eliminadas [${successCount}/ ${this.selectedItemsDB.length}]`);

        // Recargar la página solo si hubo eliminaciones exitosas
        if (successCount > 0) {
          setTimeout(() => {
            this.RefreshTables();
          }, 1500);
        }

      } catch (error) {
        console.error('Error al eliminar organizaciones:', error);
        this.alerts.Error('Error al eliminar las organizaciones');
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
    this.apiService.GetRequestRender('organizations').then((response: any) => {
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
}
