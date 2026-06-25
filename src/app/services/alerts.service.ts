import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { addIcons } from "ionicons";
import { checkmarkCircle,  closeCircle,  warning, informationCircle } from "ionicons/icons";

import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class AlertsService {

  constructor(
    private messageService: MessageService,
    private alertController: AlertController) {

    addIcons({ checkmarkCircle, closeCircle, warning, informationCircle })
  }

  // El loader se monta en <body> (hermano de los p-dialog con appendTo="body" y de
  // los overlays de Ionic), NO dentro de <ion-app>. <ion-app> es un stacking context
  // con z-index:0 (clase .ion-page), así que el LoadingController nativo de Ionic, que
  // se cuelga dentro de <ion-app>, queda siempre por debajo de un p-dialog aunque su
  // z-index interno sea altísimo. Al montarlo en <body> con un z-index fijo máximo
  // queda por encima de TODO: p-dialog (~1101), overlays de Ionic (40000+) y p-toast
  // (999999). Es un loader de bloqueo global, así que debe estar siempre al frente.
  private static readonly LOADER_Z_INDEX = '2147483647';
  private loaderEl: HTMLElement | null = null;
  private static stylesInjected = false;

  async ShowLoading(message: string = 'Por favor espere...') {
    await this.HideLoading(); // Asegurarse de que cualquier loader previo sea cerrado
    this.injectLoadingStyles();

    const overlay = document.createElement('div');
    overlay.className = 'app-loading-overlay';

    const backdrop = document.createElement('div');
    backdrop.className = 'app-loading-backdrop';

    const box = document.createElement('div');
    box.className = 'app-loading-box';

    const spinner = document.createElement('div');
    spinner.className = 'app-loading-spinner';

    const text = document.createElement('div');
    text.className = 'app-loading-message';
    text.textContent = message; // textContent evita inyección de HTML

    box.appendChild(spinner);
    box.appendChild(text);
    overlay.appendChild(backdrop);
    overlay.appendChild(box);
    overlay.style.zIndex = AlertsService.LOADER_Z_INDEX;
    document.body.appendChild(overlay);
    this.loaderEl = overlay;
  }

  async HideLoading() {
    if (this.loaderEl) {
      this.loaderEl.remove();
      this.loaderEl = null;
    }
  }

  private injectLoadingStyles() {
    if (AlertsService.stylesInjected) { return; }
    AlertsService.stylesInjected = true;

    const style = document.createElement('style');
    style.id = 'app-loading-styles';
    style.textContent = `
      .app-loading-overlay {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .app-loading-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.32);
      }
      .app-loading-box {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
        min-width: 200px;
        max-width: 90vw;
        padding: 24px 28px;
        border-radius: 10px;
        background: var(--ion-background-color, #ffffff);
        color: var(--ion-text-color, #1f1f1f);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
      }
      .app-loading-spinner {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 3px solid rgba(127, 127, 127, 0.25);
        border-top-color: var(--ion-color-primary, #0054e9);
        animation: app-loading-rotate 0.7s linear infinite;
      }
      .app-loading-message {
        font-size: 0.95rem;
        font-weight: 500;
        text-align: center;
      }
      @keyframes app-loading-rotate {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  async Success(message: string, header: string = 'Exitoso', duration: number = 3000, sticky: boolean = false): Promise<void> {
    this.messageService.add({
      severity: 'success',
      summary: header,
      detail: message,
      life: duration,
      sticky: sticky, //Cierre automático
    });
  }

  async Error(message: string, header: string = 'Error', duration: number = 4000, sticky: boolean = false): Promise<void> {
    this.messageService.add({
      severity: 'error',
      summary: header,
      detail: message,
      life: duration,
      sticky: sticky, //Cierre automático
    });
  }

  async Warning(message: string, header: string = 'Precaución', duration: number = 3000, sticky: boolean = false): Promise<void> {
    this.messageService.add({
      severity: 'warn',
      summary: header,
      detail: message,
      life: duration,
      sticky: sticky, //Cierre automático
    });
  }

  async Info(message: string, header: string = 'Info', duration: number = 10000, sticky: boolean = false): Promise<void> {
    this.messageService.add({
      severity: 'info',
      summary: header,
      detail: message,
      life: duration,
      sticky: sticky, //Cierre automático
    });
  }

  async Secondary(message: string, header: string = 'Alerta', duration: number = 5000, sticky: boolean = false): Promise<void> {
    this.messageService.add({
      severity: 'secondary',
      summary: header,
      detail: message,
      life: duration,
      sticky: sticky, //Cierre automático
    });
  }

  async Contrast(message: string, header: string = 'Alerta', duration: number = 5000, sticky: boolean = false): Promise<void> {
    this.messageService.add({
      severity: 'contrast',
      summary: header,
      detail: message,
      life: duration,
      sticky: sticky, //Cierre automático
    });
  }

  ToastZIndex() {
    setTimeout(() => {
      const toast = document.querySelector('.p-toast') as HTMLElement;
      if (toast) {
        toast.style.zIndex = '999999';
      }
    }, 50);
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
