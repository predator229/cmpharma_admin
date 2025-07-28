import {Component, Input, OnInit, SimpleChanges} from '@angular/core';
import {CommonModule, DatePipe, NgClass} from "@angular/common";
import {ActivityLoged} from "../../../../models/Activity.class";

export interface UserInfo { name: string; img: string;}
export interface UsersMap { [key: string]: UserInfo;}

@Component({
  selector: 'app-activity-timeline',
  templateUrl: './activity-timeline.component.html',
  imports: [
    DatePipe,
    NgClass,
    CommonModule
  ],
  styleUrls: ['./activity-timeline.component.scss']
})
export class ActivityTimelineComponent implements OnInit {
  @Input() activites: ActivityLoged[] = [];
  @Input() usersInfo: UsersMap = {};

  constructor() {}

  ngOnInit(): void {
    this.sortActivities();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activites'] && this.activites) {
      this.sortActivities();
    }
  }
  private sortActivities(): void {
    this.activites = this.activites
      .map(activity => ({
        ...activity,
        time: activity.createdAt
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getActivityIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'creation': 'fas fa-plus-circle',
      'modification': 'fas fa-edit',
      'suppression': 'fas fa-trash-alt',
      'validation': 'fas fa-check-circle',
      'notification': 'fas fa-bell',
      'Administrateur': 'fas fa-user-shield',
      'status': 'fas fa-info-circle',
      'order': 'fas fa-shopping-cart',
      'payment': 'fas fa-credit-card',
      'admin': 'fas fa-cog',
      'user': 'fas fa-user',
      'system': 'fas fa-server',
      'default': 'fas fa-circle'
    };

    return iconMap[type] || iconMap['default'];
  }

  getActivityClass(type: string): string {
    const classMap: { [key: string]: string } = {
      'creation': 'creation',
      'modification': 'modification',
      'suppression': 'suppression',
      'validation': 'validation',
      'notification': 'notification',
      'Administrateur': 'admin',
      'status': 'status',
      'order': 'order',
      'payment': 'payment',
      'admin': 'admin',
      'user': 'default',
      'system': 'default'
    };

    return classMap[type] || 'default';
  }

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'À l\'instant';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    }
  }

  truncateDescription(description: string, maxLength: number = 100): string {
    if (!description || description.length <= maxLength) {
      return description;
    }
    return description.substring(0, maxLength) + '...';
  }

  getDefaultAvatar(name: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=500`;
  }

  getUserInfo(authorId: string): UserInfo | null {
    return this.usersInfo[authorId] || null;
  }

  onLoadMore(): void {
    // Émettre un événement personnalisé ou appeler une méthode parent
    // Ce sera géré par le composant parent
  }
}
