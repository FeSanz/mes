import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonIcon, IonFab, IonFabButton, IonItem, IonButton, IonSelectOption, IonText, IonModal, IonInput, IonSelect, IonLoading, IonRippleEffect } from '@ionic/angular/standalone';


@Component({
  selector: 'app-alerts',
  templateUrl: './alerts.page.html',
  styleUrls: ['./alerts.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,/* IonIcon, IonFab, IonFabButton,
    IonItem, IonButton, IonSelectOption, IonText, IonModal, IonInput, IonSelect, IonLoading*/]
})
export class AlertsPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
