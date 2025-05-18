import {Component, OnInit, ViewChild, ElementRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/views/theme/shared/shared.module';
import { Chart, registerables } from 'chart.js';
import {AuthService} from "../../../../controllers/services/auth.service";
import {LoadingService} from "../../../../controllers/services/loading.service";
import {HttpHeaders} from "@angular/common/http";
import {Subject, takeUntil} from "rxjs";
import Swal from "sweetalert2";
import {ApiService} from "../../../../controllers/services/api.service";

@Component({
  selector: 'app-admin-dashboard-activities',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './recentactivities.component.html',
  styleUrls: ['./recentactivities.component.scss'],
})

export class RecentactivitiesComponent implements OnInit {
  public recentActivities: any[] = [];
  period: string = '50';

  constructor(private authUser: AuthService, private loadingService: LoadingService, private apiService: ApiService)  {
    Chart.register(...registerables);
  }
  userDetails = this.authUser.getUserDetails();

  ngOnInit(): void {
    this.loadGlobalsData();
  }
  private destroy$ = new Subject<void>();

  async loadGlobalsData (){
    this.loadingService.setLoading(true);
    try {
      this.loadingService.setLoading(true);
      const token = await this.authUser.getRealToken();
      const uid = await this.authUser.getUid();
      if (!token) {
        this.handleError('Vous n\'êtes pas autorisé à accéder à cette ressource');
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      });
      const thisPeriod = this.period;

      this.apiService.post('managers/dashboard/activities', { uid, thisPeriod }, headers)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response && response.data) {
              if (response.data.recent_activities){ this.recentActivities = response.data.recent_activities;}
              else{ this.recentActivities = []; }
            } else {
              this.recentActivities = [];
            }
            this.loadingService.setLoading(false);
          },
          error: (error) => {
            this.handleError('Erreur lors du chargement des donnees');
            this.loadingService.setLoading(false);
          }
        });
    } catch (error) {
      this.handleError('Une erreur s\'est produite');
      this.loadingService.setLoading(false);
    }
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
