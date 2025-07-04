import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { addIcons } from 'ionicons';

import {
  IonAccordion,
  IonAccordionGroup,
  IonApp,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonNote,
  IonPopover,
  IonRouterOutlet,
  IonTitle,
  IonToolbar,
  IonToggle, IonAvatar, IonCol, IonGrid, IonRow, IonModal, IonInput, IonTextarea, IonSelect, IonSelectOption, IonFab, IonFabButton, IonSplitPane, IonRouterLink, IonReorder, IonReorderGroup, ItemReorderEventDetail
} from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from "@angular/router";
import {
  person, ellipsisVerticalOutline, personOutline, settingsOutline, powerOutline, homeOutline, cubeOutline,
  statsChartOutline, hardwareChipOutline, hammerOutline, warningOutline, timeOutline, peopleOutline,
  gitNetworkOutline, closeOutline, barChartOutline, pieChartOutline, addOutline, checkmark, pencilOutline, trashOutline, reorderThreeOutline, reorderTwoOutline
} from 'ionicons/icons';
import { FormsModule } from '@angular/forms';
import { ApiService } from './services/api.service';
import { EndpointsService } from './services/endpoints.service';
import { CommonModule } from '@angular/common';
import { AlertsService } from './services/alerts.service';
import { PermissionsService } from './services/permissions.service';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: 'app.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonApp, RouterLink, IonMenu, IonToolbar, IonHeader, IonTitle, IonItem, IonIcon, IonLabel,
    IonButtons, IonButton, IonPopover, IonContent, IonList, IonMenuToggle, IonAccordionGroup, IonSplitPane, IonReorder, IonReorderGroup,
    IonAccordion, IonFooter, IonNote, RouterLinkActive, IonRouterOutlet, IonToggle, FormsModule, CommonModule, IonAvatar, IonCol, IonGrid, IonRow, IonModal, IonInput, IonTextarea, IonSelect, IonSelectOption, IonFab, IonFabButton, IonRouterLink,],
})
export class AppComponent {
  darkMode = false
  username = "Inicie sesión"
  dashboardGroups: any = []
  dashboardGroupData: any = {
    group_name: "",
    description: "",
    organization_id: "",
    created_by: "",
    isNew: true
  }
  isModalOpen = false
  user: any = {}
  showMenu = false;
  editDashOrder = false
  constructor(
    private router: Router,
    private api: ApiService,
    private alerts: AlertsService,
    private navCtrl: NavController,
    private endPoints: EndpointsService,
    public permissions: PermissionsService,
    private changeDetector: ChangeDetectorRef,
  ) {
    addIcons({ ellipsisVerticalOutline, settingsOutline, powerOutline, pieChartOutline, pencilOutline, closeOutline, statsChartOutline, reorderTwoOutline, trashOutline, addOutline, cubeOutline, hardwareChipOutline, hammerOutline, warningOutline, timeOutline, peopleOutline, gitNetworkOutline, checkmark, reorderThreeOutline, personOutline, barChartOutline, person, homeOutline });
    const isLogged = localStorage.getItem('isLogged') == 'true' ? true : false
    const rawData = localStorage.getItem("userData");
    try {
      this.user = rawData ? JSON.parse(rawData) : {};
    } catch (e) {
      this.user = {};
    }
    isLogged ? this.username = String(localStorage.getItem('user') || "No user") : "Inicie sesión"
    const theme = localStorage.getItem('theme');
    if (theme == null) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: light)');
      this.darkMode = prefersDark.matches;
      document.body.classList.toggle('dark', this.darkMode);
    } else {
      this.darkMode = theme == 'true' ? true : false;
      document.body.classList.toggle('dark', this.darkMode);
    }
    isLogged && this.GetDashGroup()
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.showMenu = !event.url.includes('login');
      }
    });
  }

  ChangeColorMode() {
    document.body.classList.toggle('dark', this.darkMode);
    localStorage.setItem('theme', String(this.darkMode));
  }

  LogOut() {//cierra sesión, resetea la ruta y reasiga el nombre de usuario
    this.username = "Inicie sesión"
    localStorage.setItem("isLogged", "false")
    this.navCtrl.navigateRoot('/login');
    this.permissions.reloadUserData()
    this.changeDetector.detectChanges()
  }

  Reorder(event: Event, state: boolean) {
    event.stopPropagation();//detener la propagación de clicks
    this.editDashOrder = state
    this.changeDetector.detectChanges()
  }

  HandleClick(event: Event) {
    event.stopPropagation();//detener la propagación de clicks
  }

  handleReorder(event: CustomEvent<ItemReorderEventDetail>) {
    const from = event.detail.from;
    const to = event.detail.to;
    const movedItem = this.dashboardGroups.splice(from, 1)[0];
    this.dashboardGroups.splice(to, 0, movedItem);
    // Actualizar índices después del reordenamiento
    this.dashboardGroups = this.dashboardGroups.map((item: any, index: any) => ({
      ...item,
      index: index
    }));
    event.detail.complete();
    this.saveDashboardOrder()
  }
  trackByGroup(index: number, item: any): number {
    return item.dashboard_group_id;
  }
  saveDashboardOrder() {
    const body = this.dashboardGroups.map((group: any) => ({
      dashboard_group_id: group.dashboard_group_id,
      index: group.index
    }));
    //console.log(body);

    this.api.UpdateRequestRender(this.endPoints.Render('dashboardsGroup/order'), { items: body }, false).then(response => {
      if (!response.errorsExistFlag) {
        //this.alerts.Success("Dashboard eliminado")
      } else {
        this.alerts.Error("Error al reordenar la lista, intente más tarde.")
      }
    });
  }
  GoToDashboards(dash: any) {//navega hacia los tableros y manda los parámetros necesarios
    this.router.navigate(['/monitoring/' + dash.dashboard_group_id], {
      state: {
        dash: dash
      }
    });
  }
  setOpen(isOpen: boolean) {//abrir modal para nuevo grupo de tableros
    this.isModalOpen = isOpen
    this.dashboardGroupData = {
      group_name: "Dashboard " + (Number(this.dashboardGroups.length) + 1),
      description: "",
      organization_id: this.user.Company.Organizations[0].OrganizationId,
      created_by: this.user.UserId,
      isNew: true
    }
  }
  addNewWidgetGroup() {//llamada a la api para crear el grupo de tableros
    this.dashboardGroupData.created_by = this.user.UserId
    this.dashboardGroupData.index = Number(this.dashboardGroups.length) + 1
    this.api.PostRequestRender(this.endPoints.Render('dashboardsGroup'), this.dashboardGroupData).then((response: any) => {
      if (!response.errorsExistFlag) {
        this.alerts.Success("Dashboard creado")
        this.isModalOpen = false
        this.dashboardGroupData = {
          group_name: "",
          description: "",
          organization_id: "",
          created_by: "",
          isNew: true
        }
        this.GetDashGroup()
        this.changeDetector.detectChanges()
      } else {
        this.alerts.Info(response.error)
      }
    })
  }
  GetDashGroup() {//extrae todos los grupos de tableros
    if (this.user?.Company?.Organizations?.length > 0) {
      const orgsIds = this.user.Company.Organizations.map((org: any) => org.OrganizationId).join(',');//IDs separados por coma (,)
      this.api.GetRequestRender(this.endPoints.Render('dashboardsGroup/byOrganizations/?organizations=' + orgsIds), false).then((response: any) => {
        this.dashboardGroups = response.items
        //console.log(this.dashboardGroups);
      })
    } else {
      this.alerts.Error("No hay organizaciones relacionadas con el usuario")
    }
  }
  editDashGroup(dashGroup: any) {
    this.dashboardGroupData = JSON.parse(JSON.stringify(dashGroup))
    this.dashboardGroupData.organization_id = Number(this.dashboardGroupData.organization_id)
    this.isModalOpen = true
    this.dashboardGroupData.isNew = false
  }
  async deleteDashGroup(dashId: any = 0) {
    if (await this.alerts.ShowAlert("¿Deseas eliminar este grupo de tableros?", "Alerta", "Atrás", "Eliminar")) {
      this.api.DeleteRequestRender(this.endPoints.Render('dashboardsGroup/') + (dashId != 0 ? dashId : this.dashboardGroupData.dashboard_group_id)).then((response: any) => {
        if (!response.errorsExistFlag) {
          this.dashboardGroups = this.dashboardGroups.filter((dash: any) => dash.dashboard_group_id !== dashId);
          this.changeDetector.detectChanges()
          this.alerts.Success("Dashboard eliminado")
        } else {
          this.alerts.Info(response.error)
        }
      })
    }
  }
  updateWidgetGroup() {
    this.api.UpdateRequestRender(this.endPoints.Render('dashboardsGroup/' + this.dashboardGroupData.dashboard_group_id), this.dashboardGroupData).then((response: any) => {
      if (response.errorsExistFlag) {
        this.alerts.Info(response.message);
      } else {
        this.alerts.Success("Dashboard actualizado")
        this.dashboardGroupData = {
          group_name: "",
          description: "",
          organization_id: "",
          created_by: "",
          isNew: true
        }
        this.GetDashGroup()
        this.isModalOpen = false
        this.changeDetector.detectChanges()
      }
    })
  }
  SaveLogin(user: any, username: any) {//login
    this.user = user
    this.username = username
    const orgsIds = this.user.Company.Organizations.map((org: any) => org.OrganizationId).join(',');//IDs separados por coma (,)
    this.api.GetRequestRender(this.endPoints.Render('dashboardsGroup/byOrganizations/?organizations=' + orgsIds), false).then((response: any) => {
      //console.log(response);
      if (response.errorsExistFlag) {
        this.alerts.Info(response.message);
      } else {
        this.permissions.reloadUserData()
        this.dashboardGroups = response.items
        //console.log(response.items);
        if (response.items[0]) {
          this.router.navigate(['/monitoring/' + response.items[0].dashboard_group_id], {
            state: {
              dash: response.items[0]
            }
          });
        } else {
          this.router.navigate(['/settings/users'], {
            state: {
              dash: response.items[0]
            }
          });
        }
      }
    })
  }
}
