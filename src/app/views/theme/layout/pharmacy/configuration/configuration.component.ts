import { CommonModule } from '@angular/common';
import { Component, OnInit, Renderer2 } from '@angular/core';
import {AuthService} from "../../../../../controllers/services/auth.service";

@Component({
  selector: 'app-configuration',
  imports: [CommonModule],
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss']
})
export class ConfigurationComponent implements OnInit {
  // public method
  styleSelectorToggle!: boolean;
  setFontFamily!: string; // fontFamily

  constructor(private renderer: Renderer2, private authService: AuthService) {}
  userDetails = this.authService.getUserDetails();

  ngOnInit(): void {
    this.fontFamily(this.userDetails?.setups?.font_family ?? this.setFontFamily);
  }

  fontFamily(font: string) {
    this.setFontFamily = font;
    this.renderer.removeClass(document.body, 'Roboto');
    this.renderer.removeClass(document.body, 'Poppins');
    this.renderer.removeClass(document.body, 'Inter');
    this.renderer.addClass(document.body, font);
  }
}
