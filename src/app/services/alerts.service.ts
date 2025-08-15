import { Injectable } from '@angular/core';
import { LoadingController, AlertController, ToastController } from '@ionic/angular';
import { addIcons } from "ionicons";
import {
  checkmarkCircle,
  closeCircle,
  warning,
  informationCircle
} from "ionicons/icons";
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class AlertsService {


  constructor(
    private messageService: MessageService,
    public loadController: LoadingController,
    private alertController: AlertController,
    private toastController: ToastController) {

    addIcons({ checkmarkCircle, closeCircle, warning, informationCircle })
  }

  private loader: HTMLIonLoadingElement | null = null;

  async ShowLoading(message: string = 'Por favor espere...') {
    await this.HideLoading(); // Asegurarse de que cualquier loader previo sea cerrado
    this.loader = await this.loadController.create({
      message: message,
      spinner: 'crescent',
      translucent: true,
      cssClass: 'custom-loading'
    });

    await this.loader.present();
  }

  async HideLoading() {
    if (this.loader) {
      await this.loader.dismiss();
      this.loader = null;
    }
  }

  async Success(message: string, duration: number = 3000): Promise<void> {
    this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: message });
  }

  async Error(message: string, duration: number = 5000): Promise<void> {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
  }

  async Warning(message: string, duration: number = 4000): Promise<void> {
    this.messageService.add({ severity: 'warn', summary: 'Alerta', detail: message });

  }

  async Info(message: string, duration: number = 10000): Promise<void> {
    this.messageService.add({ severity: 'info', summary: 'Informativo', detail: message });
  }

  async ShowAlert(message: string, title: string = "Alerta", cancel: string = "Cancelar", confirm: string = "Aceptar") {//Alerta genérica para toma de desiciones
    const alert = await this.alertController.create({
      header: title,
      message: message,
      cssClass: "custom-alert",
      buttons: [
        {
          text: cancel,
          role: 'cancel',
        },
        {
          text: confirm,
          role: 'confirm',
        }
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();

    return role === 'confirm'
  }
}
