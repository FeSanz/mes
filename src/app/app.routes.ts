import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'fusion_connection',
    loadComponent: () => import('./integrations/fusion/connection/connection.page').then( m => m.ConnectionPage)
  },
  {
    path: 'organizations',
    loadComponent: () => import('./integrations/fusion/modules/organizations/organizations.page').then( m => m.OrganizationsPage)
  },
  {
    path: 'monitoring',
    loadComponent: () => import('./production/monitoring/monitoring.page').then( m => m.MonitoringPage)
  },
  {
    path: 'devices',
    loadComponent: () => import('./production/devices/devices.page').then( m => m.DevicesPage)
  },
  {
    path: 'users',
    loadComponent: () => import('./settings/users/users.page').then( m => m.UsersPage)
  },

];
