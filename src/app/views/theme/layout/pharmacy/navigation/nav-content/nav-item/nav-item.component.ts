import {Component, inject, Input, OnChanges, OnInit, Renderer2} from '@angular/core';
import { CommonModule } from '@angular/common';
import {Router, RouterModule} from '@angular/router';

import { NavigationItem } from '../../navigation';
import {UserDetails} from "../../../../../../../models/UserDatails";
import {AuthService} from "../../../../../../../controllers/services/auth.service";
import {LoadingService} from "../../../../../../../controllers/services/loading.service";

@Component({
  selector: 'app-nav-item',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nav-item.component.html',
  styleUrl: './nav-item.component.scss'
})
export class NavItemComponent implements OnInit {
  private router = inject(Router)
  @Input() item!: NavigationItem;
  @Input() userDetails!: UserDetails;
  isLoading = false;

  constructor(private renderer: Renderer2, private authService: AuthService, private loadingService: LoadingService) {
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
  closeOtherMenu(event: MouseEvent) {
    const ele = event.target as HTMLElement;
    if (ele !== null && ele !== undefined) {
      const parent = ele.parentElement as HTMLElement;
      const up_parent = ((parent.parentElement as HTMLElement).parentElement as HTMLElement).parentElement as HTMLElement;
      const last_parent = (up_parent.parentElement as HTMLElement).parentElement as HTMLElement;
      if (last_parent.classList.contains('coded-submenu')) {
        up_parent.classList.remove('coded-trigger');
        up_parent.classList.remove('active');
      } else {
        const sections = document.querySelectorAll('.coded-hasmenu');

        for (const section of Array.from(sections)) {
          section.classList.remove('active');
          section.classList.remove('coded-trigger');
        }
      }

      if (parent.classList.contains('coded-hasmenu')) {
        parent.classList.add('coded-trigger');
        parent.classList.add('active');
      } else if (up_parent.classList.contains('coded-hasmenu')) {
        up_parent.classList.add('coded-trigger');
        up_parent.classList.add('active');
      } else if (last_parent.classList.contains('coded-hasmenu')) {
        last_parent.classList.add('coded-trigger');
        last_parent.classList.add('active');
      }
    }

    if ((document.querySelector('app-navigation.coded-navbar') as HTMLDivElement).classList.contains('mob-open')) {
      (document.querySelector('app-navigation.coded-navbar') as HTMLDivElement).classList.remove('mob-open');
    }
  }

  isCurrentItem(): boolean {
    if (!this.item?.url) return false;

    const currentUrl = this.router.url.split(/[?#]/)[0].replace(/\/$/, '');
    const itemUrl = this.item.url.replace(/\/$/, '');

    const baseUrl = itemUrl.replace(/\/list$/, '');

    const regexString =
      '^' +
      baseUrl.replace(/:\w+/g, '[^/]+') +
      '(?:/[^/]+)*$';

    const regex = new RegExp(regexString);

    return regex.test(currentUrl);
  }
}
