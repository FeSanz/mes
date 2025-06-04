import { Injectable } from '@angular/core';
import { LoadingController, AlertController, ToastController } from '@ionic/angular';
import {addIcons} from "ionicons";
import {
  checkmarkCircle,
  closeCircle,
  warning,
  informationCircle
} from "ionicons/icons";

@Injectable({
  providedIn: 'root'
})
export class AlertsService {


  constructor(public loadController: LoadingController,
              private alerControlller: AlertController,
              private toastController: ToastController) {

      addIcons({checkmarkCircle, closeCircle, warning, informationCircle})
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
    const toast = await this.toastController.create({
      message,
      duration,
      position: 'top',
      color: 'success',
      cssClass: 'alertify-toast alertify-success',
      buttons: [
        {
          icon: 'checkmark-circle',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  async Error(message: string, duration: number = 5000): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      position: 'top',
      color: 'danger',
      cssClass: 'alertify-toast alertify-error',
      buttons: [
        {
          icon: 'close-circle',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  async Warning(message: string, duration: number = 4000): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      position: 'top',
      color: 'warning',
      cssClass: 'alertify-toast alertify-warning',
      buttons: [
        {
          icon: 'warning',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  async Info(message: string, duration: number = 10000): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      position: 'top',
      color: 'primary',
      cssClass: 'alertify-info-container alertify-info',
      buttons: [
        {
          icon: 'information-circle',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }
}
