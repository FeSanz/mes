import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'init',
    pathMatch: 'full'
  },
  {
    path: 'fusion_connection',
    loadComponent: () => import('./integrations/fusion/connection/connection.page').then(m => m.ConnectionPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'organizations',
    loadComponent: () => import('./integrations/fusion/modules/organizations/organizations.page').then(m => m.OrganizationsPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'shifts',
    loadComponent: () => import('./integrations/fusion/modules/shifts/shifts.page').then(m => m.ShiftsPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'resources',
    loadComponent: () => import('./integrations/fusion/modules/resources/resources.page').then(m => m.ResourcesPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'items',
    loadComponent: () => import('./integrations/fusion/modules/items/items.page').then(m => m.ItemsPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'wo',
    loadComponent: () => import('./integrations/fusion/modules/wo/wo.page').then(m => m.WoPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'monitoring/:groupId',
    loadComponent: () => import('./production/monitoring/monitoring.page').then(m => m.MonitoringPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'devices',
    loadComponent: () => import('./production/devices/devices.page').then(m => m.DevicesPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'settings/users',
    loadComponent: () => import('./settings/users/users.page').then(m => m.UsersPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'test',
    loadComponent: () => import('./test/test.page').then(m => m.TestPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'settings/user',
    loadComponent: () => import('./settings/user/user.page').then(m => m.UserPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'fusion_production',
    loadComponent: () => import('./integrations/fusion/monitoring/production/production.page').then(m => m.ProductionPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'alerts',
    loadComponent: () => import('./integrations/modules/alerts/alerts.page').then(m => m.AlertsPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'settings/machines',
    loadComponent: () => import('./settings/machines/machines.page').then(m => m.MachinesPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'dispatch_transaction',
    loadComponent: () => import('./integrations/fusion/dispatchs/transaction/transaction.page').then(m => m.TransactionPage)
  },
  {
    path: 'setup-page',
    loadComponent: () => import('./setup-page/setup-page.page').then(m => m.SetupPagePage)
  },
  {
    path: 'init',
    loadComponent: () => import('./init/init.page').then(m => m.InitPage)
  },
    {
    path: 'select-location-modal',
    loadComponent: () => import('./select-location-modal/select-location-modal.page').then( m => m.SelectLocationModalPage)
  }
];
