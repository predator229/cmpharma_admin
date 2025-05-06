import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot
  ): Observable<boolean | UrlTree> {
    return this.authService.userDetailsLoaded$.pipe(
      filter(loaded => loaded),
      take(1),
      map(() => {
        const expectedRoles = route.data['roles'] as string[];
        const userDetails = this.authService.getUserDetails();

        if (userDetails && expectedRoles.includes(userDetails.role)) {
          return true;
        } else {
          return this.router.createUrlTree(['/login']);
        }
      })
    );
  }
}
