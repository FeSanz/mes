import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import {
  IonText, IonButton, IonCard, IonCardContent, IonCardTitle, IonCardHeader, IonCheckbox,
  IonInput, IonItem, IonIcon, IonMenuButton, IonButtons, IonInputPasswordToggle, IonToggle
} from '@ionic/angular/standalone';
import {
  businessOutline, eyeOffOutline, lockClosed, lockClosedOutline, personOutline,
  arrowForwardOutline, atCircleOutline, cloudOutline, serverOutline, keyOutline, linkOutline,
  checkmarkCircle, timeOutline, syncOutline, globeOutline, alarmOutline, clipboardOutline, trash,
  arrowForward, chevronDownOutline, closeOutline, checkmarkOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { ApiService } from '../services/api.service';
import { NavController } from '@ionic/angular';
import { EndpointsService } from '../services/endpoints.service';
import { AlertsService } from '../services/alerts.service';
import { AppComponent } from '../app.component';
import { addIcons } from 'ionicons';
import { ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CredentialsService } from "../services/credentials.service";
import { Router } from '@angular/router';
import { HeightTable } from "../models/tables.prime";
import { TableModule } from 'primeng/table';
import { Capacitor, CapacitorHttp, HttpResponse } from '@capacitor/core';
import { ChangeDetectorRef } from '@angular/core';
import { NgZone } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';


@Component({
  selector: 'app-setup-page',
  templateUrl: './setup-page.page.html',
  styleUrls: ['./setup-page.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons,
    IonButton, IonMenuButton, IonCardContent, IonCardHeader, IonCardTitle, IonInput, IonCard,
    IonItem, IonIcon, IonInputPasswordToggle, IonText, IonToggle, MultiSelectModule,
    DropdownModule, InputIconModule, IconFieldModule, InputTextModule, ButtonModule, TagModule, TableModule
  ],
  // encapsulation: ViewEncapsulation.None
})

export class SetupPagePage implements OnInit, AfterViewInit {
  @ViewChild('regionContainer', { static: false }) regionContainer!: ElementRef;
  // @ViewChild('dtFusion') table!: Table;
  private resizeObserver!: ResizeObserver;
  scrollHeight: string = '550px';
  rowsPerPage: number = 50;
  rowsPerPageOptions: number[] = [10, 25, 50];

  offset: number = 0;

  host: string = "";
  user: string = "";
  pwd: string = "";
  server: string = "";
  credentials: string = "";

  statusMessage = 'Sin verificar';
  statusIcon = 'warning';
  statusColor = 'warning';
  canSave = false;

  btnSaveOrUpdate: string = "Guardar";

  userData: any = {};
  setup: string | null = "";

  fusionCards = [
    {
      icon: 'globe-outline',
      idModule: 'organizations',
      moduleName: 'ORGANIZACIONES'
    }
  ];

  company = {
    "Name": "",
    "Description": "",
    "EnabledFlag": "Y"
  }

  userSuperAdmin = {
    "Username": "",
    "Password": "",
    "Email": ""
  }

  organization = {
    "OrganizationCode": "",
    "OrganizationName": "",
    "Location": "",
    "WorkMethod": "",
    "BuId": "",
    "Coordinates": ""
  }

  orgs = { items: [] };
  toggleActivo: boolean = false;
  @ViewChild('swiperEl', { static: false }) swiperEl!: ElementRef;
  swiperInstance: any;
  isNextDisabled: boolean = false;

  fusionOriginalData: any = {};
  fusionData: any = { items: [] };
  dbData: any = { items: [] };

  selectedItemsFusion: any[] = [];
  selectedItemsDB: any[] = [];

  searchValueFusion: string = '';
  searchValueDB: string = '';

  rowDataFS = [];
  rowDataDB = [];


  constructor(private navCtrl: NavController,
    private endPoints: EndpointsService, private alerts: AlertsService,
    private app: AppComponent, private apiService: ApiService,
    private credentialService: CredentialsService,
    private router: Router, private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {
    addIcons({businessOutline,personOutline,atCircleOutline,lockClosedOutline,serverOutline,keyOutline,linkOutline,syncOutline,cloudOutline,arrowForward,checkmarkOutline,chevronBackOutline,chevronForwardOutline,trash,arrowForwardOutline,checkmarkCircle,timeOutline,globeOutline,alarmOutline,clipboardOutline});

    // this.userData = JSON.parse(String(localStorage.getItem("userData")))
  }


  ngOnInit() {
  }

  ngAfterViewInit() {
    this.ObserveResize();
    const swiperEl = this.swiperEl.nativeElement;

    // Espera hasta que la instancia swiper esté disponible
    const interval = setInterval(() => {
      this.swiperInstance = swiperEl.swiper;
      const nextBtn = document.querySelector('.swiper-button-next');
      const prevBtn = document.querySelector('.swiper-button-prev');

      // if (swiperEl.swiper) {

      if (this.swiperInstance && nextBtn && prevBtn) {

        this.swiperInstance.on('slideChange', () => {
          const activeIndex = this.swiperInstance.activeIndex;

          nextBtn?.classList.remove('swiper-button-disabled');
          prevBtn?.classList.remove('swiper-button-disabled');
          this.swiperInstance.allowSlideNext = true;
          this.swiperInstance.allowSlidePrev = true;

          switch (activeIndex) {
            case 1:
              console.log(nextBtn);
              nextBtn?.classList.add('swiper-button-disabled');
              this.swiperInstance.allowSlideNext = false;
              break;
            case 2:
              break;
            default:
              break;
          }
          this.swiperInstance.update();
        });

        clearInterval(interval); // Detiene el intervalo al encontrar swiper
      }
    }, 100);
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  goNext() {
    if (this.swiperInstance && !this.swiperInstance.isEnd) {
      this.swiperInstance.slideNext();
    }
  }

  goPrev() {
    if (this.swiperInstance && !this.swiperInstance.isBeginning) {
      this.swiperInstance.slidePrev();
    }
  }

  async finalize() {
    console.log('Registrar compañia: ' + JSON.stringify(this.company, null, 2));
    console.log('Registrar organización: ' + JSON.stringify(this.organization, null, 2));
    console.log('Registrar usuario: ' + JSON.stringify(this.userSuperAdmin, null, 2));
    // await this.api.PostRequestRender('companies', payload);
  }

  async VerifyConnection() {
    this.server = `https://${this.host}/fscmRestApi/resources/latest`;
    this.credentials = btoa(`${this.user}:${this.pwd}`);

    this.apiService.AuthRequestFusion(this.endPoints.Path('auth', this.server), this.credentials).then(async (response: any) => {
      this.RequestStatusConnection(response);
      // this.GetOrganizations();      
    });

  }

  async SaveOrUpdateConnection() {
    const isUpdate = this.btnSaveOrUpdate === "Actualizar";

    const payload = {
      CompanyId: this.userData.Company.CompanyId,
      User: this.userData.Name,
      items: [
        {
          Name: "FUSION_URL",
          Value: this.host,
          ...(isUpdate ? {} : { Description: "Dirección para conexión con REST API Fusion" })
        },
        {
          Name: "FUSION_CREDENTIALS",
          Value: btoa(`${this.user}:${this.pwd}`),
          ...(isUpdate ? {} : { Description: "Credenciales para conexión con REST API Fusion" })
        }
      ]
    };
    console.log(payload);

    const apiCall = isUpdate
      ? await this.apiService.PutRequestRender('settingsFusion', payload)
      : await this.apiService.PostRequestRender('settingsFusion', payload);

    try {
      const response: any = await apiCall;
      if (response.errorsExistFlag) {
        this.alerts.Info(response.message);
      } else {
        this.alerts.Success(response.message);
      }
    } catch (error) {
      console.error('Error en SaveOrUpdateConnection:', error);
    }
  }


  RequestStatusConnection(statusCode: number) {
    if (statusCode >= 200 && statusCode <= 202) {
      this.statusMessage = 'Acceso autorizado';
      this.statusIcon = 'warning'; //checkmark-circle';
      this.statusColor = 'success';
      this.canSave = true;
    }
    else if (statusCode == 400) {
      this.statusMessage = 'Solicitud incorrecta del cliente';
      this.statusIcon = 'close-circle';
      this.statusColor = 'danger';
      this.canSave = false;
    }
    else if (statusCode == 401) {
      this.statusMessage = 'Acceso no autorizado';
      this.statusIcon = 'lock-closed';
      this.statusColor = 'warning';
      this.canSave = false;
    }
    else if (statusCode == 403) {
      this.statusMessage = 'Autorizado pero sin acceso a datos';
      this.statusIcon = 'alert-circle';
      this.statusColor = 'danger';
      this.canSave = true;
    }
    else if (statusCode == 404) {
      this.statusMessage = 'Solicitud no encontrada';
      this.statusIcon = 'close-circle';
      this.statusColor = 'danger';
      this.canSave = false;
    }
    else if (statusCode == 405) {
      this.statusMessage = 'Método de la solicitud no admitido';
      this.statusIcon = 'close-circle';
      this.statusColor = 'danger';
      this.canSave = false;
    }
    else if (statusCode == 500) {
      this.statusMessage = 'Error interno del servidor';
      this.statusIcon = 'close-circle';
      this.statusColor = 'danger';
      this.canSave = false;
    }
    else {
      this.statusMessage = `Error al procesar la solicitud (${statusCode})`;
      this.statusIcon = 'alert-circle';
      this.statusColor = 'danger';
      this.canSave = false;
    }
  }

  goToSlide(index: number) {

    const swiperEl = this.swiperEl.nativeElement;

    const interval = setInterval(() => {
      const swiperInstance = swiperEl.swiper;
      if (swiperInstance) {
        swiperInstance.slideTo(index);
        clearInterval(interval);
      }
    }, 100);
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

  GetScrollHeight(): string {
    return this.scrollHeight;
  }

  GetOrganizations() {

    const params = 'limit=500&totalResults=true&onlyData=true&links=canonical';
    const endPoint = '/inventoryOrganizations?' + params +
      '&fields=OrganizationId,OrganizationCode,OrganizationName,LocationCode,ManagementBusinessUnitId,Status;plantParameters:DefaultWorkMethod' +
      '&q=ManufacturingPlantFlag=true';

    this.apiService.GetRequestRender(`organizations/0`).then((response: any) => {
      this.dbData = response;
      this.apiService.GetRequestFusionOnceTime(this.server + endPoint, this.credentials).then((response: any) => {
        this.fusionData = JSON.parse(response);
        this.fusionOriginalData = JSON.parse(JSON.stringify(this.fusionData)); // Guardar estructura original        

        this.FilterRegisteredItems();

        this.goToSlide(3);

        this.cdr.detectChanges();
      });
    });

  }

  //Metodo para manejar el filtro global
  OnFilterGlobal(event: Event, table: any) {
    const target = event.target as HTMLInputElement;
    table.filterGlobal(target.value, 'contains');
  }

  FilterRegisteredItems() {
    if (this.fusionOriginalData.items && this.dbData.items) {
      // Set de ID's para filtrar posteriormente
      const dbOrganizationCodes = new Set(this.dbData.items.map((item: any) => String(item.Code)));
      // Filtrar items de fusion que no estén en DB
      this.fusionData.items = this.fusionOriginalData.items.filter((fusionItem: any) => {
        return !dbOrganizationCodes.has(String(fusionItem.OrganizationCode));
      });
    } else { //Si DB no tiene datos a comparar, solo imprimir datos originales de Fusion
      if (this.fusionOriginalData.items) {
        this.fusionData = JSON.parse(JSON.stringify(this.fusionOriginalData));
      }
    }
  }

  //Metodo para cargar organizaciones seleccionadas de FUSION
  UploadOrganization() {
    if (this.fusionData.items) {
      if (this.selectedItemsFusion.length === 0) {
        this.alerts.Warning("Seleccione algún elemento para cargar");
        return;
      }

      const itemsData = this.selectedItemsFusion.map((item: any) => ({
        CompanyId: 0,//this.userData.Company.CompanyId,
        Code: item.OrganizationCode,
        Name: item.OrganizationName,
        Location: item.LocationCode,
        WorkMethod: this.WorkMethodFormat(item.plantParameters.items[0].DefaultWorkMethod),
        BUId: item.ManagementBusinessUnitId,
        Coordinates: null
      }));

      const payload = {
        items: itemsData
      };

      this.dbData = payload;
      this.cdr.detectChanges();
      console.log(payload);
      // this.apiService.PostRequestRender('organizations', payload).then(async (response: any) => {
      //   if (response.errorsExistFlag) {
      //     this.alerts.Info(response.message);
      //   } else {
      //     this.alerts.Success(response.message);

      //     setTimeout(() => {
      //       this.RefreshTables();
      //     }, 1500);
      //   }
      // });
    }
  }

  WorkMethodFormat(mfgType: string) {
    return mfgType === 'PROCESS_MANUFACTURING' ? 'PROCESOS' : mfgType === 'DISCRETE_MANUFACTURING' ? 'DISCRETA' : 'NA';
  }

  //Metodo para eliminar organizaciones seleccionadas de DB
  async DeleteOrganizations() {
    if (this.dbData.items) {
      if (this.selectedItemsDB.length === 0) {
        this.alerts.Warning("Seleccione algún elemento para eliminar");
        return;
      }

      try {
        let successCount = 0;

        // Eliminar uno por uno (secuencial)
        for (const item of this.selectedItemsDB) {
          const response = await this.apiService.DeleteRequestRender('organizations/' + item.OrganizationId);

          if (!response.errorsExistFlag) {
            successCount++;
          }
        }

        this.alerts.Success(`Organizaciones eliminadas [${successCount}/ ${this.selectedItemsDB.length}]`);

        // Recargar la página solo si hubo eliminaciones exitosas
        if (successCount > 0) {
          setTimeout(() => {
            this.RefreshTables();
          }, 1500);
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

  RefreshTables() {
    this.apiService.GetRequestRender('organizations').then((response: any) => {
      this.dbData = response;

      this.FilterRegisteredItems();
    });

    // Limpiar valores de búsqueda
    this.searchValueFusion = '';
    this.searchValueDB = '';

    // Limpiar selecciones
    this.selectedItemsFusion = [];
    this.selectedItemsDB = [];

  }

}
