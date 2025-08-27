import {enableProdMode, importProvidersFrom, LOCALE_ID} from '@angular/core';

import { environment } from './environments/environment';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { AppRoutingModule } from './app/app-routing.module';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

// Enregistrement de la locale FR
registerLocaleData(localeFr, 'fr');

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: LOCALE_ID, useValue: 'fr' },
    importProvidersFrom(BrowserModule, AppRoutingModule),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi())]
}).catch((err) => console.error(err));

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
// import { bootstrapApplication } from '@angular/platform-browser';
// import { AppComponent } from './app/app.component';  // Import AppComponent
//
// bootstrapApplication(AppComponent).catch(err => console.error(err));
