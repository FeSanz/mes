import { Injectable } from '@angular/core';
import { Capacitor, CapacitorHttp, HttpResponse } from '@capacitor/core';
import { AlertsService } from "./alerts.service";
import { CredentialsService } from "./credentials.service";
import { NavController } from '@ionic/angular';
import { logOut } from 'ionicons/icons';

import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private credentials: string = '';
  private urlFusion: string = '';
  // private urlRender: string = 'http://localhost:3000/api';
  private urlRender: string = 'https://iot-services-rd-ww45.onrender.com/api';

  offset: number = 0;

  constructor(public alerts: AlertsService, private messageService: MessageService, private credentialService: CredentialsService,
    private navCtrl: NavController) {
    const credentialsData = this.credentialService.Fusion();
    this.urlFusion = `https://${credentialsData[0]}/fscmRestApi/resources/latest`;
    this.credentials = credentialsData[1];
  }
  /******************* HttpRequest FUSION Capacitor *******************/
  async GetRequestFusion(endPoint: string) {
    this.offset = 0;
    let allItems: any[] = [];
    let totalResults = 0;
    let hasMore = true;
    let isFirstRequest = true;
    await this.alerts.ShowLoading();

    try {
      while (hasMore) {
        const url = this.offset === 0
          ? this.urlFusion + endPoint
          : `${this.urlFusion}${endPoint}&offset=${this.offset}`;
        const options = {
          url: url,
          headers: {
            'Authorization': `Basic ${this.credentials}`,
            'Content-Type': 'application/json',
            'REST-framework-version': '4',
            'Accept-Language': 'en-US'
          },
        };

        const response: HttpResponse = await CapacitorHttp.get(options);

        //Arrojar alerta si existe error solo en la primera petición
        if (isFirstRequest) {
          this.RequestStatusCode(response.status);
          isFirstRequest = false;
        }

        const data: any = JSON.parse(response.data);
        totalResults = data.totalResults;

        console.log(`Offset ${this.offset}:`, data.hasMore);

        // Acumular los items de esta página
        if (data.items && Array.isArray(data.items)) {
          allItems = allItems.concat(data.items);
        }

        // Mostrar progreso basado en items ya obtenidos
        if (totalResults < 500) {
          await this.alerts.ShowLoading(`Procesando datos [${totalResults} / ${totalResults}]`);
        } else {
          await this.alerts.ShowLoading(`Procesando datos [${allItems.length} / ${totalResults}]`);
        }

        // Verificar si existen más datos e incrementar offset
        hasMore = data.hasMore || false;
        if (hasMore) {
          this.offset += 500;
        }
      }

      // Construir respuesta final con todos los datos acumulados
      const finalResponse = {
        items: allItems,
        totalResults: totalResults,
        count: allItems.length,
      };

      console.log(`Total de resultados: ${totalResults}`);
      return JSON.stringify(finalResponse);

    } catch (error: any) {
      console.log('Error:', error);
      this.messageService.add({ severity: 'error', summary: 'Error de conexión', detail: `${error.message || error}`});
      return null;
    } finally {
      await this.alerts.HideLoading();
    }
  }

  async AuthRequestFusion(endPoint: string, credentialsTemp: string) {
    await this.alerts.ShowLoading();
    try {
      const options = {
        url: endPoint,
        headers: {
          'Authorization': `Basic ${credentialsTemp}`,
          'Content-Type': 'application/json',
          'REST-framework-version': '4',
          'Accept-Language': 'en-US'
        },
      };
      const response: HttpResponse = await CapacitorHttp.get(options);
      return response.status;
    }
    catch (error: any) {
      console.log('Error:', error);
      if (error?.status) {
        return error.status;
      } else if (error?.response?.status) {
        return error.response.status; // Algunas versiones lo ponen en response
      }

      this.messageService.add({ severity: 'error', summary: 'Error de conexión', detail: `${error.message || error}`});
      return -401;
    }
    finally {
      await this.alerts.HideLoading();
    }
  }

  /******************* HttpRequest RENDER Capacitor *******************/

  async GetRequestRender(endPoint: string, show: boolean = true) {
    try {
      if (show) await this.alerts.ShowLoading()
      const token = localStorage.getItem('tk')
      const options = {
        url: `${this.urlRender}/${endPoint}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        }
      };
      const response: HttpResponse = await CapacitorHttp.get(options);
      this.RequestStatusCode(response.status);
      return response.data;
    } catch (error: any) {
      console.log('Error (PG):', error);
      this.messageService.add({ severity: 'error', summary: 'Error de conexión render', detail: `${error.message || error}`});
      return null;
    } finally {
      if (show) await this.alerts.HideLoading()
    }
  }

  async PostRequestRender(endPoint: string, payload: any, show: boolean = true) {
    try {
      if (show) await this.alerts.ShowLoading()
      const token = localStorage.getItem('tk')
      const options = {
        url: `${this.urlRender}/${endPoint}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        data: payload
      };
      const response: HttpResponse = await CapacitorHttp.post(options);
      this.RequestStatusCode(response.status);
      return response.data;

    } catch (error: any) {
      console.log('Error (PG):', error);
      this.messageService.add({ severity: 'error', summary: 'Error de conexión render', detail: `${error.message || error}`});
      return null;
    } finally {
      if (show) await this.alerts.HideLoading()
    }
  }

  async PutRequestRender(endPoint: string, payload: any, show: boolean = true) {
    try {
      if (show) await this.alerts.ShowLoading()
      const token = localStorage.getItem('tk')
      const options = {
        url: `${this.urlRender}/${endPoint}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        data: payload
      };
      const response: HttpResponse = await CapacitorHttp.put(options);
      this.RequestStatusCode(response.status);
      return response.data;
    } catch (error: any) {
      console.log('Error (PG):', error);
      this.messageService.add({ severity: 'error', summary: 'Error de conexión render', detail: `${error.message || error}`});
      return null;
    } finally {
      if (show) await this.alerts.HideLoading()
    }
  }

  async DeleteRequestRender(endPoint: string) {
    await this.alerts.ShowLoading();
    const token = localStorage.getItem('tk')
    try {
      const options = {
        url: `${this.urlRender}/${endPoint}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        }
      };
      const response: HttpResponse = await CapacitorHttp.delete(options);
      this.RequestStatusCode(response.status);
      return response.data;

    } catch (error: any) {
      console.log('Error (PG):', error);
      this.messageService.add({ severity: 'error', summary: 'Error de conexión render', detail: `${error.message || error}`});
      return null;
    } finally {
      await this.alerts.HideLoading();
    }
  }

  RequestStatusCode(statusCode: number) {
    if (statusCode >= 200 && statusCode <= 202) {
      return;
    }
    else if (statusCode == 400) {
      this.messageService.add({ severity: 'error', summary: 'Error 400', detail: "Solicitud incorrecta del cliente"});
    }
    else if (statusCode == 401) {
      this.LogOut()
      this.messageService.add({ severity: 'error', summary: 'Error 401', detail: "No autorizado"});
    }
    else if (statusCode == 403) {
      this.messageService.add({ severity: 'warn', summary: 'Error 403', detail: "Autorizado pero sin acceso a datos"});
    }
    else if (statusCode == 404) {
      this.messageService.add({ severity: 'error', summary: 'Error 404', detail: "Solicitud no encontrada"});
    }
    else if (statusCode == 405) {
      this.messageService.add({ severity: 'error', summary: 'Error 405', detail: "Método de la solicitud no admitido"});
    }
    else if (statusCode == 440) {
      this.LogOut()
      this.messageService.add({ severity: 'error', summary: 'Error 440', detail: "Sesión expirada"});
    }
    else if (statusCode == 500) {
      this.messageService.add({ severity: 'error', summary: 'Error 500', detail: "Error interno del servidor"});
    }
    else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: `Error al procesar la solicitud (${statusCode})`});
    }
  }
  LogOut() {
    localStorage.setItem("isLogged", "false")
    this.navCtrl.navigateRoot('/login');
  }
  /*******************************Authentication************************** */
  async AuthRequestDatabase(url: string, user: string, password: string) {
    await this.alerts.ShowLoading("Autenticando...");
    password = btoa(password)
    try {
      const options = {
        url: `${this.urlRender}/${url}`,
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          "email": user,
          "password": password
        }
      };
      const response: HttpResponse = await CapacitorHttp.post(options);
      //this.RequestStatusCode(response.status);
      return response.data;

    } catch (error: any) {
      console.log('Error (PG):', error);
      //await this.alerts.Error(`Error de conexión (PG): ${error.message || error}`);
      return null;
    } finally {
      await this.alerts.HideLoading();
    }
  }


  async GetRequestFusionOnceTime(endPoint: string, credentials: String) {
    this.offset = 0;
    let allItems: any[] = [];
    let totalResults = 0;
    let hasMore = true;
    let isFirstRequest = true;
    await this.alerts.ShowLoading();

    try {
      while (hasMore) {
        const url = this.offset === 0
          ? endPoint
          : `${endPoint}&offset=${this.offset}`;
        const options = {
          url: url,
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
            'REST-framework-version': '4',
            'Accept-Language': 'en-US'
          },
        };

        const response: HttpResponse = await CapacitorHttp.get(options);

        //Arrojar alerta si existe error solo en la primera petición
        if (isFirstRequest) {
          this.RequestStatusCode(response.status);
          isFirstRequest = false;
        }

        const data: any = JSON.parse(response.data);
        totalResults = data.totalResults;

        console.log(`Offset ${this.offset}:`, data.hasMore);

        // Acumular los items de esta página
        if (data.items && Array.isArray(data.items)) {
          allItems = allItems.concat(data.items);
        }

        // Mostrar progreso basado en items ya obtenidos
        if (totalResults < 500) {
          await this.alerts.ShowLoading(`Procesando datos [${totalResults} / ${totalResults}]`);
        } else {
          await this.alerts.ShowLoading(`Procesando datos [${allItems.length} / ${totalResults}]`);
        }

        // Verificar si existen más datos e incrementar offset
        hasMore = data.hasMore || false;
        if (hasMore) {
          this.offset += 500;
        }
      }

      // Construir respuesta final con todos los datos acumulados
      const finalResponse = {
        items: allItems,
        totalResults: totalResults,
        count: allItems.length,
      };

      console.log(`Total de resultados: ${totalResults}`);
      return JSON.stringify(finalResponse);

    } catch (error: any) {
      console.log('Error:', error);
      this.messageService.add({ severity: 'error', summary: 'Error de conexión', detail: `${error.message || error}`});
      return null;
    } finally {
      await this.alerts.HideLoading();
    }
  }

  getUrlRender(){
    return this.urlRender;
  }
}
