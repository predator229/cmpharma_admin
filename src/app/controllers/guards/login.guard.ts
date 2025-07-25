import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of, combineLatest } from 'rxjs';
import { map, take, timeout, catchError, filter } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Group, GroupCode } from "../../models/Group.class";

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      return of(true);
    }

    return combineLatest([
      this.authService.userDetailsLoaded$,
      this.authService.userDetails$
    ]).pipe(
      filter(([loaded, userDetails]) => loaded && !!userDetails),
      timeout(10000), // Augmenter le timeout
      take(1),
      map(([loaded, userDetails]) => {
        if (loaded && userDetails && Array.isArray(userDetails.groups)) {
          const redirectUrl = this.getRedirectionForUser(userDetails);
          if (redirectUrl !== true) {
            return redirectUrl;
          }
        }

        return this.router.createUrlTree(['/dashboard']);
      }),
      catchError((error) => {
        return of(this.router.createUrlTree(['/dashboard']));
      })
    );
  }

  private getRedirectionForUser(userDetails: any): boolean | UrlTree {
    const roleRedirectMap: Record<string, string> = {
      [GroupCode.MANAGER_PHARMACY]: userDetails.onlyShowListPharm.length ? 'pharmacy/pharmacies/list' : 'pharmacy/dashboard',
      [GroupCode.PHARMACIEN]: userDetails.onlyShowListPharm.length ? 'pharmacy/pharmacies/list' : 'pharmacy/dashboard',
      [GroupCode.PREPARATEUR]: userDetails.onlyShowListPharm.length ? 'pharmacy/pharmacies/list' : 'pharmacy/dashboard',
      [GroupCode.CAISSIER]: userDetails.onlyShowListPharm.length ? 'pharmacy/pharmacies/list' : 'pharmacy/dashboard',
      [GroupCode.CONSULTANT]: userDetails.onlyShowListPharm.length ? 'pharmacy/pharmacies/list' : 'pharmacy/dashboard',
      [GroupCode.SUPERADMIN]: 'admin/dashboard/overview',
      [GroupCode.MANAGER_ADMIN]: 'admin/dashboard/overview',
      [GroupCode.ADMIN_TECHNIQUE]: 'admin/dashboard/overview',
      [GroupCode.SUPPORT_ADMIN]: 'admin/dashboard/overview',
    };

    const matchingGroup = userDetails.groups.find((g: Group) =>
      g?.code && roleRedirectMap[g.code]
    );

    if (matchingGroup) {
      const redirectPath = roleRedirectMap[matchingGroup.code];
      console.log(`Utilisateur avec rôle ${matchingGroup.code} redirigé vers: ${redirectPath}`);
      return this.router.createUrlTree([redirectPath]);
    }

    console.warn('Aucun rôle correspondant trouvé pour l\'utilisateur:', userDetails.groups);
    return true;
  }
}
