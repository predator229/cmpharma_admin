// Angular import
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/controllers/services/auth.service';

// third party import
import { SharedModule } from 'src/app/views/theme/shared/shared.module';

@Component({
  selector: 'app-nav-right',
  standalone: true,
  imports: [RouterModule, SharedModule],
  templateUrl: './nav-right.component.html',
  styleUrls: ['./nav-right.component.scss']
})
export class NavRightComponent {
  constructor(private authService: AuthService, private router: Router) {}
  userDetails = this.authService.getUserDetails();

  logout() {
    this.authService.logout();
  }
}
