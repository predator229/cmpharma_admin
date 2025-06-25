import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from 'src/app/controllers/services/auth.service';
import { filter, take, map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import {Group} from "../../models/Group.class";
import {CommonFunctions} from "../../controllers/comonsfunctions";
import {waitForAsync} from "@angular/core/testing";


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export default class LoginComponent {
  public email: string | null = '';
  public password: string | null = '';
  public errorMessage: string | null = '';
  public successMessage: string | null = '';
  public imLoading: boolean | null = false;
  public passwordFgt: boolean | null = false;

  constructor(private authService: AuthService, private router: Router) {}

  private showError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: message,
    });
    this.errorMessage = message;
    this.imLoading = false;
  }

  login() {
    if (!this.email || !this.password) {
      this.showError('Veuillez remplir tous les champs.');
      return;
    }

    this.imLoading = true;
    this.authService.loginWithEmail(this.email, this.password)
      .then(() => this.handleAuthSuccess())
      .catch(() => this.showError('Erreur d\'authentification, veuillez vérifier vos informations.'));
  }

  private handleAuthSuccess(): void {
    this.authService.userDetailsLoaded$.pipe(
      filter(loaded => loaded),
      take(1),
      map(() => {
        const user = this.authService.getCurrentUser();
        const userDetails = this.authService.getUserDetails();
        if (!user) {
          this.showError('L\'email n\'est associé à aucun compte.');
          this.imLoading = false;
          return false;
        }
        if (!userDetails || !Array.isArray(userDetails.groups) || userDetails.groups.length === 0) {
          this.imLoading = false;
          return false;
        }
        const group = userDetails.groups.find((g: Group) => CommonFunctions.getRoleRedirectMap(g, userDetails) !== null);
        const redirectUrl = group ? CommonFunctions.getRoleRedirectMap(group, userDetails) : null;
        this.imLoading = false;
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          window.location.href = '/login';
        }
        return true;
      })
    ).subscribe();
  }


  async loginWithGoogle() {
    this.imLoading = true;
    this.authService.loginWithGoogle()
      .then(() => this.handleAuthSuccess())
      .catch(() => this.showError('Erreur lors de la connexion avec Google.'));
  }

  sendResetLink() {
    if (!this.email) {
      this.showError('Veuillez fournir un email.');
      return;
    }

    this.imLoading = true;
    this.authService.sendResetPasswordEmail(this.email)
      .then(() => {
        this.successMessage = 'Si votre email est retrouvé dans notre système, un lien de réinitialisation vous sera envoyé.';
        this.errorMessage = '';
      })
      .catch(() => {
        this.successMessage = '';
        this.errorMessage = 'Erreur : adresse invalide ou utilisateur introuvable.';
      })
      .finally(() => {
        this.imLoading = false;
      });
  }
  clicPasswordFgt() {
    this.errorMessage = "";
    this.passwordFgt = !this.passwordFgt;
  }
}
