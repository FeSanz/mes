import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {
  user: any = {}
  constructor() {
    this.user = JSON.parse(String(localStorage.getItem("userData")))
    console.log(this.user);

  }

  isAdmin(): boolean {
    return this.user?.Role === 'Admin';
  }

  isSuperAdmin(): boolean {
    return this.user?.Role === 'SuperAdmin';
  }

  isViewer(): boolean {
    return this.user?.Role === 'Viewer';
  }

  canEdit(): boolean {
    return this.isAdmin() || this.isSuperAdmin();
  }
  reloadUserData() {
    this.user = JSON.parse(String(localStorage.getItem("userData")))
  }
}
