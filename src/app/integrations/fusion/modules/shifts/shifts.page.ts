import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton, IonTitle, IonToolbar
} from '@ionic/angular/standalone';

import {ApiService} from "../../../../services/api.service";
import {EndpointsService} from "../../../../services/endpoints.service";
import {AlertsService} from "../../../../services/alerts.service";
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

import {
  closeOutline, cloudOutline, chevronDownOutline, arrowForward, trash, serverOutline
} from 'ionicons/icons';

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
export class ShiftsPage implements OnInit {
  fusionData: any = {};
  dbData: any = {};

  dbOrganizations: any = {};
  organizationSelected: string = '';

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
    this.GetOrganizationsRender();
  }

  GetOrganizationsRender(){
    this.apiService.GetRequestRender(this.endPoints.Render('organizations')).then((response: any) => {
      console.log(response);
      this.dbOrganizations = { ...response };
    });
  }

  OnOrganizationSelected() {
    if(this.organizationSelected) {
      this.GetShifts();
    }
  }

  GetShifts(){
    this.apiService.GetRequestFusion(this.endPoints.Path('shifts')).then((response: any) => {
      const data = JSON.parse(response);
      this.fusionData = { ...data };

      // Inicializar propiedad selected para FUSION (solo items filtrados)
      if (this.fusionData.items) {
        this.fusionData.items = this.fusionData.items.map((item: any) => ({
          ...item,
          selected: false
        }));
      }
    });
  }

  //Metodo para manejar el filtro global
  OnFilterGlobal(event: Event, table: any) {
    const target = event.target as HTMLInputElement;
    table.filterGlobal(target.value, 'contains');
  }

  //Metodo para cargar organizaciones seleccionadas de FUSION
  UploadShifts() {
    if (this.fusionData.items) {

      if (this.selectedItemsFusion.length === 0) {
        this.alerts.Warning("Seleccione algún elemento para cargar");
        return;
      }

      console.log('Fusion:', this.selectedItemsFusion);

      const itemsData = this.selectedItemsFusion.map((item: any) => ({
        OrganizationId: item.OrganizationId,
        Code: item.OrganizationCode,
        Name: item.OrganizationName,
        Location: item.LocationCode,
        WorkMethod: item.plantParameters.items[0].DefaultWorkMethod,
        BUId: item.ManagementBusinessUnitId
      }));

      const payload = {
        items: itemsData
      };

      this.apiService.PostRequestRender(this.endPoints.Render('organizations'), payload).then(async (response: any) => {
        if(response.errorsExistFlag) {
          this.alerts.Info(response.message);
        }else {
          this.alerts.Success(response.message);

          setTimeout(() => {
            window.location.reload();
          }, 3000);

        }
      });

    }
  }

  //Metodo para eliminar organizaciones seleccionadas de DB
  async DeleteShifts() {
    if (this.dbData.items) {

      if (this.selectedItemsDB.length === 0) {
        this.alerts.Warning("Seleccione algún elemento para eliminar");
        return;
      }

      console.log('DB:', this.selectedItemsDB);

      try {
        let successCount = 0;

        // Eliminar uno por uno (secuencial)
        for (const item of this.selectedItemsDB) {
          const response = await this.apiService.DeleteRequestRender(
            this.endPoints.Render('organizations/' + item.OrganizationId)
          );

          if (!response.errorsExistFlag) {
            successCount++;
          }
        }

        this.alerts.Success(`Organizaciones eliminadas [${successCount}/ ${this.selectedItemsDB.length}]`);

        // Recargar la página solo si hubo eliminaciones exitosas
        if (successCount > 0) {
          setTimeout(() => {
            window.location.reload();
          }, 3000);
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

}
