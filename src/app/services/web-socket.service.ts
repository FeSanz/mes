import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  webSocketServer = "ws://localhost:3000";
  //scmServer = "ws://localhost:3000/workorders-ws";
  //server = "wss://iot-services-rd.onrender.com";


  constructor() { }

  Suscribe(sensor_id: string, onMessage: (data: any) => void): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.webSocketServer);

      ws.onopen = () => {
        ws.send(JSON.stringify({
          sensor_id,
          typews: 'sensor'}));
        resolve(ws);
      };

      ws.onerror = (err) => {
        console.error('Error en WebSocket', err);
        reject(err);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          onMessage(msg);
        } catch (e) {
          console.error('Error al procesar mensaje:', e);
        }
      };
    });
  }

  SuscribeById(id: any, typews: string, onMessage: (data: any) => void): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.webSocketServer);

      ws.onopen = () => {
        ws.send(JSON.stringify({
          ...id,
          typews: typews}));
        console.log(`Suscrito a ${typews} para Id: ${id}`);
        resolve(ws);
      };

      ws.onerror = (err) => {
        console.error(`Error en WebSocket de ${typews}:`, err);
        reject(err);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          onMessage(msg);
        } catch (e) {
          console.error(`Error al procesar mensaje de ${typews}:`, e);
        }
      };

      ws.onclose = (event) => {
        console.log(`WebSocket ${typews} cerrado:`, event.code, event.reason);
      };
    });
  }
}
