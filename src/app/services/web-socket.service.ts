import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  // webSocketServer = "ws://localhost:3000";
  webSocketServer = "wss://iot-services-rd-ww45.onrender.com";

  constructor() {
    const remoteServer = localStorage.getItem('remoteServer') == 'false' ? false : true
    this.webSocketServer = remoteServer ? "wss://iot-services-rd-ww45.onrender.com" : "ws://localhost:3000";
  }

  SuscribeById(id: any, typews: string, onMessage: (data: any) => void): Promise<{ ws: WebSocket, unsubscribe: () => void }> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.webSocketServer);

      const unsubscribe = () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };

      ws.onopen = () => {
        ws.send(JSON.stringify({
          ...id,
          typews: typews
        }));
        resolve({ ws, unsubscribe });
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

      ws.onclose = () => {
        //console.log(`WebSocket cerrado: ${typews}`);
      };
    });
  }

  setSocketServer(remoteServer: boolean) {
    this.webSocketServer = remoteServer ? "wss://iot-services-rd-ww45.onrender.com" : "ws://localhost:3000";
  }
}
