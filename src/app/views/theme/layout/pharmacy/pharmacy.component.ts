// Angular imports
import { AfterViewInit, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule, Location, LocationStrategy } from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

// Project imports
import { setupsConfig } from 'src/app/app-config';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { NavigationComponent } from './navigation/navigation.component';
import { BreadcrumbComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { FormsModule } from "@angular/forms";
import { AuthService } from "../../../../controllers/services/auth.service";
import { SharedModule } from "../../shared/shared.module";
import {UserDetails} from "../../../../models/UserDatails";
import {filter, map, take} from "rxjs/operators";
import {LoadingService} from "../../../../controllers/services/loading.service";
import {Group} from "../../../../models/Group.class";
import {CommonFunctions} from "../../../../controllers/comonsfunctions";

@Component({
  selector: 'app-pharmacy',
  standalone: true,
  imports: [
    SharedModule,
    CommonModule,
    NavigationComponent,
    NavBarComponent,
    RouterModule,
    BreadcrumbComponent,
    FormsModule
  ],
  templateUrl: './pharmacy.component.html',
  styleUrls: ['./pharmacy.component.scss']
})
export class PharmacyComponent implements AfterViewInit {
  private location = inject(Location);
  private locationStrategy = inject(LocationStrategy);
  private modalService: NgbModal;
  private authUser: AuthService;
  public userDetails: UserDetails | null = null;
  public modalError: string | null = null;
  private router: Router;
  public displayName: boolean;
  public displaySurname: boolean;
  public urlDashboard: String = "";

  public imLoading: boolean = false;

  // @ViewChild to access the modal in the template
  @ViewChild('userInfoModal') userInfoModal: ElementRef | undefined;

  constructor(modalService: NgbModal, authUser: AuthService, private loadingService: LoadingService) {
    this.loadingService.isLoading$.subscribe((loading) => {
      this.imLoading = loading;
    });

    this.modalService = modalService;
    this.authUser = authUser;

    this.authUser.userDetailsLoaded$.pipe(
      filter(loaded => loaded),
      take(1),
      map(() => {
        this.userDetails = this.authUser.getUserDetails();
        if (!this.userDetails) {
          this.router.navigate(['/login']);
          return false;
        }
        if (!Array.isArray(this.userDetails.groups) || this.userDetails.groups.length === 0) {
          return false;
        }
        const group = this.userDetails.groups.find((g: Group) => CommonFunctions.getRoleRedirectMap(g) !== null);
        this.urlDashboard = group ? CommonFunctions.getRoleRedirectMap(group) : null;
        return true;
      })
    ).subscribe();
  }
  cdr = inject(ChangeDetectorRef);

  currentLayout!: string;
  navCollapsed = true;
  navCollapsedMob = false;
  windowWidth!: number;

  ngAfterViewInit() {
    let current_url = this.location.path();
    const baseHref = this.locationStrategy.getBaseHref();
    if (baseHref) {
      current_url = baseHref + this.location.path();
    }

    if (current_url === baseHref + '/layout/theme-compact' || current_url === baseHref + '/layout/box') {
      setupsConfig.isCollapse_menu = true;
    }

    this.windowWidth = window.innerWidth;
    this.navCollapsed = this.windowWidth >= 1025 ? setupsConfig.isCollapse_menu : false;
    this.cdr.detectChanges(); // Ensure change detection is triggered

    if (!this.userDetails) {
      this.router.navigate(['/login']);
      return;
    }

    const { name, surname } = this.userDetails;
    this.displayName = name?.trim() === '';
    this.displaySurname = surname?.trim() === '';

    if (name?.trim() === '' || surname?.trim() === '') {
      setTimeout(() => {
        this.modalService.open(this.userInfoModal, {
          backdrop: 'static',
          keyboard: false,
          centered: true
        });
      }, 0);
    }
  }

  private isThemeLayout(layout: string) {
    this.currentLayout = layout;
  }

  navMobClick() {
    if (this.navCollapsedMob && !document.querySelector('app-navigation.coded-navbar')?.classList.contains('mob-open')) {
      this.navCollapsedMob = !this.navCollapsedMob;
      setTimeout(() => {
        this.navCollapsedMob = !this.navCollapsedMob;
      }, 100);
    } else {
      this.navCollapsedMob = !this.navCollapsedMob;
    }

    if (document.querySelector('app-navigation.pc-sidebar')?.classList.contains('navbar-collapsed')) {
      document.querySelector('app-navigation.pc-sidebar')?.classList.remove('navbar-collapsed');
    }
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeMenu();
    }
  }

  // Method to close the menu if it's open
  closeMenu() {
    if (document.querySelector('app-navigation.pc-sidebar')?.classList.contains('mob-open')) {
      document.querySelector('app-navigation.pc-sidebar')?.classList.remove('mob-open');
    }
  }

  editProfile() {
    if (!this.userDetails) {
      console.warn('Aucune information utilisateur disponible.');
      this.router.navigate(['/login']);
      return;
    }
    // this.imLoading = true;
    this.loadingService.setLoading(true);
    const { name, surname } = this.userDetails;

    if (name?.trim() && surname?.trim()) {
      this.modalError = null;
      this.authUser.editprofilInfos(name, surname).
      then(
        () => {
          this.userDetails = this.authUser.getUserDetails();
          this.loadingService.setLoading(false);
          this.modalService.dismissAll('ok');
        }
      )
      .catch(() => {
        this.loadingService.setLoading(false);
        this.modalError = 'Erreur lors de la modification des informations.';
      });
    } else {
      this.loadingService.setLoading(false);
      this.modalError = 'Veuillez remplir tous les champs.';
    }
  }

}
