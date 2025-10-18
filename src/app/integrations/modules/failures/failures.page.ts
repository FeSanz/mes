import {ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, HostListener, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonToggle,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonButtons,
  IonMenuButton,
  IonInput,
  IonItem,
  IonText,
  IonSelect,
  IonSelectOption, IonLabel
} from '@ionic/angular/standalone';
import { AlertsService } from 'src/app/services/alerts.service';
import { ApiService } from 'src/app/services/api.service';
import { PermissionsService } from 'src/app/services/permissions.service';

import {ConfirmationService, PrimeTemplate} from "primeng/api";
import { TableModule } from "primeng/table";
import { pencilOutline, trashOutline, eyeOutline, menuOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import {FloatLabel} from "primeng/floatlabel";
import {Select} from "primeng/select";
import {ToggleMenu} from "../../../models/design";
import {Button} from "primeng/button";
import {IconField} from "primeng/iconfield";
import {InputText} from "primeng/inputtext";
import {InputIcon} from "primeng/inputicon";
import {HeightSingleTable, HeightTable} from "../../../models/tables.prime";
import {Platform} from "@ionic/angular";
import {Tag} from "primeng/tag";
import {ConfirmDialog} from "primeng/confirmdialog";
import {Dialog} from "primeng/dialog";
import {Toast} from "primeng/toast";
import {ProgressSpinner} from "primeng/progressspinner";

@Component({
  selector: 'app-failures',
  templateUrl: './failures.page.html',
  styleUrls: ['./failures.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, PrimeTemplate, TableModule, IonToggle, IonGrid, IonRow, IonCol, IonCard, IonCardTitle, IonButton, IonIcon, FloatLabel, IonButtons, IonMenuButton, Select, Button, IconField, InputText, InputIcon, Tag, ConfirmDialog, Dialog, IonInput, IonItem, IonText, IonSelect, IonSelectOption, IonLabel, ReactiveFormsModule, Toast, ProgressSpinner]
})

export class FailuresPage implements OnInit {
  failuresData: any = { items: []}
  selectedFailures: any[] = [];
  userData: any = {};
  isModalNewOpen: boolean = false
  rowsPerPage: number = 23;
  rowsPerPageOptions: number[] = [5, 10, 20];
  scrollHeight: string = '550px';
  searchValueAl: string = '';

  ftypes: string[] = ['Paro NO programado', 'Paro programado', 'Apagado'];
  areas: string[] = ['Producción', 'Mantenimiento', 'Almacén', 'Calidad'];

  formFailure: any = {
    name: '',
    type: '',
    area: ''
  };

  constructor(
    public alerts: AlertsService,
    private apiService: ApiService,
    public permissions: PermissionsService,
    private changeDetector: ChangeDetectorRef,
    private confirmationService: ConfirmationService,
    private platform: Platform,) {
    this.userData = JSON.parse(String(localStorage.getItem("userData")));
    addIcons({ pencilOutline, trashOutline, eyeOutline, menuOutline });
  }

  ngOnInit() {

  }

  ionViewDidEnter() {
    this.UpdateScrollHeight();
    this.GetFailures()
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.UpdateScrollHeight();
  }

  private UpdateScrollHeight() {
    this.scrollHeight = HeightSingleTable(this.platform.height());
  }


  GetFailures() {
    this.apiService.GetRequestRender(`failuresByCompany/${this.userData.Company.CompanyId}`).then((response: any) => {
      if (!response.errorsExistFlag) {
        this.failuresData = response
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

  UploadSingleFailure() {
    this.alerts.PDAlertHide();
    if (!this.formFailure.name?.trim() || !this.formFailure.type || !this.formFailure.area) {
      this.alerts.PDAlertShow('Llene todos los campos requeridos', 'danger');
      return;
    }

    this.alerts.PDAlertShow('Por favor espere...', 'contrast');
    this.alerts.PDLoading(true); // Activar loading

    // Simulación de proceso (reemplaza con tu llamada real al API)
    setTimeout(() => {
      this.alerts.PDLoading(false); // Desactivar loading
      this.alerts.PDAlertShow('Guardado exitosamente', 'success');

      setTimeout(() => {
        this.isModalNewOpen = false;
        this.formFailure = { name: '', type: '', area: '' };
        this.RefreshTables();
      }, 2500);
    }, 5000);

    //this.isModalNewOpen = false;
    //this.formFailure = { name: '', type: '', area: '' };
  }

  EdithFailure(failure: any) {

  }

  async DeleteFailure() {
    if (this.selectedFailures.length === 0) {
      this.alerts.Warning("Seleccione algún elemento para eliminar");
      return;
    }

    this.confirmationService.confirm({
      message: '¿Está seguro de que desea eliminar los elementos seleccionados?',
      header: 'Confirm',
      icon: 'fas fa-circle-exclamation',
      rejectButtonProps: {
        label: 'No',
        severity: 'secondary',
        variant: 'text'
      },
      acceptButtonProps: {
        severity: 'danger',
        label: 'Si'
      },
      accept: async () => {
        try {
          let successCount = 0;

          // Eliminar uno por uno (secuencial)
          for (const item of this.selectedFailures) {
            const response = await this.apiService.DeleteRequestRender('failures/' + item.failure_id);

            if (!response.errorsExistFlag) {
              successCount++;
            }
          }

          this.alerts.Success(`Fallas eliminadas [${successCount}/ ${this.selectedFailures.length}]`);


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
    });

  }

  RefreshTables() {
    this.GetFailures();

    // Limpiar valores de búsqueda
    this.searchValueAl = '';

    // Limpiar selecciones
    this.selectedFailures = [];

  }

  protected readonly ToggleMenu = ToggleMenu;
}
