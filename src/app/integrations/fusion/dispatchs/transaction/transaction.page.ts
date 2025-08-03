import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButtons, IonCol,
  IonContent, IonFab, IonFabButton,
  IonGrid,
  IonHeader, IonIcon,
  IonMenuButton, IonRow,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {FloatLabel} from "primeng/floatlabel";
import {Select} from "primeng/select";
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';

@Component({
  selector: 'app-transaction',
  templateUrl: './transaction.page.html',
  styleUrls: ['./transaction.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, FloatLabel, IonButtons, IonMenuButton,
    Select, IonGrid, IonRow, IonCol, Toast, IonFab, IonFabButton, IonIcon]
})
export class TransactionPage implements OnInit {

  constructor(private messageService: MessageService) { }

  ngOnInit() {
    console.log('ngOnInit');
  }

  OpenDispatch() {
    this.messageService.add({ severity: 'success', summary: 'Product Selected', detail: 'Holasasdasdsa'});
  }

}
