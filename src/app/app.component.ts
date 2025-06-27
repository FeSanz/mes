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
  IonToggle, IonAvatar, IonCol, IonGrid, IonRow, IonModal, IonInput, IonTextarea, IonSelect, IonSelectOption, IonFab, IonFabButton, IonSplitPane, IonRouterLink
} from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from "@angular/router";
import {
  person, ellipsisVerticalOutline, personOutline, settingsOutline, powerOutline, homeOutline, cubeOutline,
  statsChartOutline, hardwareChipOutline, hammerOutline, warningOutline, timeOutline, peopleOutline,
  gitNetworkOutline, closeOutline, barChartOutline, pieChartOutline, addOutline, checkmark, pencilOutline, trashOutline
} from 'ionicons/icons';
import { FormsModule } from '@angular/forms';
import { ApiService } from './services/api.service';
import { EndpointsService } from './services/endpoints.service';
import { CommonModule } from '@angular/common';
import { AlertsService } from './services/alerts.service';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: 'app.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonApp, RouterLink, IonMenu, IonToolbar, IonHeader, IonTitle, IonItem, IonIcon, IonLabel,
    IonButtons, IonButton, IonPopover, IonContent, IonList, IonMenuToggle, IonAccordionGroup, IonSplitPane,
    IonAccordion, IonFooter, IonNote, RouterLinkActive, IonRouterOutlet, IonToggle, FormsModule, CommonModule, IonAvatar, IonCol, IonGrid, IonRow, IonModal, IonInput, IonTextarea, IonSelect, IonSelectOption, IonFab, IonFabButton, IonRouterLink],
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
  showMenu = true;
  constructor(private navCtrl: NavController, private changeDetector: ChangeDetectorRef, private router: Router, private alerts: AlertsService,
    private endPoints: EndpointsService,
    private api: ApiService,
  ) {
    addIcons({ ellipsisVerticalOutline, personOutline, settingsOutline, powerOutline, pieChartOutline, statsChartOutline, pencilOutline, trashOutline, addOutline, cubeOutline, hardwareChipOutline, hammerOutline, warningOutline, timeOutline, peopleOutline, gitNetworkOutline, checkmark, barChartOutline, closeOutline, person, homeOutline });
    const isLogged = localStorage.getItem('isLogged') == 'true' ? true : false
    this.user = JSON.parse(String(localStorage.getItem("userData")))
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
    this.changeDetector.detectChanges()
  }

  HandleClick(event: Event) {//detener la propagación de clics
    event.stopPropagation();
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
    this.api.GetRequestRender(this.endPoints.Render('dashboardsGroup/company/' + this.user.Company.CompanyId), false).then((response: any) => {
      this.dashboardGroups = response.items
      console.log(response);

    })
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
    this.api.GetRequestRender(this.endPoints.Render('dashboardsGroup/company/' + this.user.Company.CompanyId), false).then((response: any) => {
      console.log(response.items[0]);
      this.dashboardGroups = response.items
      console.log(this.dashboardGroups);
      this.router.navigate(['/monitoring/' + response.items[0].dashboard_group_id], {
        state: {
          dash: response.items[0]
        }
      });
    })
  }
}
