// Angular Imports
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// project import
import { CardComponent } from './components/card/card.component';

import { NgScrollbarModule } from 'ngx-scrollbar';

// bootstrap import
import { NgbDropdownModule, NgbNavModule, NgbModule, NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import {SpinnerComponent} from "./components/spinner/spinner.component";

@NgModule({

  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardComponent,
    NgbDropdownModule,
    NgbNavModule,
    NgbModule,
    NgbCollapseModule,
    NgScrollbarModule,
    SpinnerComponent
  ],
  exports: [
    SpinnerComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardComponent,
    NgbModule,
    NgbDropdownModule,
    NgbNavModule,
    NgbCollapseModule,
    NgScrollbarModule
  ],
  declarations: [
  ]
})
export class SharedModule {}
