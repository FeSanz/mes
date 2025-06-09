import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { IonContent, IonHeader, IonTitle, IonToolbar, } from '@ionic/angular/standalone';
import { AlertsService } from 'src/app/services/alerts.service';
import { EndpointsService } from 'src/app/services/endpoints.service';
import { ApiService } from 'src/app/services/api.service';
import { TableModule } from 'primeng/table';
import { addIcons } from 'ionicons';
import { ellipsisVerticalOutline,chevronForwardOutline } from 'ionicons/icons';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-users',
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
  standalone: true,
  imports: [/*IonContent, IonHeader, IonTitle, IonToolbar,*/IonicModule, CommonModule, FormsModule, TableModule, CardModule]
})
export class UsersPage implements OnInit {
  users: any = []
  selectedItems: any = []
  constructor(private apiService: ApiService,
    private endPoints: EndpointsService,
    private alerts: AlertsService) {
    addIcons({ ellipsisVerticalOutline,chevronForwardOutline })
  }

  ngOnInit() {
    this.GetOrganizations();
  }

  GetOrganizations() {
    this.apiService.GetRequestRender('/users/300000003173662').then((response: any) => {
      //const data = response;
      console.log(response);
      this.users = { ...response };

      // Inicializar propiedad selected para DB
      if (this.users.items) {
        this.users.items = this.users.items.map((item: any) => ({
          ...item,
          selected: false
        }));
      }
      console.log(this.users);
      /*
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
      
            });*/
    });
  }
}
