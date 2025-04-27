import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from 'src/app/controllers/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
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

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    if (this.email && this.password) {
      this.authService.loginWithEmail(this.email, this.password)
        .then(() => {
          this.router.navigate(['/dashboard']);
        })
        .catch((error) => {
          this.errorMessage = 'Erreur d\'authentification, veuillez vérifier vos informations.';
          console.error('Erreur de connexion', error);
        });
    } else {
      this.errorMessage = 'Veuillez remplir tous les champs.';
    }
  }

  loginWithGoogle() {
    this.authService.loginWithGoogle()
      .catch((error) => {
        this.errorMessage = 'Erreur lors de la connexion avec Google.';
        console.error('Erreur de connexion avec Google', error);
      });
  }
}
