import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {ApiService} from "../../../../services/api.service";
import {EndpointsService} from "../../../../services/endpoints.service";
import {AlertsService} from "../../../../services/alerts.service";
import {addIcons} from "ionicons";

import { TableModule } from 'primeng/table';

import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader, IonIcon,
  IonMenuButton,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';

import {
  closeOutline,
  cloudOutline,
  chevronDownOutline,
  arrowForward,
  trash,
  serverOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-organizations',
  templateUrl: './organizations.page.html',
  styleUrls: ['./organizations.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonMenuButton, IonButton, IonIcon, TableModule]
})
export class OrganizationsPage implements OnInit {
  fusionData: any = {};
  dbData: any = {};

  fusionAllSelected = false;
  dbAllSelected = false;

  selectedItemsFusion: any[] = [];
  selectedItemsDB: any[] = [];

  constructor(private apiService: ApiService,
              private endPoints: EndpointsService,
              private alerts: AlertsService,) {
    addIcons({
      closeOutline,
      cloudOutline,
      chevronDownOutline,
      arrowForward,
      trash,
      serverOutline
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

  // Métodos para FUSION
  toggleFusionAll() {
    if (this.fusionData.items) {
      this.fusionData.items.forEach((item: any) => {
        item.selected = this.fusionAllSelected;
      });
    }
  }

  updateAllSelectedFusionState() {
    if (this.fusionData.items && this.fusionData.items.length > 0) {
      this.fusionAllSelected = this.fusionData.items.every((item: any) => item.selected);
    }
  }

  // Métodos para DB
  toggleDbAll() {
    if (this.dbData.items) {
      this.dbData.items.forEach((item: any) => {
        item.selected = this.dbAllSelected;
      });
    }
  }

  updateAllSelectedDbState() {
    if (this.dbData.items && this.dbData.items.length > 0) {
      this.dbAllSelected = this.dbData.items.every((item: any) => item.selected);
    }
  }

  // Método para cargar organizaciones seleccionadas de FUSION
  UploadOrganization() {
    if (this.fusionData.items) {
      //const selectedItems = this.fusionData.items.filter((item: any) => item.selected);

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

// Método para eliminar organizaciones seleccionadas de DB
  async DeleteOrganizations() {
    if (this.dbData.items) {
      //const selectedItems = this.dbData.items.filter((item: any) => item.selected);

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
}
