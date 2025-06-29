import { CommonModule } from '@angular/common';
import {Component, Input, output, Renderer2} from '@angular/core';
import {Router, RouterModule} from '@angular/router';

import { NavContentComponent } from './nav-content/nav-content.component';
import {UserDetails} from "../../../../../models/UserDatails";
import {AuthService} from "../../../../../controllers/services/auth.service";
import {LoadingService} from "../../../../../controllers/services/loading.service";

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [NavContentComponent, CommonModule, RouterModule],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss'
})
export class NavigationComponent {
  NavCollapsedMob = output();
  SubmenuCollapse = output();
  navCollapsedMob = false;
  windowWidth = window.innerWidth;
  themeMode!: string;
  isLoading: boolean = false;
  @Input() public url!: String;
  @Input() userDetails!: UserDetails;

  constructor(private renderer: Renderer2, private authService: AuthService, private router: Router, private loadingService: LoadingService) {
    this.loadingService.isLoading$.subscribe((loading) => {
      this.isLoading = loading;
    });
  }

  ngOnInit(): void {
    this.userDetails = this.userDetails ? this.userDetails : this.authService.getUserDetails();
  }
  logout() {
    this.authService.logout();
  }
  // public method
  navCollapseMob() {
    if (this.windowWidth < 1025) {
      this.NavCollapsedMob.emit();
    }
  }

  navSubmenuCollapse() {
    document.querySelector('app-navigation.coded-navbar')?.classList.add('coded-trigger');
  }
}
