import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import {Button} from "primeng/button";
import {FloatLabel} from "primeng/floatlabel";
import {IconField} from "primeng/iconfield";
import {InputIcon} from "primeng/inputicon";
import {InputText} from "primeng/inputtext";
import {PrimeTemplate} from "primeng/api";
import {Select} from "primeng/select";
import {TableModule} from "primeng/table";
import {ApiService} from "../../../../services/api.service";
import {EndpointsService} from "../../../../services/endpoints.service";
import {AlertsService} from "../../../../services/alerts.service";
import {addIcons} from "ionicons";
import {arrowForward, chevronDownOutline, closeOutline, cloudOutline, serverOutline, trash} from "ionicons/icons";
import {HeightTable} from "../../../../models/tables.prime";

@Component({
  selector: 'app-wc',
  templateUrl: './wc.page.html',
  styleUrls: ['./wc.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, Button, FloatLabel, IconField, InputIcon, InputText, IonButton, IonButtons, IonIcon, IonMenuButton, PrimeTemplate, Select, TableModule]
})
export class WcPage implements OnInit, AfterViewInit, OnDestroy{

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

  async OnOrganizationSelected() {
    if(this.organizationSelected) {
      let clause = `workCenters/${this.organizationSelected.OrganizationId}`;
      this.apiService.GetRequestRender(clause).then((response: any) => {
        response.totalResults == 0 && this.alerts.Warning(response.message);
        this.dbData = response;

        this.apiService.GetRequestFusion(this.endPoints.Path('work_centers', this.organizationSelected.Code)).then(async (response: any) => {
          this.fusionData = JSON.parse(response);

          this.fusionOriginalData = JSON.parse(JSON.stringify(this.fusionData)); // Guardar estructura original

          this.FilterRegisteredItems();
        });
      });
    }
  }

  OnFilterGlobal(event: Event, table: any) {
    const target = event.target as HTMLInputElement;
    table.filterGlobal(target.value, 'contains');
  }

  FilterRegisteredItems() {
    if (this.fusionOriginalData.items && this.dbData.items) {
      // Set de ID's para filtrar posteriormente
      const dbOrdersNumbers = new Set(this.dbData.items.map((item: any) => String(item.WorkCenterCode)));
      // Filtrar items de fusion que no estén en DB
      this.fusionData.items = this.fusionOriginalData.items.filter((fusionItem: any) => {
        return !dbOrdersNumbers.has(String(fusionItem.WorkCenterCode));
      });
    }else{ //Si DB no tiene datos a comparar, solo imprimir datos originales de Fusion
      if(this.fusionOriginalData.items) {
        this.fusionData = JSON.parse(JSON.stringify(this.fusionOriginalData));
      }
    }
  }

  UploadWorkCenters() {
    if (this.fusionData.items) {

      if (this.selectedItemsFusion.length === 0) {
        this.alerts.Warning("Seleccione algún elemento para cargar");
        return;
      }

      console.log(this.selectedItemsFusion);

      const itemsData = this.selectedItemsFusion.map((item: any) => ({
        WorkCenterCode: item.WorkCenterCode,
        WorkCenterName: item.WorkCenterName,
        WorkAreaCode: item.WorkAreaCode,
        WorkAreaName: item.WorkAreaName
      }));

      const payload = {
        OrganizationId: this.organizationSelected.OrganizationId,
        items: itemsData
      };

      this.apiService.PostRequestRender('workCenters', payload).then(async (response: any) => {
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

  async DeleteWorkCenters() {
    if (this.dbData.items) {

      if (this.selectedItemsDB.length === 0) {
        this.alerts.Warning("Seleccione algún elemento para eliminar");
        return;
      }

      try {
        let successCount = 0;

        // Eliminar uno por uno (secuencial)
        for (const item of this.selectedItemsDB) {
          const response = await this.apiService.DeleteRequestRender('workCenters/' + item.WorkCenterId);

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
    let clause = `workCenters/${this.organizationSelected.OrganizationId}`;
    this.apiService.GetRequestRender(clause).then((response: any) => {
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

}
