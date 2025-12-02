import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import {
  IonText, IonButton, IonCard, IonInput, IonItem, IonIcon, IonInputPasswordToggle, IonToggle, IonSelect
} from '@ionic/angular/standalone';
import {
  businessOutline, lockClosedOutline, personOutline,
  arrowForwardOutline, atCircleOutline, cloudOutline, serverOutline, keyOutline, linkOutline,
  checkmarkCircle, timeOutline, syncOutline, globeOutline, alarmOutline, clipboardOutline, trash,
  arrowForward, checkmarkOutline, chevronBackOutline, chevronForwardOutline, optionsOutline,
  codeWorkingOutline, locationOutline, arrowBackOutline
} from 'ionicons/icons';
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
import { ChangeDetectorRef } from '@angular/core';
import { NgZone } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { ModalController, MenuController, IonicModule } from '@ionic/angular';
import { SelectLocationModalPage } from '../select-location-modal/select-location-modal.page'
import { InputOtpModule } from 'primeng/inputotp';

@Component({
  selector: 'app-setup-page',
  templateUrl: './setup-page.page.html',
  styleUrls: ['./setup-page.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
  imports: [
    CommonModule, FormsModule, MultiSelectModule, IonicModule,
    DropdownModule, InputIconModule, IconFieldModule, InputTextModule, ButtonModule, TagModule, TableModule,
    InputOtpModule
    // IonContent, IonToolbar, IonItem, IonInput, IonIcon, IonToggle, IonInputPasswordToggle, IonText, IonTitle,
    // IonCard, IonButton, IonSelect
  ],
  // encapsulation: ViewEncapsulation.None
})

export class SetupPagePage implements OnInit, AfterViewInit {
  @ViewChild('regionContainer', { static: false }) regionContainer!: ElementRef;  

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
  company_id: number = 0;

  userSuperAdmin = {
    "role": "SuperAdmin",
    "name": "",
    "type": "USER",
    "password": "",
    "email": "",
    "enabled_flag": "Y",
    "organizations": [{}]
  }

  organization = {
    "CompanyId": 0,
    "Code": "",
    "Name": "",
    "Location": "",
    "WorkMethod": "",
    "BUId": 0,
    "Coordinates": null as { lng: any, lat: any } | null
  }

  orgs = [];
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
  verificationCode: string = '';
  mostrarError: boolean = false;
  errorMessage: string = ''

  rowDataFS = [];
  rowDataDB = [];

  alertsFlag: boolean = false;
  pushFlag: boolean = false;
  emailsFlag: boolean = false;

  constructor(private navCtrl: NavController,
    private endPoints: EndpointsService, private alerts: AlertsService,
    private app: AppComponent, private apiService: ApiService,
    private credentialService: CredentialsService,
    private router: Router, private cdr: ChangeDetectorRef,
    private zone: NgZone, private modalCtrl: ModalController,
    private menuCtrl: MenuController
  ) {
    addIcons({ businessOutline, codeWorkingOutline, locationOutline, optionsOutline, personOutline, atCircleOutline, 
      lockClosedOutline, serverOutline, keyOutline, linkOutline, syncOutline, cloudOutline, arrowForward, checkmarkOutline, 
      chevronBackOutline, chevronForwardOutline, trash, arrowForwardOutline, checkmarkCircle, timeOutline, globeOutline, 
      alarmOutline, clipboardOutline, arrowBackOutline });

    // this.userData = JSON.parse(String(localStorage.getItem("userData")))
  }

  ionViewWillEnter() {
    this.menuCtrl.swipeGesture(false);
    this.app.showMenu = false;
  }
  ngOnInit() {
  }


  ngAfterViewInit() {    
    this.ObserveResize();
    const swiperEl = this.swiperEl.nativeElement;
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    // Espera hasta que la instancia swiper esté disponible
    const interval = setInterval(() => {
      this.swiperInstance = swiperEl.swiper;

      if (swiperEl.swiper) {

        // if (this.swiperInstance) {

        this.swiperInstance.on('slideChange', () => {
          const activeIndex = this.swiperInstance.activeIndex;

          switch (activeIndex) {
            case 1:
              nextBtn!.classList.add('disabled');
              break;
            case 2:
              prevBtn!.classList.add('disabled');
              nextBtn!.classList.add('disabled');
              break;
            case 3:
              nextBtn!.classList.add('disabled');
              break;
            default:
              prevBtn!.classList.remove('disabled');
              nextBtn!.classList.remove('disabled');
              break;
          }
          this.swiperInstance.update();
        });

        clearInterval(interval);
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

    let payloadOrg: any;

    if (this.company.Name !== '' && this.company.Description !== '' &&
      this.userSuperAdmin.name !== '' && this.userSuperAdmin.password !== '' && this.userSuperAdmin.email !== '' &&
      ((this.organization.Code !== '' && this.organization.Name !== '') ||
        (this.dbData && Array.isArray(this.dbData.items) && this.dbData.items.length > 0)
      )
    ) {

      await this.apiService.PostRequestRender('companies', this.company).then(async (response: any) => {
        if (response.errorsExistFlag === false) {
          this.company_id = response.result?.company_id;

          if (this.toggleActivo) {

            this.dbData.items.forEach((item: any) => {
              item.CompanyId = this.company_id;
            });

            payloadOrg = this.dbData;
            console.log(JSON.stringify(payloadOrg, null, 2));

            await this.apiService.PostRequestRender('organizations', payloadOrg).then(async (response: any) => {
              this.orgs = response.insertedIds;

              this.userSuperAdmin.organizations = this.orgs.map(id => ({ org_id: id }));
              this.userSuperAdmin.password = btoa(this.userSuperAdmin.password);

              await this.apiService.PostRequestRender('users', this.userSuperAdmin).then(async (response: any) => {
                this.SaveOrUpdateConnection();
                await this.apiService.PutRequestRender('codes/' + this.verificationCode + '/' + this.company_id, ''); 
                this.SaveConfiguration();
                this.router.navigate([`/login`]);
              });

            });

          } else {

            this.apiService.PostRequestRender('getToken', payloadOrg).then(async (response: any) => {
              localStorage.setItem('tk', response.token);

              this.organization.CompanyId = this.company_id;
              this.organization.WorkMethod = this.WorkMethodFormat(this.organization.WorkMethod);
              payloadOrg = { items: [this.organization] };


              await this.apiService.PostRequestRender('organizations', payloadOrg).then(async (response: any) => {
                this.orgs = response.insertedIds;

                this.userSuperAdmin.organizations = this.orgs.map(id => ({ org_id: id }));
                this.userSuperAdmin.password = btoa(this.userSuperAdmin.password);

                await this.apiService.PostRequestRender('users', this.userSuperAdmin).then(async (response: any) => {
                  await this.apiService.PutRequestRender('codes/' + this.verificationCode + '/' + this.company_id, ''); 
                  this.SaveConfiguration();
                  this.router.navigate([`/login`]);
                });

              });
            });
          }          
          
        } else {
          this.alerts.Error(response.message);
        }

      });
    } else {
      if (this.company.Name === '' || this.company.Description === '') {
        this.alerts.Error('Datos de compañía requeridos');
      } else if (this.userSuperAdmin.name === '' || this.userSuperAdmin.password === '' || this.userSuperAdmin.email === '') {
        this.alerts.Error('Datos de usuario requeridos');
      } else if ((this.organization.Code === '' || this.organization.Name === '') ||
        (!this.dbData || Array.isArray(!this.dbData.items) || this.dbData.items.length === 0)) {
        this.alerts.Error('Datos de organización requeridos');
      }

    }
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
      CompanyId: this.company_id,
      User: this.userSuperAdmin.name,
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

    console.log(JSON.stringify(payload, null, 2));

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
    let payloadOrg: any;

    const params = 'limit=500&totalResults=true&onlyData=true&links=canonical';
    const endPoint = '/inventoryOrganizations?' + params +
      '&fields=OrganizationId,OrganizationCode,OrganizationName,LocationCode,ManagementBusinessUnitId,Status;plantParameters:DefaultWorkMethod' +
      '&q=ManufacturingPlantFlag=true';

    this.apiService.PostRequestRender('getToken', payloadOrg).then(async (response: any) => {
      localStorage.setItem('tk', response.token);

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
        CompanyId: this.company_id,
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
    }
  }

  WorkMethodFormat(mfgType: string) {
    return mfgType === 'PROCESS_MANUFACTURING' ? 'PROCESOS' : mfgType === 'DISCRETE_MANUFACTURING' ? 'DISCRETA' : 'NA';
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


  async openLocationSelector() {
    const modal = await this.modalCtrl.create({
      component: SelectLocationModalPage
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();
    // console.log(JSON.stringify( data, null, 2));

    if (data) {
      // this.organization.Coordinates =  `(${data.coordinates.lng}, ${data.coordinates.lat})`;
      this.organization.Coordinates = {
        lng: data.coordinates.lng,
        lat: data.coordinates.lat
      }
      this.organization.Location = data.address;
    } else {
      this.organization.Coordinates = null; // si se canceló el modal
      this.organization.Location = "";
    }
  }

  ionViewDidEnter() {
    const modal = document.querySelector('ion-modal');
    if (modal) {
      modal.setAttribute('can-dismiss', 'false');
    }
  }

  async verificarCodigoEnBD(): Promise<boolean> {
    try {
      const response = await this.apiService.GetRequestRender('verifyCode/'+ this.verificationCode);      
      if (response.rowCount === 1) {
        console.log('Dar accesso');

        this.mostrarError = false;

        await this.apiService.PutRequestRender('codes/'+ this.verificationCode, '');   

        this.habilitarRegistro();

        return true; 
      } else {
        console.log('No dar accesso');
        this.mostrarError = true;
        this.errorMessage = 'Código inválido';
        return false;
      }
    } catch (error) {    
      console.error('Error al verificar código en BD:', error);
      return false;
    }
  }

  habilitarRegistro() {
    const modal = document.querySelector('.modal-overlay') as HTMLElement;
    if (modal) {
      modal.style.display = 'none';
    }
  }

  async SaveConfiguration() {    

    const payload = {
      CompanyId: this.company_id,
      User: 'Unknown',
      items: [
        {
          Name: "ALERTS_FLAG",
          Value: this.alertsFlag,
          Description: "Permiso para recibir alertas",
          Type: "ALERTS"
        },
        {
          Name: "PUSH_FLAG",
          Value: this.pushFlag,
          Description: "Permiso para recibir notificaciones push",
          Type: "ALERTS"
        },
        {
          Name: "EMAILS_FLAG",
          Value: this.emailsFlag,
          Description: "Permiso para recibir emails",
          Type: "ALERTS"
        }
      ]
    };   
    
    await this.apiService.PostRequestRender('settings', payload);
  }  
}

