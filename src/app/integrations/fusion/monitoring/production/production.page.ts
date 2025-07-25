import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonButtons, IonCard, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonMenuButton, IonRow, IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { Platform } from '@ionic/angular';

import {ApiService} from "../../../../services/api.service";
import {EndpointsService} from "../../../../services/endpoints.service";
import {AlertsService} from "../../../../services/alerts.service";
import {HeightTable} from "../../../../models/tables.prime";
import {FormatForDisplayFromISO} from "../../../../models/date.format";
import {addIcons} from "ionicons";

import { Button } from "primeng/button";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { InputText } from "primeng/inputtext";
import { PrimeTemplate } from "primeng/api";
import { TableModule } from "primeng/table";
import { Badge } from "primeng/badge";
import { Tag } from "primeng/tag";
import { ProgressBar } from "primeng/progressbar";
import {Slider} from "primeng/slider";
import {WebSocketService} from "../../../../services/web-socket.service";
import {FloatLabel} from "primeng/floatlabel";
import {Select} from "primeng/select";


@Component({
  selector: 'app-production',
  templateUrl: './production.page.html',
  styleUrls: ['./production.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonMenuButton, IonButton,
    IonCard, IonCol, IonGrid, IonIcon, IonRow, Button, IconField, InputIcon, InputText, PrimeTemplate, TableModule,
    Badge, Tag, ProgressBar, Slider, FloatLabel, Select]
})
export class ProductionPage implements OnInit, AfterViewInit  {
  scrollHeight: string = '550px';
  rowsPerPage: number = 50;
  rowsPerPageOptions: number[] = [10, 25, 50];

  userData: any = {};
  workOrders: any = { items: [] };
  progressValue: number[] = [0, 100];

  searchValueWO: string = '';

  organizationSelected: string | any = '';

  constructor(private apiService: ApiService,
              private endPoints: EndpointsService,
              private alerts: AlertsService,
              private platform: Platform,
              private websocket: WebSocketService) { }

  ngOnInit() {
    this.userData = JSON.parse(String(localStorage.getItem("userData")));
    if (this.userData && this.userData.Company && this.userData.Company.Organizations) {

      const organizations = this.userData.Company.Organizations;

      // Validar si hay organizaciones
      if (organizations && Array.isArray(organizations) && organizations.length > 0) {
        const sortedOrganizations = organizations.sort((a, b) => a.OrganizationId - b.OrganizationId);
        this.organizationSelected = sortedOrganizations[0];
        this.GetWorkOrders();
      }else{
        this.alerts.Warning("No se encontraron organizaciones");
      }
    }
  }

  ngAfterViewInit() {
    this.UpdateScrollHeight();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.UpdateScrollHeight();
  }

  private UpdateScrollHeight() {
    this.scrollHeight = HeightTable(this.platform.height());
  }

  GetWorkOrders(){
    this.workOrders = { items: [] };
    this.apiService.GetRequestRender(`workOrders/${this.organizationSelected.OrganizationId}`).then((response: any) => {
      this.workOrders = response;

      if (this.workOrders.items && Array.isArray(this.workOrders.items)) {
        this.workOrders.items = this.workOrders.items.map((item: any) => ({
          ...item,
          Advance: this.CalculateAdvance(item.PlannedQuantity, item.CompletedQuantity)
        }));
      }

      this.OnStartSuscription(this.organizationSelected.OrganizationId);

    }).catch(error => {
      console.error('Error al obtener OTs:', error);
    });
  }

  OnStartSuscription(orgId:number){
    this.websocket.SuscribeById({ organization_id: orgId }, 'workorders', (response) => {
      const newWorkOrders = response;
      if (newWorkOrders.items && Array.isArray(newWorkOrders.items)) {
        const newItems = newWorkOrders.items.map((item: any) => ({
          ...item,
          Advance: this.CalculateAdvance(item.PlannedQuantity, item.CompletedQuantity)
        }));

        this.workOrders.items = [...this.workOrders.items, ...newItems];
      }
    }).then((ws) => {
    }).catch(err => {
      console.log(err);
    });
  }

  private CalculateAdvance(planned: number, completed: number): number {
    //Validaiones para evitar errores en operaciones
    if (!planned || planned === 0 || !completed) { return 0; }
    if (completed < 0 || planned < 0) { return 0; }

    const percentage = (completed / planned) * 100;

    return Math.min(Math.max(Math.round(percentage), 0), 100);
  }

  OnAdvanceFilter(values: number[], filterCallback: any) {
    this.progressValue = values;
    filterCallback(values);
  }

  GetColorByAdvanced(advance: number) {
   if(advance == 0 || advance == null){
     return "danger"; //rojo
   }else if(advance >= 1){
     return "success"; //verde
   }else if(advance == -1){
     return "warn"; //naranja
   }else if(advance == -2){
     return "info"; //azul
   }else {
     return "contrast"; //blanco
   }
  }

  OnFilterGlobal(event: Event, table: any) {
    const target = event.target as HTMLInputElement;
    table.filterGlobal(target.value, 'contains');
  }

  ClearWorkOrders(table: any) {
    table.clear();
    this.searchValueWO = '';
    this.progressValue = [0, 100];
  }

  protected readonly FormatForDisplayFromISO = FormatForDisplayFromISO;
}
