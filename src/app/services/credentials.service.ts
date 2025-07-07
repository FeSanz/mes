import { Injectable } from '@angular/core';
import { AlertsService } from "./alerts.service";

@Injectable({
  providedIn: 'root'
})
export class CredentialsService {

  constructor(public alerts: AlertsService) {
  }

  /*******************************Credentials************************** */
  Fusion(): string[]{
    const userDataString = localStorage.getItem("userData");
    if (!userDataString) {
      console.log('No se encontraron datos de usuario');
      return [];
    }

    const userData = JSON.parse(userDataString);

    // Validar estructura básica
    if (!userData?.Company?.Settings) {
      console.log('Estructura de datos inválida');
      return [];
    }

    const settingsData = userData.Company.Settings;

    if (!Array.isArray(settingsData)) {
      console.log('Configuraciones no encontradas');
      return [];
    }

    // Buscar configuraciones de Fusion
    const fusionSettings = settingsData.filter((item: any) =>
      item.Name === "FUSION_URL" || item.Name === "FUSION_CREDENTIALS"
    );

    const host = fusionSettings.find((item: any) => item.Name === "FUSION_URL")?.Value;
    const credentials = fusionSettings.find((item: any) => item.Name === "FUSION_CREDENTIALS")?.Value;

    // Validación si se obtivieron los valores
    if (!host || !credentials) {
      console.log('Dirección y/o credenciales no encontrados');
      return [];
    }

    return [host, credentials];
  }
}
