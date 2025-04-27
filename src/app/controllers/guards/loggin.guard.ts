import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class LoggedInGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
    if (userDetails) {
      if (userDetails.role === 'admin' || userDetails.role === 'manager') {
        this.router.navigate(['/admin/dashboard']);
      } else if (userDetails.role === 'pharmacist-owner' || userDetails.role === 'pharmacits-manager') {
        this.router.navigate(['/pharmacy/dashboard']);
      }
      return false;
    }

    return true;
  }
}
