import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { routes } from './app-routing-module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideClientHydration(withEventReplay()),
    importProvidersFrom(ReactiveFormsModule),// Si tu veux utiliser ReactiveForms globalement
    provideRouter(routes),
    provideHttpClient(withFetch())   // ✅ Active l’utilisation de fetch

  ]
};
