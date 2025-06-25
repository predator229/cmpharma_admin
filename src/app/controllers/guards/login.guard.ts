import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of, combineLatest } from 'rxjs';
import { map, take, timeout, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Group, GroupCode } from "../../models/Group.class";

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return combineLatest([
      this.authService.userDetailsLoaded$,
      this.authService.userDetails$
    ]).pipe(
      timeout(5000),
      take(1),
      map(([loaded, userDetails]) => {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser || !loaded || !userDetails || !Array.isArray(userDetails.groups)) { return true; }
        return this.getRedirectionForUser(userDetails);
      }),
      catchError((error) => {
        console.warn('Timeout ou erreur dans le LoginGuard:', error);
        return of(true);
      })
    );
  }

  private getRedirectionForUser(userDetails: any): boolean | UrlTree {
    const roleRedirectMap: Record<string, string> = {
      [GroupCode.PHARMACIST_OWNER]: userDetails.onlyShowListPharm ? 'pharmacy/pharmacies/list' : 'pharmacy/dashboard/',
      [GroupCode.PHARMACIST_MANAGER]: userDetails.onlyShowListPharm ? 'pharmacy/pharmacies/list' : 'pharmacy/dashboard/',
      [GroupCode.SUPERADMIN]: 'admin/dashboard/overview',
      [GroupCode.MANAGER]: 'admin/dashboard/overview',
      [GroupCode.ADMIN]: 'admin/dashboard/overview',
    };

    const matchingGroup = userDetails.groups.find((g: Group) =>
      g?.code && roleRedirectMap[g.code]
    );

    if (matchingGroup) {
      const redirectPath = roleRedirectMap[matchingGroup.code];
      return this.router.createUrlTree([redirectPath]);
    }

    return true;
  }
}
