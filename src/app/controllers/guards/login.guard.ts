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
      filter(loaded => loaded),
      take(1),
      map(() => {
        const user = this.authService.getCurrentUser();
        const userDetails = this.authService.getUserDetails();
        if (!user || !userDetails) { return true; }

        const roleRedirectMap: Record<string, string> = {
          admin: 'admin/dashboard/overview',
          manager: 'admin/dashboard/overview',
          superadmin: 'admin/dashboard/overview',
          'pharmacist-owner': 'pharmacy/dashboard/',
          'pharmacist-manager': 'pharmacy/dashboard/',
        };
        const redirectPath = roleRedirectMap[userDetails.role];

        return redirectPath
          ? this.router.createUrlTree([redirectPath])
          : true;
      })
    );
  }
}
