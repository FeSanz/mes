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
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

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
  isSmallScreen = false;
  user: any = {
    role: 'SuperAdmin',
    name: '',
    organizations: [],
    type: 'USER',
    password: '',
    email: '',
    level: 1,
    rfid: null,
    enabled_flag: 'Y'
  };
  isNewFlag = true
  organizations: any = []
  availableOrganizations: any[] = [];
  company: any = {}
  constructor(private apiService: ApiService, private breakpointObserver: BreakpointObserver,
    private endPoints: EndpointsService,
    private api: ApiService,
    private changeDetector: ChangeDetectorRef,
    private alerts: AlertsService) {
    addIcons({ ellipsisVerticalOutline, chevronForwardOutline, checkmarkOutline, addOutline, trashOutline, pencilOutline })
    const user = JSON.parse(String(localStorage.getItem("userData")))
    this.company = user.Company
    this.breakpointObserver.observe([Breakpoints.Handset])
      .subscribe(result => {
        this.isSmallScreen = result.matches;
      });
  }
  ngOnInit() {
    this.GetUsers();
  }
  GetUsers() {
    this.apiService.GetRequestRender(this.endPoints.Render('users?companyId=' + this.company.CompanyId)).then((response: any) => {
      this.users = response.items
      this.apiService.GetRequestRender(this.endPoints.Render('organizations/' + this.company.CompanyId)).then((responseOrg: any) => {
        this.organizations = responseOrg.items.map((org: any) => ({
          ...org,
          OrganizationId: Number(org.OrganizationId)
        }));
      })
      if (this.users) {
        this.users = this.users.map((item: any) => ({ ...item, selected: false }));
      }
    });
  }
  OnFilterGlobal(event: Event, table: any) {
    const target = event.target as HTMLInputElement;
    table.filterGlobal(target.value, 'contains');
  }
  compareOrganizations = (o1: any, o2: any): boolean => {
    return o1?.org_id === o2?.org_id;
  };
  ClearFilter(table: any) {
    table.clear();
    this.searchValueUsers = '';
  }
  AddNewUser() {
    this.user.password = btoa(this.user.password)
    this.api.PostRequestRender(this.endPoints.Render('users'), this.user).then((response: any) => {
      this.user.user_id = response.user_id
      this.isModalOpen = false
      this.users.push(this.user)
      this.resetUser()

      this.changeDetector.detectChanges()
    })
  }
  UpdateUser() {
    this.user.password = btoa(this.user.password)
    this.api.UpdateRequestRender(this.endPoints.Render('users/' + this.user.user_id), this.user).then((response: any) => {
      if (response.errorsExistFlag) {
        this.alerts.Info(response.message);
      } else {
        this.alerts.Success("Usuario actualizado")
        this.isModalOpen = false
        this.GetUsers()
        this.resetUser()
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
  /*get hasAvailableOrganizations(): boolean {
    const selectedOrgIds = this.user.organizations.map((org: any) => org.org_id);
    return this.organizations.some((org: any) => !selectedOrgIds.includes(org.OrganizationId));
  }
  getAvailableOrganizations(currentOrgId?: string): any[] {
    const selectedOrgIds = this.user.organizations.map((org: any) => org.org_id).filter((id: string) => id !== currentOrgId);
    return this.organizations.filter((org: any) =>
      !selectedOrgIds.includes(org.OrganizationId)
    );
  }*/
  OpenAsEditUser(user: any) {
    this.isNewFlag = false
    this.user = JSON.parse(JSON.stringify(user))
    this.user.password = atob(user.password)
    this.isModalOpen = true;
  }
  OpenAsNewUser() {
    this.resetUser()
    this.isNewFlag = true
    this.user.organizations = [{ org_id: this.organizations[0].OrganizationId }]
    this.isModalOpen = true;
  }
  ChangeUserStatus(event: any, user: any) {//Deshabilita al usuario
    this.api.UpdateRequestRender(this.endPoints.Render('users/' + user.user_id + "/status"), { enabled_flag: event.detail.checked ? 'Y' : 'N' }).then((response: any) => {
      if (response.errorsExistFlag) {
        this.alerts.Info(response.message);
      } else {
        this.alerts.Success("Usuario actualizado")
        user.enabled_flag = event.detail.checked ? 'Y' : 'N'
      }
    })
  }
  DeleteUser() {//eliminar usuario
    this.api.DeleteRequestRender(this.endPoints.Render('users/' + this.user.user_id)).then((response: any) => {
      if (response.errorsExistFlag) {
        this.alerts.Info(response.message);
      } else {
        this.alerts.Success("Usuario eliminado")
        this.users = this.users.filter((user: any) => user.user_id !== this.user.user_id);//se filtran los usuarios que no tengan este user_id
        this.isModalOpen = false
        this.changeDetector.detectChanges()
      }
    })
  }
  resetUser() {//se reinician los datos del usuario nuevo o a editar
    this.user = {
      role: 'Admin',
      name: '',
      organizations: [],
      type: 'USER',
      password: '',
      email: '',
      level: 1,
      rfid: null,
      enabled_flag: 'Y'
    };
  }
}
