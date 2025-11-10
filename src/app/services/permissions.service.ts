import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {
  user: any = {}
  constructor() {
    const rawData = localStorage.getItem("userData");
    try {
      this.user = rawData ? JSON.parse(rawData) : {};
    } catch (e) {
      this.user = {};
    }
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
  
  isAndon(): boolean {
    return this.user?.Role === 'Andon';
  }

  canEdit(): boolean {
    return this.isAdmin() || this.isSuperAdmin();
  }

  reloadUserData() {
    this.user = JSON.parse(String(localStorage.getItem("userData") == "undefined" ? "{}" : localStorage.getItem("userData")))
  }
}
