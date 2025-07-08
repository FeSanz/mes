import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons, IonCard, IonCol,
  IonContent, IonGrid,
  IonHeader, IonIcon,
  IonMenuButton, IonRow,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {Button} from "primeng/button";
import {IconField} from "primeng/iconfield";
import {InputIcon} from "primeng/inputicon";
import {InputText} from "primeng/inputtext";
import {PrimeTemplate} from "primeng/api";
import {TableModule} from "primeng/table";
import {FormatForDisplayFromISO} from "../../../../models/date.format";
import {Badge} from "primeng/badge";
import {Tag} from "primeng/tag";
import {ProgressBar} from "primeng/progressbar";

@Component({
  selector: 'app-production',
  templateUrl: './production.page.html',
  styleUrls: ['./production.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonMenuButton, IonButton, IonCard, IonCol, IonGrid, IonIcon, IonRow, Button, IconField, InputIcon, InputText, PrimeTemplate, TableModule, Badge, Tag]
})
export class ProductionPage implements OnInit {

  constructor() { }

  ngOnInit() {
    console.log("");
  }

  protected readonly FormatForDisplayFromISO = FormatForDisplayFromISO;
}
