import {Component, Input, OnInit, inject, Renderer2} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import { NavigationItem } from '../../navigation';
import { NavItemComponent } from '../nav-item/nav-item.component';
import {UserDetails} from "../../../../../../../models/UserDatails";
import {AuthService} from "../../../../../../../controllers/services/auth.service";
import {LoadingService} from "../../../../../../../controllers/services/loading.service";

@Component({
  selector: 'app-nav-collapse',
  standalone: true,
  imports: [CommonModule, RouterModule, NavItemComponent],
  templateUrl: './nav-collapse.component.html',
  styleUrl: './nav-collapse.component.scss'
})
export class NavCollapseComponent implements OnInit {
  private location = inject(Location);

  @Input() item!: NavigationItem;
  @Input() userDetails!: UserDetails;
  isLoading: boolean = false;
  windowWidth = window.innerWidth;
  current_url = '';

  constructor(private renderer: Renderer2, private authService: AuthService, private router: Router, private loadingService: LoadingService) {
    this.loadingService.isLoading$.subscribe((loading) => {
      this.isLoading = loading;
    });
  }
  ngOnInit() {
    this.userDetails = this.userDetails ? this.userDetails : this.authService.getUserDetails();
    this.current_url = this.location.path();

    const baseHref = this.location['_baseHref'] || '';
    this.current_url = baseHref + this.current_url;
    // this.item.title += ' - ' + this.item.icon;

    setTimeout(() => {
      const links = document.querySelectorAll('a.nav-link') as NodeListOf<HTMLAnchorElement>;
      links.forEach((link: HTMLAnchorElement) => {
        if (link.getAttribute('href') === this.current_url) {
          let parent = link.parentElement;
          while (parent && parent.classList) {
            if (parent.classList.contains('coded-hasmenu')) {
              parent.classList.add('coded-trigger');
              parent.classList.add('active');
            }
            parent = parent.parentElement;
          }
        }
      });
    }, 0);
  }

  // Method to handle the collapse of the navigation menu
  navCollapse(e: MouseEvent) {
    let parent = e.target as HTMLElement;

    if (parent?.tagName === 'SPAN') {
      parent = parent.parentElement!;
    }

    parent = (parent as HTMLElement).parentElement!;

    const sections = document.querySelectorAll('.coded-hasmenu');
    for (const section of Array.from(sections)) {
      if (section !== parent) {
        section.classList.remove('coded-trigger');
      }
    }

    let first_parent = parent.parentElement!;
    let pre_parent = ((parent as HTMLElement).parentElement as HTMLElement).parentElement!;
    if (first_parent.classList.contains('coded-hasmenu')) {
      do {
        first_parent.classList.add('coded-trigger');
        first_parent = (first_parent.parentElement as HTMLElement).parentElement!;
      } while (first_parent.classList.contains('coded-hasmenu'));
    } else if (pre_parent.classList.contains('coded-submenu')) {
      do {
        pre_parent.parentElement?.classList.add('coded-trigger');
        pre_parent = (((pre_parent as HTMLElement).parentElement as HTMLElement).parentElement as HTMLElement).parentElement!;
      } while (pre_parent.classList.contains('coded-submenu'));
    }
    parent.classList.toggle('coded-trigger');
  }
}
