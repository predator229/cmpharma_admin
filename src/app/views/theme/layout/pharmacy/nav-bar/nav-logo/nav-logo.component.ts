// Angular import
import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {UserDetails} from "../../../../../../models/UserDatails";
import {Subject, takeUntil} from "rxjs";
import {AuthService} from "../../../../../../controllers/services/auth.service";
import {ApiService} from "../../../../../../controllers/services/api.service";
import {LoadingService} from "../../../../../../controllers/services/loading.service";

@Component({
  selector: 'app-nav-logo',
  imports: [CommonModule, RouterModule],
  templateUrl: './nav-logo.component.html',
  styleUrls: ['./nav-logo.component.scss']
})
export class NavLogoComponent {
  // public props
  @Input() navCollapsed: boolean;
  @Input() url!: String;
  @Input() userDetails!: UserDetails;
  @Output() NavCollapse = new EventEmitter();
  windowWidth = window.innerWidth;
  // public import
  navCollapse() {
    if (this.windowWidth >= 1025) {
      this.navCollapsed = !this.navCollapsed;
      this.NavCollapse.emit();
    }
  }
}
