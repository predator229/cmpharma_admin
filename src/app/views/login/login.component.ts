import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from 'src/app/controllers/services/auth.service';
import { filter, take, map } from 'rxjs';

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
          this.authService.userDetailsLoaded$.pipe(
            filter(loaded => loaded),
            take(1),
            map(() => {
              const user = this.authService.getCurrentUser();
              if (!user) { this.errorMessage = 'Erreur d\'authentification avec google, veuillez reassayer !.'; }
              return user ? this.router.createUrlTree(['/admin/dashboard/']) : false;
            })
          )
        })
        .catch(() => {
          this.errorMessage = 'Erreur d\'authentification, veuillez vérifier vos informations.';
        });
    } else {
      this.errorMessage = 'Veuillez remplir tous les champs.';
    }
  }

  loginWithGoogle() {
    this.authService.loginWithGoogle()
    .then(() => {
      this.authService.userDetailsLoaded$.pipe(
        filter(loaded => loaded),
        take(1),
        map(() => {
          const user = this.authService.getCurrentUser();
          if (!user) { this.errorMessage = 'Erreur d\'authentification avec google, veuillez reassayer !.'; }
          return user ? this.router.createUrlTree(['/admin/dashboard/']) : false;
        })
      )
    })
    .catch(() => {
        this.errorMessage = 'Erreur lors de la connexion avec Google.';
      });
  }
}
