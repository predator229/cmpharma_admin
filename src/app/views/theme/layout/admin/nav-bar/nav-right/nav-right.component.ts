// Angular import
import {Component, Renderer2} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/controllers/services/auth.service';
import { LoadingService } from 'src/app/controllers/services/loading.service';
import { SharedModule } from 'src/app/views/theme/shared/shared.module';
import {UserDetails} from "../../../../../../models/UserDatails";

@Component({
  selector: 'app-nav-right',
  standalone: true,
  imports: [RouterModule, SharedModule],
  templateUrl: './nav-right.component.html',
  styleUrls: ['./nav-right.component.scss']
})
export class NavRightComponent {
  setFontFamily!: string; // fontFamily
  userDetails!: UserDetails;
  isLoading = false;

  constructor(private renderer: Renderer2, private authService: AuthService, private router: Router, private loadingService: LoadingService) {
    this.loadingService.isLoading$.subscribe((loading) => {
      this.isLoading = loading;
    });
  }

  ngOnInit(): void {
    this.userDetails = this.authService.getUserDetails();
    if (this.userDetails) {
      this.fontFamily(this.userDetails?.setups?.font_family ?? this.setFontFamily);
    }
  }
  logout() {
    this.authService.logout();
  }
  fontFamily(font: string, sendToServer: boolean = false) {
    this.setFontFamily = font;
    this.renderer.removeClass(document.body, 'Roboto');
    this.renderer.removeClass(document.body, 'Poppins');
    this.renderer.removeClass(document.body, 'Inter');
    this.renderer.addClass(document.body, font);
    if (sendToServer){
      this.loadingService.setLoading(true);
      this.authService.editSettingsUser(font).
      then(
        () => {
          this.userDetails = this.authService.getUserDetails();
          this.loadingService.setLoading(false);
        }
      )
      .catch(() => {
        this.loadingService.setLoading(false);
      });
    }
  }
}
