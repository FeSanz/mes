import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonButton,
  IonIcon,
  IonButtons,
  IonMenuButton,
  IonInput,
  IonItem,
  IonText,
  IonLabel
} from '@ionic/angular/standalone';
import { AlertsService } from 'src/app/services/alerts.service';
import { ApiService } from 'src/app/services/api.service';
import { PermissionsService } from 'src/app/services/permissions.service';

import { ConfirmationService } from "primeng/api";
import { TableModule } from "primeng/table";
import { pencilOutline, trashOutline, eyeOutline, menuOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { Select } from "primeng/select";
import { ToggleMenu } from "../../../models/design";
import { Button } from "primeng/button";
import { IconField } from "primeng/iconfield";
import { InputText } from "primeng/inputtext";
import { InputIcon } from "primeng/inputicon";
import { HeightSingleTable } from "../../../models/tables.prime";
import { Platform } from "@ionic/angular";
import { Tag } from "primeng/tag";
import { Dialog } from "primeng/dialog";

@Component({
  selector: 'app-failures',
  templateUrl: './failures.page.html',
  styleUrls: ['./failures.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, TableModule, IonGrid, IonRow, IonCol, IonCard,
    IonButton, IonIcon, IonButtons, IonMenuButton, Select, Button, IconField, InputText, InputIcon, Tag, Dialog, IonInput, IonItem, IonText, IonLabel, ReactiveFormsModule]
})

export class FailuresPage implements OnInit {
  failuresData: any = { items: [] }
  selectedFailures: any[] = [];
  userData: any = {};

  isModalNewOpen: boolean = false
  isEditMode: boolean = false;
  failureIdCurrent: number = 0;

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
  // Agregar referencia a la tabla
  @ViewChild('dtFailures') dtFailures: any;

  // Definir columnas para exportación
  cols: any[] = [];
  exportColumns: any[] = [];
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
    // Definir columnas para exportación
    this.cols = [
      { field: 'failure_id', header: 'ID' },
      { field: 'name', header: 'Nombre de la falla' },
      { field: 'type', header: 'Tipo' },
      { field: 'area', header: 'Área' }
    ];

    this.exportColumns = this.cols.map((col) => ({
      title: col.header,
      dataKey: col.field
    }));
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

  // Método para exportar a CSV
  ExportCSV() {
    this.dtFailures.exportCSV();
  }

  // Opcional: Exportar solo seleccionados
  ExportSelectedCSV() {
    if (this.selectedFailures.length === 0) {
      this.alerts.Warning("Seleccione al menos un elemento para exportar");
      return;
    }
    this.dtFailures.exportCSV({ selectionOnly: true });
  }

  CreateOrUpdateFailure() {
    // Validar formulario
    if (!this.formFailure.name?.trim() || !this.formFailure.type || !this.formFailure.area) {
      this.alerts.Warning("Llene todos los campos requeridos");
      return;
    }

    const payload = {
      CompanyId: this.userData.Company.CompanyId,
      Name: this.formFailure.name.trim(),
      Type: this.formFailure.type,
      Area: this.formFailure.area,
    };

    const path = this.isEditMode ? `failures/${this.failureIdCurrent}` : 'failures';
    const apiMethod = this.isEditMode
      ? this.apiService.PutRequestRender(path, payload)
      : this.apiService.PostRequestRender(path, payload);

    apiMethod.then((response: any) => {
      if (response.errorsExistFlag) {
        this.isModalNewOpen = true;
        this.alerts.ToastZIndex();
        this.alerts.Info(response.message);
      } else {
        this.alerts.Success(response.message);

        if (this.isEditMode) {
          // Actualizar existente
          const index = this.failuresData.items.findIndex(
            (item: any) => item.failure_id === this.failureIdCurrent
          );

          if (index !== -1) {
            this.failuresData.items[index] = {
              ...this.failuresData.items[index],
              name: payload.Name,
              type: payload.Type,
              area: payload.Area
            };
          }
        } else {
          // Agregar nuevo
          const newFailure = {
            failure_id: response.items[0].FailureId,
            name: payload.Name,
            type: payload.Type,
            area: payload.Area,
            company_id: payload.CompanyId
          };

          this.failuresData.items = [newFailure, ...this.failuresData.items];

          if (this.failuresData.totalResults !== undefined) {
            this.failuresData.totalResults++;
          }
        }

        // Resetear formulario
        this.formFailure = { name: '', type: '', area: '' };
        this.isModalNewOpen = false;
        this.isEditMode = false;
        this.failureIdCurrent = 0;
        this.changeDetector.detectChanges();
      }
    }).catch(error => {
      this.isModalNewOpen = true;
      this.alerts.ToastZIndex();
      console.error('Error:', error);
      this.alerts.Error(`Error al ${this.isEditMode ? 'actualizar' : 'crear'} la falla`);
    });
  }

  isFormValid(): boolean {
    return !!(
      this.formFailure.name &&
      this.formFailure.name.trim() !== '' &&
      this.formFailure.type &&
      this.formFailure.area
    );
  }

  EditableForm(failure: any) {
    this.isEditMode = true;
    this.isModalNewOpen = true;
    this.failureIdCurrent = failure.failure_id;
    this.formFailure = {
      name: failure.name,
      type: failure.type,
      area: failure.area
    };
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
