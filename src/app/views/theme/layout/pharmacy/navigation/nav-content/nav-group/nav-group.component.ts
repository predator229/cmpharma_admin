import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationItem } from '../../navigation';

import { NavCollapseComponent } from '../nav-collapse/nav-collapse.component';
import { NavItemComponent } from '../nav-item/nav-item.component';
import {UserDetails} from "../../../../../../../models/UserDatails";
import {AuthService} from "../../../../../../../controllers/services/auth.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-nav-group',
  standalone: true,
  imports: [CommonModule, NavCollapseComponent, NavItemComponent],
  templateUrl: './nav-group.component.html',
  styleUrl: './nav-group.component.scss'
})
export class NavGroupComponent implements OnInit {
  private router = inject(Router);

  @Input() item!: NavigationItem;
  isLoading: boolean = false;
  @Input() public url!: String;
  @Input() userDetails!: UserDetails;
  private authService: AuthService;

  logout() {
    this.authService.logout();
  }

  ngOnInit() {
    this.item.classes = this.isActiveGroup() ? 'active' : '';
    this.userDetails = this.userDetails ? this.userDetails : this.authService.getUserDetails();
  }

  isActiveGroup() {
    return this.item.children?.some((child) => {
      return child.url === this.router.url
    });
  }
}
