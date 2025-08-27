import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons } from '@ionic/angular/standalone';
import * as L from 'leaflet';
import { ModalController } from '@ionic/angular';
import { OpenStreetMapProvider, GeoSearchControl } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';


delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
  iconUrl: 'assets/leaflet/marker-icon.png',
  shadowUrl: 'assets/leaflet/marker-shadow.png'
});

@Component({
  selector: 'app-select-location-modal',
  templateUrl: './select-location-modal.page.html',
  styleUrls: ['./select-location-modal.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButton, IonButtons]
})
export class SelectLocationModalPage implements OnInit, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  map: any;
  marker: any;
  selectedCoords: { lat: number; lng: number; } | undefined;
  direction: any;

  constructor(private modalCtrl: ModalController) { }

  ngAfterViewInit() {
    // Esperar a que el contenedor tenga dimensiones
    setTimeout(() => {
      this.initMap();
    }, 400); // Puedes ajustar este tiempo si es necesario
  }

  initMap() {
    this.map = L.map('map').setView([19.4326, -99.1332], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data © OpenStreetMap contributors',
    }).addTo(this.map);

    const provider = new OpenStreetMapProvider();

    const searchControl = new (GeoSearchControl as any)({
      provider,
      style: 'bar',
      autoComplete: true,
      autoCompleteDelay: 250,
      showMarker: true,
      showPopup: false,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
    });

    this.map.addControl(searchControl);

    this.map.on('geosearch/showlocation', (result: any) => {
      const { x, y } = result.location;
      this.selectedCoords = { lat: y, lng: x };

      if (this.marker) {
        this.marker.setLatLng([y, x]);
      } else {
        this.marker = L.marker([y, x]).addTo(this.map);
      }
    });

    this.map.on('click', async (e: any) => {
      const { lat, lng } = e.latlng;
      this.selectedCoords = { lat, lng };

      if (this.marker) {
        this.marker.setLatLng(e.latlng);
      } else {
        this.marker = L.marker(e.latlng).addTo(this.map);
      }

      this.direction = await this.getAddressFromCoords(lat, lng);
    });

    setTimeout(() => {
      this.map.invalidateSize();
    }, 200);
  }



  ngOnInit() {
  }


  confirmSelection() {
    const data = {
      coordinates: this.selectedCoords,
      address: this.direction
    };

    this.modalCtrl.dismiss(data);
  }

  close() {
    this.modalCtrl.dismiss(null);
  }

  setMarker(lat: number, lng: number) {
    this.selectedCoords = { lat, lng };

    if (this.marker) {
      this.map.removeLayer(this.marker);
    }

    this.marker = L.marker([lat, lng]).addTo(this.map);
  }

  async getAddressFromCoords(lat: number, lng: number): Promise<String | null> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data.display_name?.trim()){
        return 'Dirección no disponible';
      } else {
        return data.display_name;
      }      
    } catch (error) {
      console.log('Error al obtener dirección');
      return null;
    }
  }

}
