import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonText, IonButton, IonCard, IonCardContent, IonCardTitle, IonCardHeader, IonCheckbox, IonInput, IonItem, IonIcon, IonMenuButton, IonButtons, IonToolbar, IonInputPasswordToggle
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { businessOutline, eyeOffOutline, lockClosed, lockClosedOutline, personOutline } from 'ionicons/icons';
import { ApiService } from '../services/api.service';
import { NavController } from '@ionic/angular';
import { EndpointsService } from '../services/endpoints.service';
import { AlertsService } from '../services/alerts.service';
import { AppComponent } from '../app.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, CommonModule, FormsModule, IonText, IonButton, IonCard, IonCardContent, IonCardTitle, IonCardHeader, IonCheckbox, IonInput, IonItem, IonIcon, IonMenuButton, IonButtons, IonToolbar, IonInputPasswordToggle]
})
export class LoginPage {
  entity: string = ""
  username: string = ""
  password: string = ""
  authRemember: boolean = false

  constructor(private api: ApiService, private navCtrl: NavController, private endPoints: EndpointsService, private alerts: AlertsService, private app: AppComponent) {
    addIcons({ businessOutline, personOutline, lockClosedOutline });
    this.authRemember = localStorage.getItem("authRemember") == "true" ? true : false
    localStorage.getItem('isLogged') === 'true' ? app.GoToDashboards(0) : null
    const credentials: any = this.authRemember ? this.GetCredentials() : {}
    this.username = credentials.user
    this.password = credentials.password
  }

  LogIn() {
    this.api.AuthRequestDatabase(this.endPoints.Render('login'), this.username, this.password).then((response: any) => {//obtener resultado del intento de login
      if (response.errorsExistFlag) {
        this.alerts.Info(response.message);
      } else {
        this.app.username = this.username
        localStorage.setItem("isLogged", "true")
        localStorage.setItem("user", this.username)
        localStorage.setItem("userData", JSON.stringify(response.items))//Se guarda la información del usuario
        localStorage.setItem("pwd", this.password)
        localStorage.setItem("authRemember", String(this.authRemember))//Recordar usuario
        this.alerts.Success("Bienvenido")
        this.app.SaveLogin(response.items, this.username)
      }
    })
  }

  GetCredentials() {//Retorna el usuario y contraseña
    const credentials = {
      user: localStorage.getItem("user"),
      password: localStorage.getItem("pwd")
    }
    return credentials
  }
}
