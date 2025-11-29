export interface RateHistory {
  _id: string;
  value: number;
  effective_from: Date;
  effective_to?: Date | null;
  is_active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TaxType = 'percentage' | 'fixed';
export type Jurisdiction = 'national' | 'regional' | 'municipal';
export type ApplicableOn = 'all' | 'category' | 'product' | 'pharmacy';

export interface Taxe {
  _id?: string;
  name: string;
  description?: string | null;
  rates: RateHistory[];
  type: TaxType;
  is_custom: boolean;
  is_active: boolean;
  effective_from: Date;
  effective_to?: Date | null;
  is_exemptible: boolean;
  country: string;        // ID du pays
  pharmacy?: string;      // ID de la pharmacie (optionnel)
  jurisdiction: Jurisdiction;
  applicable_on: ApplicableOn;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Classe utilitaire pour la logique front-end
 * (par exemple : affichage du taux actif)
 */
export class TaxeModel implements Taxe {
  _id?: string;
  name: string;
  description?: string | null;
  rates: RateHistory[] = [];
  type: TaxType = 'percentage';
  is_custom = true;
  is_active = true;
  effective_from = new Date();
  effective_to?: Date | null;
  is_exemptible = false;
  country!: string;
  pharmacy?: string;
  jurisdiction: Jurisdiction = 'national';
  applicable_on: ApplicableOn = 'all';
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data?: Partial<Taxe>) {
    Object.assign(this, data);
  }

  /**
   * Retourne le taux actif à la date actuelle
   */
  getCurrentRateFees(): number | undefined {
    return this.getCurrentRate()?.value ?? undefined;
  }

  getCurrentRate(): RateHistory | undefined {
    if (!this.rates?.length) return null;
    const now = new Date();
    const active = this.rates.find(
      r =>
        r.is_active &&
        (!r.effective_to || new Date(r.effective_to) >= now) &&
        new Date(r.effective_from) <= now
    );
    return active ?? undefined;
  }

  /**
   * Retourne un texte lisible pour l’affichage
   */
  getDisplayLabel(): string {
    const rate = this.getCurrentRate();
    if (rate === null) return this.name;
    const suffix = this.type === 'percentage' ? '%' : 'XOF';
    return `${this.name} (${rate}${suffix})`;
  }

  formatRate(): string {
    const rate = this.getCurrentRateFees();
    if (rate === null || rate === undefined) return 'N/A';

    const suffix = this.type === 'percentage' ? '%' : ' XOF';
    return `${rate}${suffix}`;
  }

  calculatePharmacyTax(price: number): number {
    if (!price) return 0;

    if (this.type === 'percentage') {
      return (price * this.getCurrentRateFees()) / 100;
    } else {
      return this.getCurrentRateFees();
    }
  }

}
