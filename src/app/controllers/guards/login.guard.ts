import {DestroyRef, Injectable} from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import {Observable} from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Group, GroupCode } from "../../models/Group.class";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router,
    private destroyRef: DestroyRef
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.authState$.pipe(
      takeUntilDestroyed(this.destroyRef),
      map((state) => {
        if (['unauthenticated','loading'].includes(state)) {
          return true;
        }

        console.log('je rentre ici')
        const userDetails = this.authService.getUserDetails();
        const redirectUrl = this.getRedirectionForUser(userDetails);
        return redirectUrl !== true ? redirectUrl : this.router.createUrlTree(['/dashboard']);
      })
    );
  }

  private getRedirectionForUser(userDetails: any): boolean | UrlTree {
    const roleRedirectMap: Record<string, string> = {
      [GroupCode.MANAGER_PHARMACY]: userDetails.onlyShowListPharm.length ? 'pharmacy/settings' : 'pharmacy/dashboard',
      [GroupCode.PHARMACIEN]: userDetails.onlyShowListPharm.length ? 'pharmacy/settings' : 'pharmacy/dashboard',
      [GroupCode.PREPARATEUR]: userDetails.onlyShowListPharm.length ? 'pharmacy/settings' : 'pharmacy/dashboard',
      [GroupCode.CAISSIER]: userDetails.onlyShowListPharm.length ? 'pharmacy/settings' : 'pharmacy/dashboard',
      [GroupCode.CONSULTANT]: userDetails.onlyShowListPharm.length ? 'pharmacy/settings' : 'pharmacy/dashboard',
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
      return this.router.createUrlTree([redirectPath]);
    }

    return true;
  }
}
