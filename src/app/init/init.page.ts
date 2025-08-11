import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { ApiService } from 'src/app/services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-init',
  templateUrl: './init.page.html',
  styleUrls: ['./init.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class InitPage implements OnInit {

  constructor(private router: Router, private api: ApiService) { }

  async ngOnInit() {

    try {
      const response = await this.api.GetRequestRender('userNumber');
      // const count = parseInt(response.items);
      console.log(response);
      const count = 0;
      const isLogged = localStorage.getItem('isLogged') === 'true';

      if (count === 0) {
        this.router.navigateByUrl('/setup-page');
      } else if (isLogged) {
        this.router.navigateByUrl('/monitoring/:groupId');
      } else {
        this.router.navigateByUrl('/login');
      }
    } catch (error) {
      this.router.navigateByUrl('/login');
    }
  }

}
