import {Component, OnInit, ViewChild, ElementRef,  AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton, IonTitle,
  IonToolbar } from '@ionic/angular/standalone';

import {ApiService} from "../../../../services/api.service";
import {EndpointsService} from "../../../../services/endpoints.service";
import {AlertsService} from "../../../../services/alerts.service";
import {HeightTable} from "../../../../models/tables.prime";
import {addIcons} from "ionicons";

import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { FloatLabel } from "primeng/floatlabel"

import { closeOutline, cloudOutline, chevronDownOutline, arrowForward, trash, serverOutline } from 'ionicons/icons';


@Component({
  selector: 'app-shifts',
  templateUrl: './shifts.page.html',
  styleUrls: ['./shifts.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonMenuButton,
  IonButton, IonIcon,
  TableModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule, TagModule,DropdownModule,
  MultiSelectModule, Select, FloatLabel ]
})
export class ShiftsPage implements OnInit, AfterViewInit, OnDestroy {

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

  GetOrganizationsRender(){
    this.apiService.GetRequestRender('organizations').then((response: any) => {
      this.dbOrganizations = response;
    });
  }

  OnOrganizationSelected() {
    if(this.organizationSelected) {
      let clause = `shifts/${this.organizationSelected.OrganizationId}`;
      this.apiService.GetRequestRender(clause).then((response: any) => {
        response.totalResults == 0 && this.alerts.Warning(response.message);
        this.dbData = response;

        this.apiService.GetRequestFusion(this.endPoints.Path('shifts')).then((response: any) => {
          this.fusionData = JSON.parse(response);
          this.fusionOriginalData = JSON.parse(JSON.stringify(this.fusionData)); // Guardar estructura original
        });
      });
    }
  }

  OnFilterGlobal(event: Event, table: any) {
    const target = event.target as HTMLInputElement;
    table.filterGlobal(target.value, 'contains');
  }

  UploadShifts() {
    if (this.fusionData.items) {

      if (this.selectedItemsFusion.length === 0) {
        this.alerts.Warning("Seleccione algún elemento para cargar");
        return;
      }

      const itemsData = this.selectedItemsFusion.map((item: any) => ({
        Name: item.Name,
        StartTime: item.StartTime,
        EndTime: item.EndTime,
        Duration: item.Duration,
        EnabledFlag: 'Y'
      }));

      const payload = {
        OrganizationId: this.organizationSelected.OrganizationId,
        items: itemsData
      };

      this.apiService.PostRequestRender('shifts', payload).then(async (response: any) => {
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

  async DeleteShits() {
    if (this.dbData.items) {

      if (this.selectedItemsDB.length === 0) {
        this.alerts.Warning("Seleccione algún elemento para eliminar");
        return;
      }

      try {
        let successCount = 0;

        // Eliminar uno por uno (secuencial)
        for (const item of this.selectedItemsDB) {
          const response = await this.apiService.DeleteRequestRender('shifts/' + item.ShiftId);

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
    let clause = `shifts/${this.organizationSelected.OrganizationId}`;
    this.apiService.GetRequestRender(clause).then((response: any) => {
      response.totalResults == 0 && this.alerts.Warning(response.message);
      this.dbData = response;

    });

    // Limpiar valores de búsqueda
    this.searchValueFusion = '';
    this.searchValueDB = '';

    // Limpiar selecciones
    this.selectedItemsFusion = [];
    this.selectedItemsDB = [];

  }
}
