import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './views/theme/layout/admin/admin.component';
import { PharmacyComponent } from './views/theme/layout/pharmacy/pharmacy.component';
import { GuestComponent } from './views/theme/layout/guest/guest.component';
import { AuthGuard } from './controllers/guards/auth.guard';
import { GroupGuard } from './controllers/guards/group.guard';
import { LoginGuard } from './controllers/guards/login.guard';
import {GroupCode} from "./models/Group.class";
import {
  ProductReviewsByProductComponent
} from "./views/authentifiedusers/pharmacy/general-section/review-product/grouped/reviews-product.component";

const routes: Routes = [{
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard, GroupGuard],
    data: { roles: [GroupCode.MANAGER_ADMIN, GroupCode.ADMIN_TECHNIQUE, GroupCode.SUPPORT_ADMIN, GroupCode.SUPERADMIN] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard/overview', loadComponent: () =>import('./views/authentifiedusers/admin/tableaubord/dashboard/dashboard.component').then((c) => c.AdminDashboardComponent),},
      { path: 'dashboard/stats', loadComponent: () =>import('./views/authentifiedusers/admin/tableaubord/statistiques/statistique.component').then((c) => c.StatisticsComponent),},
      { path: 'dashboard/activity', loadComponent: () =>import('./views/authentifiedusers/admin/tableaubord/recentActivities/recentactivities.component').then((c) => c.RecentactivitiesComponent),},
      { path: 'pharmacies/list',loadComponent: () =>import('./views/authentifiedusers/admin/pharmacies/list/list.component').then((c) => c.PharmacyListComponent), },
      { path: 'pharmacies/:id',  loadComponent: () => import('./views/authentifiedusers/admin/pharmacies/details/details.component').then((c) => c.PharmacyDetailComponent), },
    ],
  },

  // PHARMACY AREA
  {
    path: 'pharmacy',
    component: PharmacyComponent,
    canActivate: [AuthGuard, GroupGuard],
    data: { roles: [GroupCode.MANAGER_PHARMACY, GroupCode.PHARMACIEN, GroupCode.CAISSIER, GroupCode.CONSULTANT, GroupCode.SUPERADMIN] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',loadComponent: () =>import('./views/authentifiedusers/pharmacy/general-section/dashboard/dashboard.component').then((c) => c.PharmacyDashboardComponent), },
      { path: 'admin/analytics',loadComponent: () =>import('./views/authentifiedusers/pharmacy/general-section/stats/stats.component').then((c) => c.PharmacyAdminStats), },
      { path:'preparation',loadComponent: () =>import('./views/authentifiedusers/pharmacy/general-section/encours/encours.component').then((c) => c.PharmacyOrdersEnCoursComponent), },
      { path:'calendar',loadComponent: () =>import('./views/authentifiedusers/pharmacy/general-section/calendar/calendar.component').then((c) => c.CalendarPharmacyTrackingComponent), },

      { path:'reviews-products',loadComponent: () =>import('./views/authentifiedusers/pharmacy/general-section/review-product/list/review-product.component').then((c) => c.ProductPharmacyReviewsListComponent), },
      { path:'reviews-products/:id',loadComponent: () =>import('./views/authentifiedusers/pharmacy/general-section/review-product/detail/review-product.component').then((c) => c.ProductReviewDetailsPharmacyComponent), },
      { path:'reviewspeproduct/:id',loadComponent: () =>import('./views/authentifiedusers/pharmacy/general-section/review-product/grouped/reviews-product.component').then((c) => c.ProductReviewsByProductComponent), },

      // { path: 'pharmacies/list', loadComponent: () =>import('./views/authentifiedusers/pharmacy/products-and-sell-section/pharmacies/list/list.component').then((c) => c.PharmacyListComponentPharmacie), },
      { path: 'settings',  loadComponent: () => import('./views/authentifiedusers/pharmacy/settings-and-conf-section/pharmacies/details/details.component').then((c) => c.PharmacyDetailComponentPharmacie), },

      { path: 'categories/list', loadComponent: () =>import('./views/authentifiedusers/pharmacy/products-and-sell-section/categories/list/list.component').then((c) => c.PharmacyCategoryListComponent), },
      { path: 'categories/:id',  loadComponent: () => import('./views/authentifiedusers/pharmacy/products-and-sell-section/categories/category/category.component').then((c) => c.PharmacyCategoryDetailComponent), },

      { path: 'products/list', loadComponent: () =>import('./views/authentifiedusers/pharmacy/products-and-sell-section/products/list/products.component').then((c) => c.PharmacyProductListComponent), },
      { path: 'products/:id',  loadComponent: () => import('./views/authentifiedusers/pharmacy/products-and-sell-section/products/product/product.component').then((c) => c.PharmacyProductDetailComponent), },

      { path: 'users/list', loadComponent: () =>import('./views/authentifiedusers/pharmacy/users-manage-section/users/list/users.component').then((c) => c.PharmacyUsersListComponent), },
      { path: 'users/:id', loadComponent: () =>import('./views/authentifiedusers/pharmacy/users-manage-section/users/user/user.component').then((c) => c.PharmacyUserDetailComponent), },

      { path: 'permissions/list', loadComponent: () =>import('./views/authentifiedusers/pharmacy/users-manage-section/permissions/list/permissions.component').then((c) => c.PharmacyPermissionsManagementComponent), },

      { path: 'admin/logs',  loadComponent: () => import('./views/authentifiedusers/pharmacy/settings-and-conf-section/logs/logs.component').then((c) => c.PharmacyLogsComponent), },
      { path: 'admin/logs/:idPharmacy',  loadComponent: () => import('./views/authentifiedusers/pharmacy/settings-and-conf-section/logs/logs.component').then((c) => c.PharmacyLogsComponent), },

      { path: 'orders/list', loadComponent: () =>import('./views/authentifiedusers/pharmacy/products-and-sell-section/orders/list/list.component').then((c) => c.PharmacyOrderListComponent), },
      { path: 'orders/:id', loadComponent: () =>import('./views/authentifiedusers/pharmacy/products-and-sell-section/orders/detail/detail.component').then((c) => c.PharmacyOrderDetailComponent), },

      { path: 'messaging',  loadComponent: () => import('./views/authentifiedusers/pharmacy/application-section/messagerie/messagerie.component').then((c) => c.PharmacyInternalMessagingComponent), },
      { path: 'support/list',  loadComponent: () => import('./views/authentifiedusers/pharmacy/application-section/support/tickets/list/support.component').then((c) => c.TicketListComponent), },
      { path: 'support/:id',  loadComponent: () => import('./views/authentifiedusers/pharmacy/application-section/support/tickets/detail/support.component').then((c) => c.TicketDetailComponent), },

    ],
  },

  // GUEST AREA (Login, Landing)
  {
    path: '',
    component: GuestComponent,
    // canActivate: [AuthGuard, RoleGuard],
    children: [
      { path: 'login', loadComponent: () => import('./views/notauthentifiedusers/login/login.component'), canActivate: [LoginGuard], },
      { path: '', loadComponent: () => import('./views/allusers/landing/landing.component'), },
      { path: 'welcome', loadComponent: () => import('./views/allusers/landing/landing.component'), },
      { path: 'welcome-action', loadComponent: () => import('./views/allusers/landing2/landing2.component'), },
      { path: 'become-partner', loadComponent: () => import('./views/notauthentifiedusers/become_partner/become-partner.component').then((c) => c.BecomePartnerComponent), },
      { path: 'set-password', loadComponent: () => import('./views/notauthentifiedusers/set-password/set-password.component').then(m => m.SetPasswordComponent) },
      { path: 'not-found', loadComponent: () => import('./views/authentifiedusers/sharedComponents/errors/not-found/not-found.component') },
      { path: 'use-proxy', loadComponent: () => import('./views/authentifiedusers/sharedComponents/errors/use-proxy/use-proxy.component') },

      // { path: 'assets/images/marker-shadow.png' }
    ],
  },

  {
    path: '**',
    redirectTo: 'not-found',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
