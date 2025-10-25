export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;
  children?: NavigationItem[];
  role?: string[];
  isMainParent?: boolean;
  permissions: string[];
}

export const NavigationItems: NavigationItem[] = [
  {
    id: 'pharmacy-general',
    title: 'Général',
    type: 'group',
    icon: 'icon-navigation',
    permissions: [
      'dashboard.view',
      'dashboard.stats',
      'dashboard.export',
      'preparation.view',
      'avis.view',
      'calendrier.view'
    ],
    children: [
      {
        id: 'pharmacy-preparation',
        title: 'En cours',
        type: 'item',
        url: '/pharmacy/preparation',
        icon: 'fa fa-fire text-danger',
        permissions: ['preparation.view']
      },
      {
        id: 'pharmacy-dashboard',
        title: 'Tableau de bord',
        type: 'item',
        url: '/pharmacy/dashboard',
        icon: 'fa fa-home',
        permissions: ['dashboard.view']
      },
      {
        id: 'pharmacy-admin-analytics',
        title: 'Stats',
        type: 'item',
        url: '/pharmacy/admin/analytics',
        icon: 'fa fa-chart-bar',
        permissions: ['admin_pharmacy.analytics.view']
      },
      {
        id: 'pharmacy-reviews',
        title: 'Avis clients',
        type: 'item',
        url: '/pharmacy/reviews-products',
        icon: 'fa fa-star',
        permissions: ['avis.view']
      },
      {
        id: 'pharmacy-calendar',
        title: 'Calendrier',
        type: 'item',
        url: '/pharmacy/calendar',
        icon: 'fa fa-calendar',
        permissions: ['calendrier.view']
      }
    ]
  },
  {
    id: 'pharmacy-products-sales',
    title: 'Produits et Ventes',
    type: 'group',
    icon: 'icon-navigation',
    permissions: [
      'categories.view',
      'produits.view',
      'commandes.view',
      'factures.view',
      'clients.view'
    ],
    children: [
      // {
      //   id: 'pharmacy-pharmacies',
      //   title: 'Mes Pharmacies',
      //   type: 'item',
      //   icon: 'fa fa-hospital',
      //   url: '/pharmacy/pharmacies/list',
      //   permissions: ['pharmacies.view']
      // },
      {
        id: 'pharmacy-categories',
        title: 'Catégories',
        type: 'item',
        icon: 'fa fa-tags',
        url: '/pharmacy/categories/list',
        permissions: ['categories.view']
      },
      {
        id: 'pharmacy-products',
        title: 'Produits',
        icon: 'fa fa-box',
        type: 'item',
        url: '/pharmacy/products/list',
        permissions: ['produits.view']
      },
      {
        id: 'pharmacy-orders',
        title: 'Commandes',
        type: 'item',
        url: '/pharmacy/orders/list',
        icon: 'fa fa-receipt',
        permissions: ['commandes.view']
      },
      {
        id: 'pharmacy-invoices',
        title: 'Factures',
        type: 'item',
        url: '/pharmacy/invoices/list',
        icon: 'fa fa-file-invoice',
        permissions: ['factures.view']
      },
    ]
  },
  {
    id: 'pharmacy-users-management',
    title: 'Gestion des utilisateurs',
    type: 'group',
    icon: 'icon-navigation',
    permissions: [
      'utilisateurs.view',
      'utilisateurs.permissions',
    ],
    children: [
      {
        id: 'pharmacy-users',
        title: 'Utilisateurs',
        type: 'item',
        url: '/pharmacy/users/list',
        icon: 'ti ti-users',
        permissions: ['utilisateurs.view']
      },
      {
        id: 'pharmacy-permissions',
        title: 'Permissions',
        type: 'item',
        icon: "fa fa-bolt",
        url: '/pharmacy/permissions/list',
        permissions: ['utilisateurs.permissions']
      },
    ]
  },
  {
    id: 'pharmacy-applications',
    title: 'Applications',
    type: 'group',
    icon: 'icon-navigation',
    permissions: [
      'messagerie.view',
      'support.view'
    ],
    children: [
      {
        id: 'pharmacy-messaging',
        title: 'Messagerie interne',
        type: 'item',
        url: '/pharmacy/messaging',
        icon: 'fa fa-message',
        permissions: ['messagerie.view']
      },
      {
        id: 'pharmacy-support',
        title: 'Support',
        type: 'item',
        url: '/pharmacy/support/list',
        icon: 'fa fa-headset',
        permissions: ['support.view']
      }
    ]
  },
  {
    id: 'pharmacy-settings',
    title: 'Paramètres de la pharmacie',
    type: 'group',
    icon: 'icon-navigation',
    permissions: [
      'pharmacies.view',
      'parametres.view',
      'admin_pharmacy.logs.view',
      'admin_pharmacy.config.view',
      'admin_pharmacy.analytics.view'
    ],
    children: [
      {
        id: 'pharmacy-general-settings',
        title: 'Général',
        type: 'item',
        url: '/pharmacy/settings',
        icon: 'fa fa-cogs',
        permissions: ['parametres.view']
      },
      {
        id: 'pharmacy-taxes-settings',
        title: 'Taxes & Fiscalité',
        type: 'item',
        url: '/pharmacy/settings/taxes',
        icon: 'fa fa-coins',
        permissions: ['parametres.view']
      },
      {
        id: 'pharmacy-exchange-rate-settings',
        title: 'Taux de change',
        type: 'item',
        url: '/pharmacy/settings',
        icon: 'fa fa-exchange-alt',
        permissions: ['parametres.view']
      },
      {
        id: 'pharmacy-notification-settings',
        title: 'Notifications',
        type: 'item',
        url: '/pharmacy/settings',
        icon: 'fa fa-bell',
        permissions: ['parametres.view']
      },
    ],
  },
  {
    id: 'pharmacy-admin-settings',
    title: 'Administration système',
    type: 'group',
    icon: 'icon-navigation',
    permissions: [
      'admin_pharmacy.logs.view',
      'admin_pharmacy.config.view',
      'admin_pharmacy.analytics.view'
    ],
    children: [
      {
        id: 'pharmacy-admin-logs',
        title: 'Logs système',
        type: 'item',
        url: '/pharmacy/admin/logs',
        icon: 'fa fa-file-text',
        permissions: ['admin_pharmacy.logs.view']
      },
      {
        id: 'pharmacy-admin-integration',
        title: 'Intégrations API',
        type: 'item',
        url: '/pharmacy/admin/integrations',
        icon: 'fa fa-plug',
        permissions: ['admin_pharmacy.config.view']
      },
      {
        id: 'pharmacy-admin-config',
        title: 'Configuration avancée',
        type: 'item',
        url: '/pharmacy/admin/config',
        icon: 'fa fa-tools',
        permissions: ['admin_pharmacy.config.view']
      },
    ],
  }
];
