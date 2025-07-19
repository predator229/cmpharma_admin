import {Component, OnInit, ViewChild, ElementRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/views/theme/shared/shared.module';
import { Chart, registerables } from 'chart.js';
import {AuthService} from "../../../../../controllers/services/auth.service";
import {LoadingService} from "../../../../../controllers/services/loading.service";
import {HttpHeaders} from "@angular/common/http";
import {Subject, takeUntil} from "rxjs";
import Swal from "sweetalert2";
import {ApiService} from "../../../../../controllers/services/api.service";
import {ActivityTimelineComponent} from "../../../sharedComponents/activity-timeline/activity-timeline.component";
import {ActivityLoged} from "../../../../../models/Activity.class";

@Component({
  selector: 'app-admin-dashboard-activities',
  standalone: true,
  imports: [CommonModule, SharedModule, ActivityTimelineComponent],
  templateUrl: './recentactivities.component.html',
  styleUrls: ['./recentactivities.component.scss'],
})

export class RecentactivitiesComponent implements OnInit {
  prePage: string = '50';
  pharmacyActivities: ActivityLoged[] = [];
  usersInfo: { [key: string]:{  name: string;  img: string;  } } | null = null;

  constructor(private authUser: AuthService, private loadingService: LoadingService, private apiService: ApiService)  {
  }
  userDetails = this.authUser.getUserDetails();

  ngOnInit(): void {
    this.loadPharmacyActivities();
  }
  private destroy$ = new Subject<void>();
  async loadPharmacyActivities(): Promise<void> {
    const token = await this.authUser.getRealToken();
    const uid = await this.authUser.getUid();
    const prePage = parseInt(this.prePage);
    if (!token) {
      this.handleError('Vous n\'êtes pas autorisé à effectuer cette action');
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });

    this.apiService.post('managers/pharmacies/activities', { uid, prePage }, headers)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response && !response.error && response.data){
            this.pharmacyActivities = response?.data || [];
            this.usersInfo = response?.usersMap || [];
          }else{
            this.handleError( response.message ?? (response.errorMessage ?? `Erreur lors du chargement des logs d'activites`));
          }
        },
        error: (error) => {
          this.pharmacyActivities = [];
          this.handleError(`Erreur lors du chargement des logs d'activites`);
        }
      });
  }

  private handleError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: message
    });
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'order':
        return 'fas fa-shopping-cart';
      case 'pharmacy':
        return 'fas fa-clinic-medical';
      case 'payment':
        return 'fas fa-euro-sign';
      case 'user':
        return 'fas fa-user';
      case 'delivery':
        return 'fas fa-truck';
      default:
        return 'fas fa-info-circle';
    }
  }

}
