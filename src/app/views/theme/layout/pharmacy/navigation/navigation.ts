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
    id: 'pharmacy-general',
    title: 'Général',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      { id: 'pharmacy-pharmacy-dashboard', title: 'Tableau de bord', type: 'item', url: '/pharmacy/dashboard', icon: 'ti ti-home' },
      { id: 'pharmacy-speed-view', title: 'Comande a preparer', type: 'item', url: '/pharmacy/todo', icon: 'ti ti-list-check' },
      { id: 'pharmacy-list-view', title: 'Mes pharmacies', type: 'item', url: '/pharmacy/pharmacies/list', icon: 'fa fa-home' },
      {
        id: 'pharmacy-products',
        title: 'Produits',
        type: 'collapse',
        icon: 'icon-navigation',
        children: [
          {
            id: 'pharmacy-products-menu',
            title: 'Produits',
            type: 'collapse',
            icon: 'ti ti-package',
            children: [
              { id: 'pharmacy-products-list', title: 'Liste', type: 'item', url: '/pharmacy/products/list' },
              { id: 'pharmacy-products-grid', title: 'Grille', type: 'item', url: '/pharmacy/products/grid' },
              { id: 'pharmacy-products-details', title: 'Détails', type: 'item', url: '/pharmacy/products/details' },
              { id: 'pharmacy-products-edit', title: 'Modifier', type: 'item', url: '/pharmacy/products/edit' },
              { id: 'pharmacy-products-create', title: 'Créer', type: 'item', url: '/pharmacy/products/create' }
            ]
          }
        ]
      },
      {
        id: 'pharmacy-category',
        title: 'Catégories',
        type: 'collapse',
        icon: 'icon-navigation',
        children: [
          {
            id: 'pharmacy-category-menu',
            title: 'Catégories',
            type: 'collapse',
            icon: 'ti ti-tags',
            children: [
              { id: 'pharmacy-category-list', title: 'Liste', type: 'item', url: '/pharmacy/category/list' },
              { id: 'pharmacy-category-edit', title: 'Modifier', type: 'item', url: '/pharmacy/category/edit' },
              { id: 'pharmacy-category-create', title: 'Créer', type: 'item', url: '/pharmacy/category/create' }
            ]
          }
        ]
      },
      {
        id: 'pharmacy-inventory',
        title: 'Inventaire',
        type: 'collapse',
        icon: 'icon-navigation',
        children: [
          {
            id: 'pharmacy-inventory-menu',
            title: 'Inventaire',
            type: 'collapse',
            icon: 'ti ti-stack',
            children: [
              { id: 'pharmacy-warehouse', title: 'Entrepôt', type: 'item', url: '/pharmacy/inventory/warehouse' },
              { id: 'pharmacy-received-orders', title: 'Commandes reçues', type: 'item', url: '/pharmacy/inventory/received' }
            ]
          }
        ]
      },
      {
        id: 'pharmacy-orders',
        title: 'Commandes',
        type: 'collapse',
        icon: 'icon-navigation',
        children: [
          {
            id: 'pharmacy-orders-menu',
            title: 'Commandes',
            type: 'collapse',
            icon: 'ti ti-receipt',
            children: [
              { id: 'pharmacy-orders-list', title: 'Liste', type: 'item', url: '/pharmacy/orders/list' },
              { id: 'pharmacy-order-details', title: 'Détails', type: 'item', url: '/pharmacy/orders/details' },
              { id: 'pharmacy-order-cart', title: 'Panier', type: 'item', url: '/pharmacy/orders/cart' },
              { id: 'pharmacy-order-checkout', title: 'Paiement', type: 'item', url: '/pharmacy/orders/checkout' }
            ]
          }
        ]
      },
      {
        id: 'pharmacy-purchases',
        title: 'Achats',
        type: 'collapse',
        icon: 'icon-navigation',
        children: [
          {
            id: 'pharmacy-purchases-menu',
            title: 'Achats',
            type: 'collapse',
            icon: 'ti ti-shopping-cart',
            children: [
              { id: 'pharmacy-purchases-list', title: 'Liste', type: 'item', url: '/pharmacy/purchases/list' },
              { id: 'pharmacy-purchases-order', title: 'Ajouter au stock', type: 'item', url: '/pharmacy/purchases/order' },
              { id: 'pharmacy-purchases-return', title: 'Retour', type: 'item', url: '/pharmacy/purchases/return' }
            ]
          }
        ]
      },
      {
        id: 'pharmacy-attributes',
        title: 'Attributs',
        type: 'collapse',
        icon: 'icon-navigation',
        children: [
          {
            id: 'pharmacy-attributes-menu',
            title: 'Attributs',
            type: 'collapse',
            icon: 'ti ti-list',
            children: [
              { id: 'pharmacy-attributes-list', title: 'Liste', type: 'item', url: '/pharmacy/attributes/list' },
              { id: 'pharmacy-attributes-edit', title: 'Modifier', type: 'item', url: '/pharmacy/attributes/edit' },
              { id: 'pharmacy-attributes-create', title: 'Créer', type: 'item', url: '/pharmacy/attributes/create' }
            ]
          }
        ]
      },
      {
        id: 'pharmacy-invoices',
        title: 'Factures',
        type: 'collapse',
        icon: 'icon-navigation',
        children: [
          {
            id: 'pharmacy-invoices-menu',
            title: 'Factures',
            type: 'collapse',
            icon: 'ti ti-file-invoice',
            children: [
              { id: 'pharmacy-invoices-list', title: 'Liste', type: 'item', url: '/pharmacy/invoices/list' },
              { id: 'pharmacy-invoices-details', title: 'Détails', type: 'item', url: '/pharmacy/invoices/details' },
              { id: 'pharmacy-invoices-create', title: 'Créer', type: 'item', url: '/pharmacy/invoices/create' }
            ]
          }
        ]
      },
      { id: 'pharmacy-settings', title: 'Paramètres', type: 'item', url: '/pharmacy/settings', icon: 'ti ti-settings' }
    ]
  },
  {
    id: 'pharmacy-users',
    title: 'Utilisateurs',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      { id: 'pharmacy-profil', title: 'Profil', type: 'item', url: '/pharmacy/users/me', icon: 'ti ti-user' },
      { id: 'pharmacy-users-list', title: 'Utilisateurs', type: 'item', url: '/pharmacy/users/list', icon: 'ti ti-users' },
      { id: 'pharmacy-customers', title: 'Clients', type: 'item', url: '/pharmacy/customers/list', icon: 'ti ti-truck' },
      { id: 'pharmacy-role', title: 'Roles', type: 'item', url: '/pharmacy/roles/list', icon: 'ti ti-target' },
      { id: 'pharmacy-permissions', title: 'Permissions', type: 'item', icon: "ti ti-bolt", url: '/pharmacy/users/permissions' },
    ]
  },
  {
    id: 'pharmacy-other',
    title: 'Autres',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      { id: 'pharmacy-reviews', title: 'Avis', type: 'item', url: '/pharmacy/reviews', icon: 'ti ti-star' }
    ]
  },
  {
    id: 'pharmacy-other-apps',
    title: 'Applications',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      { id: 'pharmacy-chat', title: 'Messagerie interne', type: 'item', url: '/pharmacy/chat', icon: 'ti ti-message' },
      { id: 'pharmacy-calendar', title: 'Calendrier', type: 'item', url: '/pharmacy/calendar', icon: 'ti ti-calendar' },
      { id: 'pharmacy-support', title: 'Support', type: 'item', url: '/pharmacy/support', icon: 'ti ti-headset' }
    ]
  }

];
