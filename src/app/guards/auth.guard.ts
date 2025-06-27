import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { NavController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private navCtrl: NavController
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    return this.checkAuth();
  }

  checkAuth(): boolean {
    const authed = this.isAuthenticated();
    return authed || this.routeToLogin();
  }

  private routeToLogin(): boolean {
    this.navCtrl.navigateRoot('/login');
    return false; // <- cambia a false, porque no debe permitir el acceso
  }

  isAuthenticated(): boolean {
    return localStorage.getItem('isLogged') === 'true';
  }
}