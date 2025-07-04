import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  server = "ws://localhost:3000";
  //server = "wss://iot-services-rd.onrender.com";
  

  constructor() { }

  Suscribe(sensor_id: string, onMessage: (data: any) => void): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.server);

      ws.onopen = () => {
        ws.send(JSON.stringify({ sensor_id }));
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
}
