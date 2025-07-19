import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { confirmPasswordReset, getAuth } from 'firebase/auth';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-set-password',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './set-password.component.html',
  styleUrls: ['./set-password.component.scss']
})
export class SetPasswordComponent implements OnInit {
  oobCode: string = '';
  password: string = '';
  confirmPassword: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  loading: boolean = false;

  private auth = getAuth(); // utilise la même instance que dans AuthService

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.oobCode = this.route.snapshot.queryParamMap.get('oobCode') || '';
    if (!this.oobCode) {
      this.errorMessage = 'Le lien de réinitialisation est invalide ou expiré.';
    }
  }

  async submit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.password || this.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    try {
      this.loading = true;
      await confirmPasswordReset(this.auth, this.oobCode, this.password);
      this.successMessage = 'Mot de passe défini avec succès. Redirection en cours...';
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: this.successMessage,
        timer: 2500,
        showConfirmButton: false,
      });
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2500);
    } catch (error: any) {
      console.error(error);
      this.errorMessage = error?.message || 'Une erreur est survenue.';
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: this.errorMessage,
      });
    } finally {
      this.loading = false;
    }
  }
}
