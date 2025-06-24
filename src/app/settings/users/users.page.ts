import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, IonIcon, IonMenuButton, IonFab, IonFabButton, IonModal, IonItem, IonInput, IonSelect, IonSelectOption, IonToggle } from '@ionic/angular/standalone';
import { AlertsService } from 'src/app/services/alerts.service';
import { EndpointsService } from 'src/app/services/endpoints.service';
import { ApiService } from 'src/app/services/api.service';
import { TableModule } from 'primeng/table';
import { addIcons } from 'ionicons';
import { ellipsisVerticalOutline, chevronForwardOutline, checkmarkOutline, addOutline, trashOutline } from 'ionicons/icons';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';

@Component({
  selector: 'app-users',
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, TableModule, CardModule, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonMenuButton, IonFab, IonFabButton, IonModal,
    IonButton, IonIcon, IonItem, IonInput, IonSelect, IonSelectOption, IonToggle,
    TableModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule, TagModule, DropdownModule,
    MultiSelectModule]
})
export class UsersPage implements OnInit {
  users: any = []
  rowsPerPage: number = 50;
  rowsPerPageOptions: number[] = [10, 25, 50];
  selectedItems: any = []
  searchValueUsers: string = '';
  isModalOpen = false;
  user: any = {
    role: '',
    name: '',
    type: 'Empleado',
    password: '',
    email: '',
    level: null,
    rfid: null,
    enabled_flag: 'Y'
  };
  organizations: any = []
  availableOrganizations: any[] = [];
  constructor(private apiService: ApiService,
    private endPoints: EndpointsService,
    private api: ApiService,
    private changeDetector: ChangeDetectorRef,
    private alerts: AlertsService) {
    addIcons({ ellipsisVerticalOutline, chevronForwardOutline, checkmarkOutline, addOutline, trashOutline })
  }

  ngOnInit() {
    this.GetUsers();
  }

  GetOrganizations() {
    this.apiService.GetRequestRender(this.endPoints.Render('organizations')).then((response: any) => {
      console.log(response);
    })
  }

  GetUsers() {
    this.apiService.GetRequestRender(this.endPoints.Render('users?companyId=2')).then((response: any) => {
      console.log(response)
      this.users = { ...response };
      if (this.users.items) {
        this.users.items = this.users.items.map((item: any) => ({
          ...item,
          selected: false
        }));
      }
    });
  }
  //Metodo para manejar el filtro global
  OnFilterGlobal(event: Event, table: any) {
    const target = event.target as HTMLInputElement;
    table.filterGlobal(target.value, 'contains');
  }

  ClearFilter(table: any) {
    table.clear();
    this.searchValueUsers = '';
  }
  setOpen(isOpen: boolean) {
    this.apiService.GetRequestRender(this.endPoints.Render('organizations/1')).then((response: any) => {
      this.organizations = response.items
      this.user.organizations = [{ org_id: response.items[0].OrganizationId }]
      this.user.role = "Operador"
      this.user.level = '1'
      console.log(this.organizations);
      this.isModalOpen = isOpen;
    })
  }
  AddNewUser() {
    console.log('Usuario creado:', this.user);
    this.api.PostRequestRender(this.endPoints.Render('users'), this.user).then((response: any) => {
      console.log(response);
        this.users = []
      this.setOpen(false)
      this.user = {
        role: '',
        name: '',
        type: 'Empleado',
        password: '',
        email: '',
        level: null,
        rfid: null,
        enabled_flag: 'Y',
        company_id : 1
      };
      this.changeDetector.detectChanges()
      this.GetUsers()
    })
  }

  addNewOrganization() {
    // Obtener organizaciones ya seleccionadas
    const selectedOrgIds = this.user.organizations.map((org: any) => org.org_id);

    const availableOrg = this.organizations.find((org: any) =>
      !selectedOrgIds.includes(org.OrganizationId)
    );
    this.user.organizations.push({ org_id: availableOrg.OrganizationId });

  }
  removeOrganization(org: any): void {
    const index = this.user.organizations.indexOf(org);
    if (index > -1) {
      this.user.organizations.splice(index, 1);
    }
  }
  get hasAvailableOrganizations(): boolean {
    const selectedOrgIds = this.user.organizations.map((org: any) => org.org_id);
    return this.organizations.some((org: any) => !selectedOrgIds.includes(org.OrganizationId));
  }
  getAvailableOrganizations(currentOrgId?: string): any[] {
    // Obtener los IDs de organizaciones ya seleccionadas
    const selectedOrgIds = this.user.organizations
      .map((org: any) => org.org_id)
      .filter((id: string) => id !== currentOrgId); // Excluir la organización actual

    // Filtrar organizaciones disponibles
    return this.organizations.filter((org: any) =>
      !selectedOrgIds.includes(org.OrganizationId)
    );
  }
}
