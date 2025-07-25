import {PharmacyClass} from "../models/Pharmacy.class";
import {OpeningHoursClass} from "../models/OpeningHours.class";
import {Image} from "../models/Image.class";
import {Location} from "../models/Location";
import {Group, GroupCode} from "../models/Group.class";
import {UserDetails} from "../models/UserDatails";

/**
 * Fonctions communes réutilisables dans l'application
 */
export class CommonFunctions {
  static getRoleRedirectMap(group: Group, userDetails: UserDetails) {
    const roleRedirectMap: Record<string, string> = {
      [GroupCode.MANAGER_PHARMACY]: userDetails.onlyShowListPharm.length ? 'pharmacy/pharmacies/list' : 'pharmacy/dashboard',
      [GroupCode.PHARMACIEN]: userDetails.onlyShowListPharm.length ? 'pharmacy/pharmacies/list' : 'pharmacy/dashboard',
      [GroupCode.PREPARATEUR]: userDetails.onlyShowListPharm.length ? 'pharmacy/pharmacies/list' : 'pharmacy/dashboard',
      [GroupCode.CAISSIER]: userDetails.onlyShowListPharm.length ? 'pharmacy/pharmacies/list' : 'pharmacy/dashboard',
      [GroupCode.CONSULTANT]: userDetails.onlyShowListPharm.length ? 'pharmacy/pharmacies/list' : 'pharmacy/dashboard',
      [GroupCode.SUPERADMIN]: 'admin/dashboard/overview',
      [GroupCode.MANAGER_ADMIN]: 'admin/dashboard/overview',
      [GroupCode.ADMIN_TECHNIQUE]: 'admin/dashboard/overview',
      [GroupCode.SUPPORT_ADMIN]: 'admin/dashboard/overview',
    };
    return group.code && typeof roleRedirectMap[group.code] !=="undefined" ? roleRedirectMap[group.code] : null;
  }

  static mapToPharmacy(data: any): PharmacyClass | null {
    if (typeof data !== "object" || data === null) {
      return null;
    }

    if (!data._id || !data.registerDate || !data.name || !data.phoneNumber || !data.address || !data.email) {
      return null;
    }

    return new PharmacyClass({
      id: data._id,
      name: data.name,
      address: data.address,
      logoUrl: data.logoUrl ? new Image(data.logoUrl) : null,
      ownerId: data.ownerId || null,
      licenseNumber: data.licenseNumber || null,
      siret: data.siret || null,
      phoneNumber: data.phoneNumber,
      email: data.email,
      status: data.status || 'pending',
      location: data.location ? new Location(data.location) : null,
      suspensionDate: data.suspensionDate ? new Date(data.suspensionDate) : null,
      suspensionReason: data.suspensionReason || null,
      registerDate: data.registerDate ? new Date(data.registerDate) : new Date(),
      rating: data.rating || null,
      workingHours: data.workingHours ? data.workingHours.map((wh: any) => new OpeningHoursClass(wh)) : [],
      commentaire: data.commentaire ?? '',
      createdAt: data.createdAt ? new Date(data.createdAt) : null,
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : null,
      totalRevenue: data.totalRevenue || 0,
      orders30days: data.orders30days || null,
      revenue30days: data.revenue30days || null,
      documents: data.documents || null,
      city: data.city || null,
      country: data.country || null,
      deliveryZone: data.deliveryZone || null,
      deliveryServices: data.deliveryServices || null,
    });
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Formate une date en chaîne lisible
   * @param date - La date à formater
   * @returns La date formatée en chaîne
   */
  static formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Génère un ID unique
   * @returns Un ID unique sous forme de chaîne
   */
  static generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
