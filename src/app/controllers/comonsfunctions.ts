import {PharmacyClass} from "../models/Pharmacy.class";
import {OpeningHoursClass} from "../models/OpeningHours.class";
import {Image} from "../models/Image.class";
import {Location} from "../models/Location";

/**
 * Fonctions communes réutilisables dans l'application
 */
export class CommonFunctions {

  /**
   * Mappe les données brutes vers une instance de PharmacyClass
   * @param data - Les données brutes à mapper
   * @returns Une instance de PharmacyClass ou null si les données sont invalides
   */
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
      createdAt: data.createdAt ? new Date(data.createdAt) : null,
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : null,
      totalRevenue: data.totalRevenue || 0,
      orders30days: data.orders30days || null,
      revenue30days: data.revenue30days || null,
    });
  }

  /**
   * Extraire la liste des regions par raport au region specifier dans l'ensemble des pharmacies
   */
  // static extractRegions(pharmacies: PharmacyClass[] | null[]): void {
  //   const uniqueRegions = new Set<string>();
  //   pharmacies.forEach(pharmacy => {
  //     if (pharmacy && pharmacy.location && pharmacy.location.latitude) {
  //       uniqueRegions.add(pharmacy.location.latitude.toString());
  //     }
  //   });
  //   return Array.from(uniqueRegions);
  // }

  /**
   * Valide un email
   * @param email - L'email à valider
   * @returns true si l'email est valide, false sinon
   */
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
