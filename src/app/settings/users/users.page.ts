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
import { ellipsisVerticalOutline, chevronForwardOutline, checkmarkOutline, addOutline, trashOutline, pauseSharp, pencilOutline } from 'ionicons/icons';
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
  isNewFlag = true
  organizations: any = []
  availableOrganizations: any[] = [];
  company: any = {}
  constructor(private apiService: ApiService,
    private endPoints: EndpointsService,
    private api: ApiService,
    private changeDetector: ChangeDetectorRef,
    private alerts: AlertsService) {
    addIcons({ ellipsisVerticalOutline, chevronForwardOutline, checkmarkOutline, addOutline, trashOutline, pencilOutline })
    const user = JSON.parse(String(localStorage.getItem("userData")))
    this.company = user.company
  }

  ngOnInit() {
    this.GetUsers();
  }

  GetUsers() {
    this.apiService.GetRequestRender(this.endPoints.Render('users?companyId=' + this.company.CompanyId)).then((response: any) => {
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
    this.user = {
      role: '',
      organizations: [],
      name: '',
      type: 'Empleado',
      password: '',
      email: '',
      level: null,
      rfid: null,
      enabled_flag: 'Y'
    };
    this.isNewFlag = true
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
    this.user.password = btoa(this.user.password)
    this.api.PostRequestRender(this.endPoints.Render('users'), this.user).then((response: any) => {
      console.log(response);
      this.setOpen(false)
      this.user = {
        role: '',
        name: '',
        organizations: [],
        type: 'Empleado',
        password: '',
        email: '',
        level: null,
        rfid: null,
        enabled_flag: 'Y'
      };
      this.changeDetector.detectChanges()

    })
  }
  UpdateUser() {
    this.user.password = btoa(this.user.password)
    this.api.UpdateRequestRender(this.endPoints.Render('users/' + this.user.user_id), this.user).then((response: any) => {
      console.log(response);
      if (response.errorsExistFlag && response.errorsExistFlag == true) {
        this.alerts.Error("Error al actualizar el usuario")
      } else if (response.errorsExistFlag == false) {
        this.alerts.Success("Usuario actualizado")
        this.setOpen(false)
        this.user = {
          role: '',
          name: '',
          organizations: [],
          type: 'Empleado',
          password: '',
          email: '',
          level: null,
          rfid: null,
          enabled_flag: 'Y'
        };
        this.changeDetector.detectChanges()
      }
    })
  }

  addNewOrganization() {
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
    const selectedOrgIds = this.user.organizations.map((org: any) => org.org_id).filter((id: string) => id !== currentOrgId);
    return this.organizations.filter((org: any) =>
      !selectedOrgIds.includes(org.OrganizationId)
    );
  }
  OpenEditUser(user: any) {
    this.user = JSON.parse(JSON.stringify(user))
    this.user.password = atob(user.password)
    this.isNewFlag = false
    this.apiService.GetRequestRender(this.endPoints.Render('organizations/1')).then((response: any) => {
      this.organizations = response.items
      this.user.organizations = [{ org_id: response.items[0].OrganizationId }]
      this.user.role = "Operador"
      this.user.level = '1'
      console.log(this.organizations);
      this.isModalOpen = true;
    })
  }

  ChangeUserStatus(event: any, user: any) {
    this.api.UpdateRequestRender(this.endPoints.Render('users/' + user.user_id + "/status"), { enabled_flag: event.detail.checked ? 'Y' : 'N' }).then((response: any) => {
      console.log(response);
      if (response.errorsExistFlag && response.errorsExistFlag == true) {
        this.alerts.Error("Error al actualizar el usuario")
      } else if (response.errorsExistFlag == false) {
        this.alerts.Success("Usuario actualizado")
        user.enabled_flag = event.detail.checked ? 'Y' : 'N'
      }
    })
  }
  DeleteUser() {
    this.api.DeleteRequestRender(this.endPoints.Render('users/' + this.user.user_id)).then((response: any) => {
      console.log(response);
      if (response.errorsExistFlag && response.errorsExistFlag == true) {
        this.alerts.Error("Error al eliminar el usuario")
      } else if (response.errorsExistFlag == false) {
        this.alerts.Success("Usuario eliminado")
        this.users = this.users.filter((se: any) => se !== this.user);
        this.changeDetector.detectChanges()
      }
    })
  }
}
