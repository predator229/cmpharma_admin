export enum CurrencySymbolPosition {
  BEFORE = 'before',
  AFTER = 'after'
}
export interface CurrencyFormat {
  decimal_separator: string;
  thousands_separator: string;
  symbol_position: CurrencySymbolPosition;
  symbol_spacing: boolean;
  decimal_digits: number;
}

export class CurrencyModel {
  _id?: string;
  code: string;
  name: string;
  symbol: string;
  numeric_code?: string;
  decimal_digits: number;
  is_active: boolean;
  is_crypto: boolean;
  is_base_currency: boolean;
  format: CurrencyFormat;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data?: Partial<CurrencyModel>) {
    this._id = data?._id;
    this.code = data?.code || '';
    this.name = data?.name || '';
    this.symbol = data?.symbol || '';
    this.numeric_code = data?.numeric_code;
    this.decimal_digits = data?.decimal_digits || 2;
    this.is_active = data?.is_active ?? true;
    this.is_crypto = data?.is_crypto ?? false;
    this.is_base_currency = data?.is_base_currency ?? false;
    this.format = data?.format || {
      decimal_separator: '.',
      thousands_separator: ',',
      symbol_position: CurrencySymbolPosition.AFTER,
      symbol_spacing: true,
      decimal_digits: 2,

    };
    this.createdAt = data?.createdAt ? new Date(data.createdAt) : undefined;
    this.updatedAt = data?.updatedAt ? new Date(data.updatedAt) : undefined;
  }

  formatAmount(amount: number): string {
    const rounded = amount.toFixed(this.decimal_digits);
    const [integer, decimal] = rounded.split('.');

    const formattedInteger = integer.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      this.format.thousands_separator
    );

    let formatted = decimal
      ? `${formattedInteger}${this.format.decimal_separator}${decimal}`
      : formattedInteger;

    if (this.format.symbol_position === CurrencySymbolPosition.AFTER) {
      formatted = `${this.symbol}${this.format.symbol_spacing ? ' ' : ''}${formatted}`;
    } else {
      formatted = `${formatted}${this.format.symbol_spacing ? ' ' : ''}${this.symbol}`;
    }

    return formatted;
  }

  static fromJSON(json: any): CurrencyModel {
    return new CurrencyModel(json);
  }

  toJSON(): any {
    return {
      code: this.code,
      name: this.name,
      symbol: this.symbol,
      numeric_code: this.numeric_code,
      decimal_digits: this.decimal_digits,
      is_active: this.is_active,
      is_crypto: this.is_crypto,
      is_base_currency: this.is_base_currency,
      format: this.format
    };
  }
}
