import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonText,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonCardHeader,
  IonCheckbox,
  IonInput,
  IonItem,
  IonIcon,
  IonToolbar,
  IonInputPasswordToggle,
  IonToggle,
  IonAvatar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { businessOutline, lockClosedOutline, personOutline } from 'ionicons/icons';
import { ApiService } from '../services/api.service';
import { NavController } from '@ionic/angular';
import { EndpointsService } from '../services/endpoints.service';
import { AlertsService } from '../services/alerts.service';
import { AppComponent } from '../app.component';
import { WebSocketService } from '../services/web-socket.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, CommonModule, FormsModule, IonText, IonButton, IonCard, IonCardContent, IonCardTitle, IonCardHeader, IonCheckbox,
    IonInput, IonItem, IonIcon, IonToolbar, IonInputPasswordToggle, IonToggle, IonAvatar]
})
export class LoginPage {
  entity: string = ""
  username: string = ""
  password: string = ""
  authRemember: boolean = false
  remoteServer = true

  constructor(private api: ApiService, 
    private navCtrl: NavController, 
    private endPoints: EndpointsService, 
    private alerts: AlertsService, 
    private app: AppComponent, 
    private ws: WebSocketService) {
    addIcons({ businessOutline, personOutline, lockClosedOutline });
    this.authRemember = localStorage.getItem("authRemember") == "true" ? true : false
    this.remoteServer = localStorage.getItem('remoteServer') == 'false' ? false : true
    const credentials: any = this.authRemember ? this.GetCredentials() : {}
    this.username = credentials.user
    this.password = credentials.password
    localStorage.getItem('isLogged') === 'true' ? this.LogIn() : null//si no ha cerrado sesión e ingresa al login se vuelve a iniciar sesión
  }

  LogIn() {
    this.api.AuthRequestDatabase('login', this.username, this.password).then((response: any) => {//obtener resultado del intento de login
      if (response.errorsExistFlag) {
        this.alerts.Info(response.message);
      } else {
        this.app.username = this.username
        localStorage.setItem("isLogged", "true")
        localStorage.setItem("tk", response.token)
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

  ionViewWillEnter() {
    this.app.showMenu = false
  }
  ChangeServerMode() {
    localStorage.setItem('remoteServer', String(this.remoteServer));
    this.api.setUrlRender(this.remoteServer)
    this.ws.setSocketServer(this.remoteServer)
    this.app.remoteServer = this.remoteServer
  }

}
