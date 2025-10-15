import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonMenuButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCol, IonRow, IonGrid } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { menuOutline, timeOutline, hammerOutline, pencilOutline, checkmarkOutline, trashOutline, eyeOutline } from 'ionicons/icons';
import { Tag } from "primeng/tag";

import { TableModule } from "primeng/table";
import { Select } from "primeng/select";
import { FloatLabel } from "primeng/floatlabel";
import { ButtonModule } from "primeng/button";
import { InputText } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToggleMenu } from 'src/app/models/design';
import { DialogModule } from 'primeng/dialog';
import { Dialog } from "primeng/dialog";
import { AlertsService } from 'src/app/services/alerts.service';
import { ApiService } from 'src/app/services/api.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import { SimpleDonutComponent } from 'src/app/components/simple-donut/simple-donut.component';
import { SimpleHeatmapComponent } from 'src/app/components/simple-heatmap/simple-heatmap.component';
import { SimpleColumnBarComponent } from 'src/app/components/simple-column-bar/simple-column-bar.component';

@Component({
  selector: 'app-kpis',
  templateUrl: './kpis.page.html',
  styleUrls: ['./kpis.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonContent, IonHeader, IonTitle, SimpleDonutComponent, SimpleColumnBarComponent, SimpleHeatmapComponent, IonToolbar, CommonModule, IonMenuButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCol, IonRow,
    IonGrid, FormsModule, Tag, ButtonModule, InputText, IconFieldModule, InputIconModule, DialogModule, Dialog, Select, TableModule, FloatLabel]
})
export class KpisPage implements OnInit {
  machinesArray: any = []
  rowsPerPage: number = 19;
  rowsPerPageOptions: number[] = [5, 10, 20];
  selectedMachine: any[] = []
  scrollHeight: string = '90%';
  searchValueAl: string = '';
  organizationSelected: string | any = '';
  userData: any = {};
  donutData: any = {
    a: 1
  }
  constructor(
    private alerts: AlertsService,
    private apiService: ApiService,
    public permissions: PermissionsService,
    private changeDetector: ChangeDetectorRef) {
    this.userData = JSON.parse(String(localStorage.getItem("userData")));
    this.organizationSelected = this.userData.Company.Organizations[2];
    addIcons({ menuOutline, trashOutline, pencilOutline, eyeOutline, hammerOutline, checkmarkOutline, timeOutline });
    this.donutData = this.generarValores();
  }
  generarValores() {
    const a = Math.floor(Math.random() * 101);
    const b = 100 - a;
    return [a, b];
  }
  ngOnInit() {
  }
  ionViewDidEnter() {
    /*this.todayDate = this.formatLocalISO(new Date())
    this.campaignObj.end_date = this.formatLocalISO(
      new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(12, 0, 0, 0))
    );
    this.campaignObj.start_date = this.formatLocalISO(
      new Date(new Date(new Date().setDate(new Date().getDate() + 7)).setHours(12, 0, 0, 0))
    );*/
    //this.GetMachines()
  }
  GetMachines() {
    this.apiService.GetRequestRender('orgResourceMachines/' + this.organizationSelected.OrganizationId).then((response: any) => {
      console.log(response.items);
      if (!response.items) {
        this.alerts.Info(response.message);
      } else {
        this.machinesArray = response.items
      }
    })
  }
  ClearMachinesFilter(table: any) {
    table.clear();
    this.searchValueAl = '';
  }
  OnFilterGlobal(event: Event, table: any) {
    const target = event.target as HTMLInputElement;
    table.filterGlobal(target.value, 'contains');
  }
  protected readonly ToggleMenu = ToggleMenu;
}
