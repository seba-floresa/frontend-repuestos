import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID, DEFAULT_CURRENCY_CODE } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsCl from '@angular/common/locales/es-CL';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// IMPORTAMOS EL MOTOR HTTP
import { provideHttpClient } from '@angular/common/http'; 

registerLocaleData(localeEsCl);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    // LO ACTIVAMOS AQUÍ
    provideHttpClient(),
    // Precios como $5.000: CLP no tiene decimales en el locale es-CL
    { provide: LOCALE_ID, useValue: 'es-CL' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'CLP' }
  ]
};