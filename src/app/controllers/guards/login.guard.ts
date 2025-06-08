import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import {Group, GroupCode} from "../../models/Group.class";

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

        if (!user || !userDetails || !Array.isArray(userDetails.groups)) {
          return true;
        }

        const roleRedirectMap: Record<string, string> = {
          [GroupCode.PHARMACIST_OWNER]: 'pharmacy/dashboard/',
          [GroupCode.PHARMACIST_MANAGER]: 'pharmacy/dashboard/',
          [GroupCode.SUPERADMIN]: 'admin/dashboard/overview',
          [GroupCode.MANAGER]: 'admin/dashboard/overview',
          [GroupCode.ADMIN]: 'admin/dashboard/overview',
        };
        const matchingGroup = userDetails.groups.find((g: Group) =>
          g?.code && roleRedirectMap[g.code]
        );
        const redirectPath = matchingGroup ? roleRedirectMap[matchingGroup.code] : null;
        return redirectPath
          ? this.router.createUrlTree([redirectPath])
          : true;
      })
    );
  }
}
