import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

//Para PrimeNG
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import 'primeicons/primeicons.css';

//Temas PrimeNG
import Aura from '@primeng/themes/aura';
//import Material from '@primeng/themes/material';
//import Lara from '@primeng/themes/lara';
//import Nora from '@primeng/themes/nora';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

import { provideHttpClient } from '@angular/common/http';

import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

registerLocaleData(localeEs, 'es');
bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(),
    provideAnimationsAsync(), //Para PrimeNG
    providePrimeNG({//Para PrimeNG
      theme: {
        preset: Aura
      }
    }),{ provide: LOCALE_ID, useValue: 'es' } 
  ],
});
