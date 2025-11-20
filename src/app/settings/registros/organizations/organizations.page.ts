import { ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA, Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { ellipsisVerticalOutline, chevronForwardOutline, checkmarkOutline, addOutline, trashOutline, pencilOutline, menuOutline, timeOutline, optionsOutline } from 'ionicons/icons';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, IonIcon, IonMenuButton, IonItem,
  IonInput, IonText, IonLabel
} from '@ionic/angular/standalone';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { FloatLabel } from "primeng/floatlabel"
import { HeightTable } from "../../../models/tables.prime";
import { ApiService } from "../../../services/api.service";
import { AlertsService } from "../../../services/alerts.service";
import { ToggleMenu } from 'src/app/models/design';
import { Truncate } from "../../../models/math.operations";
import { Dialog } from "primeng/dialog";
import { PrimeTemplate } from "primeng/api";
import { DialogModule } from 'primeng/dialog';
import { IonBreadcrumb, IonBreadcrumbs } from '@ionic/angular/standalone';
import { ConfirmationService } from "primeng/api";
import { OpenStreetMapProvider, GeoSearchControl } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';
import * as L from 'leaflet';

@Component({
  selector: 'app-organizations',
  templateUrl: './organizations.page.html',
  styleUrls: ['./organizations.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonMenuButton,
    IonButton, IonIcon, IonBreadcrumbs, IonBreadcrumb, FloatLabel, SelectModule, PrimeTemplate, TableModule, ButtonModule,
    IonText, IonItem, DialogModule, Dialog, InputIconModule, IconFieldModule, IonInput, InputTextModule, IonLabel    
  ]
})
export class OrganizationsPage implements OnInit {

  @ViewChild('regionContainer', { static: false }) regionContainer!: ElementRef;
  modalSize: string = '';
  private resizeObserver!: ResizeObserver;
  scrollHeight: string = '550px';
  rowsPerPage: number = 50;
  rowsPerPageOptions: number[] = [10, 25, 50];  

  protected readonly ToggleMenu = ToggleMenu;
  userData: any = {};
  companyId: number | undefined;  
  dbData: any = {};
  searchValueDB: string = '';
  
  selectedOrg: any[] = [];
  isNewFlag: boolean = true;
  isModalOpen: boolean = false;
  isMapOpen: boolean = false;

  org: any = {    
    OrganizationId: null,
    CompanyId: null,
    Code: '',
    Name: '',
    Location: '',
    WorkMethod: '',
    BuId: null,
    Coordinates: null as { lng: any, lat: any } | null
  };

  types: any = [
    { label: 'Manufactura por procesos', value: 'PROCESS_MANUFACTURING'},
    { label: 'Manufactura discreta', value: 'DISCRETE_MANUFACTURING'}
  ]  
  
  selectedCoords: any = null;
  private map: any;
  private marker: any;
  private isMapInitialized: boolean = false;

  constructor(
    private apiService: ApiService,
    public alerts: AlertsService,
    private changeDetector: ChangeDetectorRef,
    private confirmationService: ConfirmationService    
  ) {
    addIcons({menuOutline,pencilOutline,optionsOutline,checkmarkOutline,addOutline,ellipsisVerticalOutline,chevronForwardOutline,trashOutline,timeOutline});
  }

  ngOnInit() {    
    this.userData = JSON.parse(String(localStorage.getItem("userData")));
    if (this.userData ) {
      this.companyId = this.userData.Company.CompanyId;    
      this.RefreshTables();
    }
  }

