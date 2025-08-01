import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.userDetailsLoaded$.pipe(
      filter(loaded => loaded), // Attend que les détails utilisateur soient chargés
      take(1),
      map(() => {
        const user = this.authService.getCurrentUser();
        return user ? true : this.router.createUrlTree(['/login']);
      })
    );
  }
}
