import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonToggle } from '@ionic/angular/standalone';
import { AlertsService } from 'src/app/services/alerts.service';
import { ApiService } from 'src/app/services/api.service';
import { PermissionsService } from 'src/app/services/permissions.service';

import { PrimeTemplate } from "primeng/api";
import { Table, TableModule } from "primeng/table";
import { pencilOutline, trashOutline, eyeOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-failures',
  templateUrl: './failures.page.html',
  styleUrls: ['./failures.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, PrimeTemplate, TableModule, IonToggle]
})
export class FailuresPage implements OnInit {
  failuresArray: any = []
  userData: any = {};
  isModalOpen = false
  rowsPerPage: number = 19;
  rowsPerPageOptions: number[] = [5, 10, 20];
  scrollHeight: string = '90%';
  searchValueAl: string = '';
  constructor(
    private alerts: AlertsService,
    private apiService: ApiService,
    public permissions: PermissionsService,
    private changeDetector: ChangeDetectorRef) {
    this.userData = JSON.parse(String(localStorage.getItem("userData")));
    addIcons({ pencilOutline, trashOutline, eyeOutline });
  }

  ngOnInit() {
  }

  ionViewDidEnter() {
    this.GetFailures()
  }


  GetFailures() {
    this.apiService.GetRequestRender(`failuresByCompany/${this.userData.Company.CompanyId}`).then((response: any) => {
      if (!response.errorsExistFlag) {
        this.failuresArray = response.items
      } else {
        this.alerts.Error(response.error)
      }

    }).catch(error => {
      console.error('Error al obtener OTs:', error);
    });
  }


  ClearAlerts(table: any) {
    table.clear();
    this.searchValueAl = '';
  }

  OnFilterGlobal(event: Event, table: any) {
    const target = event.target as HTMLInputElement;
    table.filterGlobal(target.value, 'contains');
  }
  EdithFailure(failure: any) {

  }
  DeleteFailure(failure: any) {

  }
  ShowFailure(failure: any) {

  }
}