  ngAfterViewInit() {
    this.ObserveResize();
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  RefreshTables() {
    let clause = `organizations/${this.companyId}`;
    this.apiService.GetRequestRender(clause).then((response: any) => {
      response.totalResults == 0 && this.alerts.Warning(response.message);
      this.dbData = response;      
    });

    this.searchValueDB = '';
  }
  
  GetScrollHeight(): string {
    return this.scrollHeight;
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

  OnFilterGlobal(event: Event, table: any) {
    const target = event.target as HTMLInputElement;
    table.filterGlobal(target.value, 'contains');
  }

  OpenAsNewOrganization() {
    this.resetOrganization()
    this.isNewFlag = true
    this.isModalOpen = true;
    this.org.CompanyId = this.companyId;
    const contentPart = document.querySelector('ion-modal.dispach-modal')?.shadowRoot?.querySelector('[part="content"]');
    if (contentPart) {
      const rect = contentPart.getBoundingClientRect();
      this.modalSize = `Modal: ${Truncate(rect.width)} x ${Truncate(rect.height)} | Viewport: ${window.innerWidth} (${((rect.width / window.innerWidth) * 100).toFixed(2)}%)`;
    }
  }

  resetOrganization() {//se reinician los datos del usuario nuevo o a editar
    this.org = {
      OrganizationId: null,
      CompanyId: this.companyId,
      Code: '',
      Name: '',
      Location: '',
      WorkMethod: '',
      BuId: null,
      Coordinates: null    
    };
  } 
  
  AddOrEditOrganization() {
    const itemsArray = [this.org];    
    this.org.WorkMethod = this.WorkMethodFormat(this.org.WorkMethod);
    if (this.isNewFlag) {           
        const payload = {          
          items: itemsArray
        };        
                
        this.apiService.PostRequestRender('organizations', payload).then(async (response: any) => {
          if (response.errorsExistFlag) {
            this.alerts.Info(response.message);
          } else {
            this.alerts.Success(response.message);

            setTimeout(() => {
              this.RefreshTables();
            }, 1500);

          }
        });
        this.isModalOpen = false
    } else {  
      const orgForUpdate = this.org;
  
      if (orgForUpdate.Coordinates && typeof orgForUpdate.Coordinates === 'object') {
        const lng = orgForUpdate.Coordinates.lng;
        const lat = orgForUpdate.Coordinates.lat;

        // Verificar que lng y lat no sean undefined ni null
        if (lng != null && lat != null) {
          orgForUpdate.Coordinates = `(${lng},${lat})`;
        }else{
          orgForUpdate.Coordinates = `(${this.org.Coordinates.x},${this.org.Coordinates.y})`;
        }
      }          
      this.apiService.PutRequestRender('organizations/' + this.org.OrganizationId, orgForUpdate).then(async (response: any) => {
        if (response.errorsExistFlag) {
          this.alerts.Info(response.message);
        } else {
          this.alerts.Success(response.message);
          this.isNewFlag = true
          this.isModalOpen = false
          this.RefreshTables()
        }
      });
    }
    this.alerts.HideLoading();
  }

  async DeleteOrganizations() {
    if (this.selectedOrg.length === 0) {
      this.alerts.Warning("Seleccione algún elemento para eliminar");
      return;
    }

    const payload = {
      items: this.selectedOrg
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
          this.apiService.DeleteMultipleRequestRender('organizations', payload).then(async (response: any) => {
            if (!response.errorsExistFlag) {
              this.alerts.Success("Eliminación exitosa");
              this.RefreshTables();
              this.selectedOrg = [];
            } else {
              this.alerts.Info(response.error);
            }
          });

        } catch (error) {
          console.error('Error al eliminar:', error);
          this.alerts.Error('Error al eliminar');
        }
      }
    });

  }

  EditOrganization(org: any) {
    this.org = org;
    this.isNewFlag = false
    this.isModalOpen = true
    this.changeDetector.detectChanges()  
    if (this.org.WorkMethod = 'PROCESOS') {
      this.org.WorkMethod = 'PROCESS_MANUFACTURING'
    } else if (this.org.WorkMethod = 'DISCRETA'){
      this.org.WorkMethod = 'DISCRETE_MANUFACTURING'
    }
  }  

  formatPoint(point: any): string {
    if (!point) return '';
    
    // Si el point tiene propiedades x e y
    if (point.x !== undefined && point.y !== undefined) {
      return `(${point.x}, ${point.y})`;
    }
    
    // Si es un array
    if (Array.isArray(point)) {
      return `(${point[0]}, ${point[1]})`;
    }
    
    // Si ya es una string
    if (typeof point === 'string') {
      return point;
    }
    
    return point.toString();
  }
  
  openLocationSelector() {
    this.isMapOpen = true;
    // Esperar a que el diálogo esté completamente renderizado
    setTimeout(() => {
      this.initializeMap();
    }, 300);
  }

  // Inicializar el mapa
  initializeMap() {
    // Verificar si el mapa ya está inicializado
    if (this.isMapInitialized && this.map) {
      // Si ya está inicializado, solo actualizar el tamaño y la vista
      setTimeout(() => {
        this.map.invalidateSize();
        this.map.setView([19.4326, -99.1332], 10);
      }, 100);
      return;
    }

    // Verificar que el contenedor del mapa existe
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      console.error('Map container not found');
      return;
    }

    // Limpiar cualquier mapa existente
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    try {
      // Configuración inicial del mapa
      this.map = L.map('map').setView([19.4326, -99.1332], 10);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      // Evento para capturar clics en el mapa
      this.map.on('click', (e: any) => {
        this.handleMapClick(e);
      });

      this.isMapInitialized = true;

      const mapContainer = document.getElementById('map');
      if (mapContainer) {
        this.resizeObserver = new ResizeObserver(() => {
          setTimeout(() => {
            if (this.map) {
              this.map.invalidateSize();
            }
          }, 100);
        });
        
        this.resizeObserver.observe(mapContainer);
      }
      
    } catch (error) {
      console.error('Error initializing map:', error);
    }
    
  }

  // Manejar clic en el mapa
  async handleMapClick(e: any) {
    const { lat, lng } = e.latlng;
    
    // Guardar coordenadas seleccionadas
    this.selectedCoords = { lat, lng };
    
    // Limpiar marcador anterior y agregar nuevo
    if (this.marker) {
      this.map.removeLayer(this.marker);
    }
    
    this.marker = L.marker([lat, lng])
      .addTo(this.map)
      .bindPopup(`Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
      .openPopup();

    // Actualizar la ubicación en el formulario
    this.org.Location = await this.getAddressFromCoords(lat, lng);
    // this.org.Coordinates = `(${lng},${lat})`;
    this.org.Coordinates = {
      lng: lng,
      lat: lat
    }
  }

  // Confirmar selección del mapa
  async confirmSelection() {
    if (this.selectedCoords) {
      this.org.Location = await this.getAddressFromCoords(this.selectedCoords.lat, this.selectedCoords.lng);
      // this.org.Coordinates = `(${this.selectedCoords.lng},${this.selectedCoords.lat})`;
      this.org.Coordinates = {
        lng: this.selectedCoords.lng,
        lat: this.selectedCoords.lat
      }
      this.isMapOpen = false;
    }
  }

  // Método para cuando se cierra el diálogo del mapa
  onMapDialogHide() {    
    if (this.marker) {
      this.map.removeLayer(this.marker);
      this.marker = null;
    }
    this.selectedCoords = null;

  }

  async getAddressFromCoords(lat: number, lng: number): Promise<String | null> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data.display_name?.trim()){
        return 'Dirección no disponible';
      } else {
        return data.display_name;
      }      
    } catch (error) {
      console.log('Error al obtener dirección');
      return null;
    }
  }

  WorkMethodFormat(mfgType: string) {
    return mfgType === 'PROCESS_MANUFACTURING' ? 'PROCESOS' : mfgType === 'DISCRETE_MANUFACTURING' ? 'DISCRETA' : 'NA';
  }

  ClearData(table: any) {
    table.clear();
    this.searchValueDB = '';
  }

}
