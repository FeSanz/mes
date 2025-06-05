import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

import {
  IonAvatar, IonButton, IonButtons, IonCheckbox, IonContent, IonHeader, IonIcon, IonMenuButton, IonProgressBar,
  IonTitle, IonToolbar
} from '@ionic/angular/standalone';

import {
  closeOutline, cloudOutline, chevronDownOutline, arrowForward, trash, serverOutline
} from 'ionicons/icons';
import {dt} from "@primeng/themes";

@Component({
  selector: 'app-organizations',
  templateUrl: './organizations.page.html',
  styleUrls: ['./organizations.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonMenuButton,
            IonCheckbox, IonAvatar, IonProgressBar, IonButton, IonIcon,
            TableModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule, TagModule,DropdownModule,
            MultiSelectModule  ]
})
export class OrganizationsPage implements OnInit {
  fusionData: any = {};
  dbData: any = {};

  selectedItemsFusion: any[] = [];
  selectedItemsDB: any[] = [];

  searchValueFusion: string = '';
  searchValueDB: string = '';

  constructor(private apiService: ApiService,
              private endPoints: EndpointsService,
              private alerts: AlertsService,) {
    addIcons({
      closeOutline, cloudOutline, chevronDownOutline, arrowForward, trash, serverOutline
    });
  }

  ngOnInit() {
    this.GetOrganizations();
  }

  GetOrganizations(){
    this.apiService.GetRequestRender(this.endPoints.Render('organizations')).then((response: any) => {
      //const data = response;
      console.log(response);
      this.dbData = { ...response };

      // Inicializar propiedad selected para DB
      if (this.dbData.items) {
        this.dbData.items = this.dbData.items.map((item: any) => ({
          ...item,
          selected: false
        }));
      }

      this.apiService.GetRequestFusion(this.endPoints.Path('organizations')).then((response: any) => {
        const data = JSON.parse(response);
        this.fusionData = { ...data };

        if (this.fusionData.items && this.dbData.items) {
          // Set de ID's para filtrar posteriormente
          const dbOrganizationIds = new Set(this.dbData.items.map((item: any) => String(item.OrganizationId)));
          // Filtrar items de fusion que no estén en DB
          this.fusionData.items = this.fusionData.items.filter((fusionItem: any) => {
            return !dbOrganizationIds.has(String(fusionItem.OrganizationId));
          });
        }

        // Inicializar propiedad selected para FUSION (solo items filtrados)
        if (this.fusionData.items) {
          this.fusionData.items = this.fusionData.items.map((item: any) => ({
            ...item,
            selected: false
          }));
        }

      });
    });
  }

  //Metodo para manejar el filtro global
  onFilterGlobal(event: Event, table: any) {
    const target = event.target as HTMLInputElement;
    table.filterGlobal(target.value, 'contains');
  }

  //Metodo para cargar organizaciones seleccionadas de FUSION
  UploadOrganization() {
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
  async DeleteOrganizations() {
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

  clearFusion(table: any) {
    table.clear();
    this.searchValueFusion = '';
  }

  clearDB(table: any) {
    table.clear();
    this.searchValueDB = '';
  }

  protected readonly trash = trash;
  protected readonly dt = dt;
}
