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
    path: 'shifts',
    loadComponent: () => import('./integrations/fusion/modules/shifts/shifts.page').then( m => m.ShiftsPage)
  },
  {
    path: 'resources',
    loadComponent: () => import('./integrations/fusion/modules/resources/resources.page').then( m => m.ResourcesPage)
  },
  {
    path: 'items',
    loadComponent: () => import('./integrations/fusion/modules/items/items.page').then( m => m.ItemsPage)
  },
  {
    path: 'wo',
    loadComponent: () => import('./integrations/fusion/modules/wo/wo.page').then( m => m.WoPage)
  },
];
