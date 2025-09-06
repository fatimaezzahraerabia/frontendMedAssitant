// // main.ts
// import { bootstrapApplication } from '@angular/platform-browser';
// import { App } from './app/app';
// import { provideRouter } from '@angular/router';
// import { routes } from './app/app-routing-module';
// import { provideHttpClient, withFetch } from '@angular/common/http';
// import { importProvidersFrom } from '@angular/core';
// import { ReactiveFormsModule } from '@angular/forms';

// bootstrapApplication(App, {
//   providers: [
//     provideRouter(routes),              // Fournit le router
//     provideHttpClient(withFetch()),     // ✅ Active fetch pour HttpClient
//     importProvidersFrom(ReactiveFormsModule) // Si tu veux utiliser ReactiveForms globalement
//   ]
// })
// .catch(err => console.error(err));

import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app'; // ton composant racine
import { appConfig } from './app/app.config';

bootstrapApplication(App, appConfig)
  .catch(err => console.error(err));
