// Angular import
import { CommonModule } from '@angular/common';
import {Component, Input, output} from '@angular/core';

// project import
import { setupsConfig } from 'src/app/app-config';

import { NavLeftComponent } from './nav-left/nav-left.component';
import { NavLogoComponent } from './nav-logo/nav-logo.component';
import { NavRightComponent } from './nav-right/nav-right.component';
import {UserDetails} from "../../../../../models/UserDatails";
import {AuthService} from "../../../../../controllers/services/auth.service";
import {Subject, takeUntil} from "rxjs";

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [NavLogoComponent, NavLeftComponent, NavRightComponent, CommonModule],
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent {
  // public props
  NavCollapse = output();
  NavCollapsedMob = output();
  navCollapsed: boolean;
  windowWidth: number;
  navCollapsedMob: boolean;
  @Input() url!: String;
  @Input() userDetails!: UserDetails;

  // Constructor
  constructor(
    private auth: AuthService,
  ) {
    this.windowWidth = window.innerWidth;
    this.navCollapsedMob = false;
  }

  private destroy$ = new Subject<void>();
  ngOnInit(): void {
    if (!this.userDetails) {
      this.auth.userDetailsLoaded$
        .pipe(takeUntil(this.destroy$))
        .subscribe(async loaded => {
          this.userDetails = this.auth.getUserDetails();
        });
    }
    this.navCollapsed = this.userDetails.setups.isCollapse_menu ?? (this.windowWidth >= 1025 ? setupsConfig.isCollapse_menu : false);
  }
  // public method
  navCollapse() {
    if (this.windowWidth >= 1025) {
      this.navCollapsed = !this.navCollapsed;
      this.NavCollapse.emit();
      this.setOpenedOrNot();
    }
  }

  navCollapseMob() {
    if (this.windowWidth < 1025) {
      this.NavCollapsedMob.emit();
    }
  }
  setOpenedOrNot() {
    this.auth.editOpenedDefaultSettingsUser(this.navCollapsed)
      .then(() => {
        this.userDetails = this.auth.getUserDetails();
      })
      .catch(() => {
      });
  }
}
