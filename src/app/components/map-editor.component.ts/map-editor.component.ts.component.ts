import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { IonMenuButton, IonItem, IonLabel, IonCol, IonButton, IonRow, IonInput } from '@ionic/angular/standalone';

@Component({
  selector: 'app-map-editor.component.ts',
  templateUrl: './map-editor.component.ts.component.html',
  standalone: true,
  imports: [IonMenuButton, IonItem, IonLabel, IonCol, IonButton, IonRow, IonInput],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrls: ['./map-editor.component.ts.component.scss'],
})
export class MapEditorComponentTsComponent implements OnInit {

  ngOnInit() { }

  @Input() data: any;

  constructor(private popoverCtrl: PopoverController) { }

  cerrar() {
    this.popoverCtrl.dismiss(this.data);
  }
}
