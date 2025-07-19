import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Auth
import { AuthModule } from './views/notauthentifiedusers/login/login.module';

// Gardiens de route
import { AuthGuard } from './controllers/guards/auth.guard';
import { GroupGuard } from './controllers/guards/group.guard';
import { LoginGuard } from './controllers/guards/login.guard';
import {SharedModule} from "./views/theme/shared/shared.module";
import {RouterModule} from "@angular/router";

@NgModule({
  imports: [
    SharedModule,
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    AuthModule,
    BrowserAnimationsModule,
    RouterModule,
  ],
  providers: [
    AuthGuard,
    GroupGuard,
    LoginGuard
  ],
  // bootstrap: [AppComponent],
  // declarations: [AppComponent],
})
export class AppModule { }
