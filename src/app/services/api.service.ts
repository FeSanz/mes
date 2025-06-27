import { Injectable } from '@angular/core';
import { Capacitor, CapacitorHttp, HttpResponse } from '@capacitor/core';
import { AlertsService } from "./alerts.service";


@Injectable({
  providedIn: 'root'
})
export class ApiService {
  credentials: string = '';
  offset: number = 0;

  constructor(public alerts: AlertsService) {
    this.credentials = String(localStorage.getItem('credentials'));
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
        const url = this.offset === 0 ? endPoint : `${endPoint}&offset=${this.offset}`;
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
      await this.alerts.Error(`Error de conexión: ${error.message || error}`);
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

      await this.alerts.Error(`Error de conexión: ${error.message || error}`);
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
      const options = {
        url: endPoint,
        headers: { 'Content-Type': 'application/json' }
      };
      const response: HttpResponse = await CapacitorHttp.get(options);
      this.RequestStatusCode(response.status);
      return response.data;
    } catch (error: any) {
      console.log('Error (PG):', error);
      await this.alerts.Error(`Error de conexión (PG): ${error.message || error}`);
      return null;
    } finally {
      if (show) await this.alerts.HideLoading()
    }
  }

  async PostRequestRender(endPoint: string, payload: any, show: boolean = true) {
    try {
      if (show) await this.alerts.ShowLoading()
      const options = {
        url: endPoint,
        headers: { 'Content-Type': 'application/json' },
        data: payload
      };
      const response: HttpResponse = await CapacitorHttp.post(options);
      this.RequestStatusCode(response.status);
      return response.data;

    } catch (error: any) {
      console.log('Error (PG):', error);
      await this.alerts.Error(`Error de conexión (PG): ${error.message || error}`);
      return null;
    } finally {
      if (show) await this.alerts.HideLoading()
    }
  }

  async UpdateRequestRender(endPoint: string, payload: any) {
    await this.alerts.ShowLoading();
    try {
      const options = {
        url: endPoint,
        headers: { 'Content-Type': 'application/json' },
        data: payload
      };
      const response: HttpResponse = await CapacitorHttp.put(options);
      this.RequestStatusCode(response.status);
      return response.data;
    } catch (error: any) {
      console.log('Error (PG):', error);
      await this.alerts.Error(`Error de conexión (PG): ${error.message || error}`);
      return null;
    } finally {
      await this.alerts.HideLoading();
    }
  }

  async DeleteRequestRender(endPoint: string) {
    await this.alerts.ShowLoading();
    try {
      const options = {
        url: endPoint,
        headers: { 'Content-Type': 'application/json' }
      };
      const response: HttpResponse = await CapacitorHttp.delete(options);
      this.RequestStatusCode(response.status);
      return response.data;

    } catch (error: any) {
      console.log('Error (PG):', error);
      await this.alerts.Error(`Error de conexión (PG): ${error.message || error}`);
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
      this.alerts.Error("Solicitud incorrecta del cliente (400)");
    }
    else if (statusCode == 401) {
      this.alerts.Error("No autorizado (401)");
    }
    else if (statusCode == 403) {
      this.alerts.Warning("Autorizado pero sin acceso a datos (403)");
    }
    else if (statusCode == 404) {
      this.alerts.Error("Solicitud no encontrada (404)");
    }
    else if (statusCode == 405) {
      this.alerts.Error("Método de la solicitud no admitido (405)");
    }
    else if (statusCode == 500) {
      this.alerts.Error("Error interno del servidor (500)");
    }
    else {
      this.alerts.Error(`Error al procesar la solicitud (${statusCode})`);
    }
  }

  /*******************************Authentication************************** */
  async AuthRequestDatabase(url: string, user: string, password: string) {
    await this.alerts.ShowLoading("Autenticando...");
    password = btoa(password)
    try {
      const options = {
        url: url,
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
}
