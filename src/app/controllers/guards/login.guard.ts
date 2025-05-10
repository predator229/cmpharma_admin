import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.userDetailsLoaded$.pipe(
      filter(loaded => loaded), // Attend que l’auth soit stabilisée
      take(1),
      map(() => {
        const user = this.authService.getCurrentUser();
        return user ? this.router.createUrlTree(['admin/dashboard/overview']) : true;
      })
    );
  }
}
