// Angular import
import {Component, Output, EventEmitter, input, Input} from '@angular/core';
import {UserDetails} from "../../../../../../models/UserDatails";

@Component({
  selector: 'app-nav-left',
  templateUrl: './nav-left.component.html',
  styleUrls: ['./nav-left.component.scss']
})
export class NavLeftComponent {
  // public props
  @Input() userDetails!: UserDetails;
  @Output() NavCollapsedMob = new EventEmitter();
}
