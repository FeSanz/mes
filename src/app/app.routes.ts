import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'fusion_connection',
    loadComponent: () => import('./integrations/fusion/connection/connection.page').then( m => m.ConnectionPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'organizations',
    loadComponent: () => import('./integrations/fusion/modules/organizations/organizations.page').then( m => m.OrganizationsPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'shifts',
    loadComponent: () => import('./integrations/fusion/modules/shifts/shifts.page').then( m => m.ShiftsPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'resources',
    loadComponent: () => import('./integrations/fusion/modules/resources/resources.page').then( m => m.ResourcesPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'items',
    loadComponent: () => import('./integrations/fusion/modules/items/items.page').then( m => m.ItemsPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'wo',
    loadComponent: () => import('./integrations/fusion/modules/wo/wo.page').then( m => m.WoPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'monitoring',
    loadComponent: () => import('./production/monitoring/monitoring.page').then( m => m.MonitoringPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'devices',
    loadComponent: () => import('./production/devices/devices.page').then( m => m.DevicesPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'users',
    loadComponent: () => import('./settings/users/users.page').then( m => m.UsersPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'test',
    loadComponent: () => import('./test/test.page').then( m => m.TestPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then( m => m.LoginPage)
  },


];
