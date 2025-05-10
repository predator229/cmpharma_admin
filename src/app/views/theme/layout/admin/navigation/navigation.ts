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
}

export const NavigationItems: NavigationItem[] = [
  {
    id: 'admin-dashboard',
    title: 'Tableau de bord',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'overview',
        title: "Vue d'ensemble",
        type: 'item',
        classes: 'nav-item',
        url: '/admin/dashboard/overview',
        icon: 'ti ti-dashboard',
        breadcrumbs: false
      },
      {
        id: 'stats',
        title: 'Statistiques',
        type: 'item',
        url: '/admin/dashboard/stats',
        icon: 'ti ti-chart-bar'
      },
      {
        id: 'recent-activity',
        title: 'Activité récente',
        type: 'item',
        url: '/admin/dashboard/activity',
        icon: 'ti ti-activity'
      }
    ]
  },
  {
    id: 'pharmacies',
    title: 'Gestion des pharmacies',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'pharmacy-management',
        title: 'Pharmacies',
        type: 'collapse',
        icon: 'ti ti-building-hospital',
        children: [
          { id: 'pharmacy-list', title: 'Liste des pharmacies', type: 'item', url: '/admin/pharmacies/list' },
        ]
      }
    ]
  },
  {
    id: 'orders',
    title: 'Gestion des commandes',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'order-management',
        title: 'Commandes',
        type: 'collapse',
        icon: 'ti ti-box',
        children: [
          { id: 'ongoing-orders', title: 'Commandes en cours', type: 'item', url: '/admin/orders/ongoing' },
          { id: 'delivered-orders', title: 'Commandes livrées', type: 'item', url: '/admin/orders/delivered' },
          { id: 'cancelled-orders', title: 'Commandes annulées', type: 'item', url: '/admin/orders/cancelled' },
          { id: 'order-details', title: 'Détails des commandes', type: 'item', url: '/admin/orders/details' }
        ]
      }
    ]
  },
  {
    id: 'payments',
    title: 'Gestion des paiements',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'payment-management',
        title: 'Paiements',
        type: 'collapse',
        icon: 'ti ti-currency-dollar',
        children: [
          { id: 'recent-transactions', title: 'Transactions récentes', type: 'item', url: '/admin/payments/recent' },
          { id: 'payment-history', title: 'Historique des paiements', type: 'item', url: '/admin/payments/history' },
          { id: 'platform-commission', title: 'Commission plateforme', type: 'item', url: '/admin/payments/commission' },
          { id: 'pharmacy-revenue', title: 'Revenus des pharmacies', type: 'item', url: '/admin/payments/pharmacies' },
          { id: 'courier-revenue', title: 'Revenus des livreurs', type: 'item', url: '/admin/payments/livreurs' }
        ]
      }
    ]
  },
  {
    id: 'delivery',
    title: 'Gestion des livreurs',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'couriers',
        title: 'Livreurs',
        type: 'collapse',
        icon: 'ti ti-truck-delivery',
        children: [
          { id: 'courier-list', title: 'Liste des livreurs', type: 'item', url: '/admin/livreurs/list' },
          { id: 'courier-requests', title: "Demandes d'inscription", type: 'item', url: '/admin/livreurs/requests' },
          { id: 'courier-performance', title: 'Performance des livreurs', type: 'item', url: '/admin/livreurs/performance' },
          { id: 'courier-status', title: 'Validation/Suspension', type: 'item', url: '/admin/livreurs/status' }
        ]
      }
    ]
  },
  {
    id: 'clients',
    title: 'Gestion des clients',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'client-management',
        title: 'Clients',
        type: 'collapse',
        icon: 'ti ti-users',
        children: [
          { id: 'client-list', title: 'Liste des clients', type: 'item', url: '/admin/clients/list' },
          { id: 'client-stats', title: 'Statistiques clients', type: 'item', url: '/admin/clients/stats' },
          { id: 'client-status', title: 'Comptes actifs/inactifs', type: 'item', url: '/admin/clients/status' }
        ]
      }
    ]
  },
  {
    id: 'settings',
    title: 'Paramètres',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'settings-group',
        title: 'Paramètres',
        type: 'collapse',
        icon: 'ti ti-settings',
        children: [
          { id: 'account-settings', title: 'Paramètres du compte', type: 'item', url: '/admin/settings/account' },
          { id: 'platform-settings', title: 'Paramètres de la plateforme', type: 'item', url: '/admin/settings/platform' },
          { id: 'commission-rate', title: 'Taux de commission', type: 'item', url: '/admin/settings/commission' },
          { id: 'delivery-fees', title: 'Frais de livraison', type: 'item', url: '/admin/settings/delivery-fees' }
        ]
      }
    ]
  },
  {
    id: 'reports',
    title: 'Rapports',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'reporting',
        title: 'Rapports',
        type: 'collapse',
        icon: 'ti ti-report',
        children: [
          { id: 'sales-report', title: 'Rapport des ventes', type: 'item', url: '/admin/reports/sales' },
          { id: 'delivery-report', title: 'Rapport des livraisons', type: 'item', url: '/admin/reports/delivery' },
          { id: 'financial-report', title: 'Rapport financier', type: 'item', url: '/admin/reports/finance' },
          { id: 'data-export', title: 'Exportation de données', type: 'item', url: '/admin/reports/export' }
        ]
      }
    ]
  }
];
