// Angular import
import { CommonModule } from '@angular/common';
import {Component, Input, output} from '@angular/core';

// project import
import { setupsConfig } from 'src/app/app-config';

import { NavLeftComponent } from './nav-left/nav-left.component';
import { NavLogoComponent } from './nav-logo/nav-logo.component';
import { NavRightComponent } from './nav-right/nav-right.component';
import {UserDetails} from "../../../../../models/UserDatails";

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
  constructor() {
    this.windowWidth = window.innerWidth;
    this.navCollapsed = this.windowWidth >= 1025 ? setupsConfig.isCollapse_menu : false;
    this.navCollapsedMob = false;
  }

  // public method
  navCollapse() {
    if (this.windowWidth >= 1025) {
      this.navCollapsed = !this.navCollapsed;
      this.NavCollapse.emit();
    }
  }

  navCollapseMob() {
    if (this.windowWidth < 1025) {
      this.NavCollapsedMob.emit();
    }
  }
}
