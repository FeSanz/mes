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

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, CommonModule, FormsModule, IonText, IonButton, IonCard, IonCardContent, IonCardTitle, IonCardHeader, IonCheckbox, IonInput, IonItem, IonIcon, IonMenuButton, IonButtons, IonToolbar, IonInputPasswordToggle]
})
export class LoginPage implements OnInit {
  entity: string = ""
  username: string = ""
  password: string = ""
  authRemember: boolean = false

  constructor(private api: ApiService, private navCtrl: NavController, private endPoints: EndpointsService, private alerts: AlertsService
  ) {
    addIcons({ businessOutline, personOutline, lockClosedOutline });
    this.authRemember = localStorage.getItem("authRemember") == "true" ? true : false
    const credentials: any = this.authRemember ? api.GetCredentials() : {}
    this.username = credentials.user
    this.password = credentials.password
  }

  ngOnInit() {
    addIcons({
      personOutline,
      lockClosedOutline,
      businessOutline
    })
  }

  LogIn() {
    this.api.AuthRequestDatabase(this.endPoints.Render('login'), this.username, this.password).then((response: any) => {
      console.log(response);
      if (!response.errorsExistFlag) {
        localStorage.setItem("isLogged", "true")
        if (this.authRemember) this.api.SaveCredentials(this.username, this.password, this.authRemember);
        this.alerts.Success("Bienvenido")
        this.navCtrl.navigateRoot('/monitoring');
      }
    })
  }
}
