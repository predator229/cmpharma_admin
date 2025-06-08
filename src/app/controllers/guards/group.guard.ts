import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import {group} from "@angular/animations";
import {Group} from "../../models/Group.class";

@Injectable({
  providedIn: 'root'
})
export class GroupGuard implements CanActivate {
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

        if (userDetails && userDetails.groups && userDetails.groups.some((group: Group) => expectedRoles.includes(group.code))) {
          return true;
        } else {
          this.authService.logout();
          return this.router.createUrlTree(['/login']);
        }
      })
    );
  }
}
