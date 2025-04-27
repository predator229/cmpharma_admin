import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    // state: RouterStateSnapshot
  ): boolean | UrlTree {
    const expectedRoles: string[] = route.data['roles'];
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
    if (user && userDetails && expectedRoles.includes(userDetails.role)) {
      return true;
    }
    return this.router.createUrlTree(['/login']);
  }
}
