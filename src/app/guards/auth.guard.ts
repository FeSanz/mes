import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { NavController } from '@ionic/angular';
import { ApiService } from '../services/api.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: ApiService,
    private navCtrl: NavController
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    return await this.checkAuth();
  }

  async checkAuth() {
    const authed = await this.authService.isAuthenticated();
    return authed || this.routeToLogin();
  }

  private routeToLogin(): boolean {
    this.navCtrl.navigateRoot('/login');
    return true;
  }
}