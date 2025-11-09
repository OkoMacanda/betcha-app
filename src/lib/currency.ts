import { Currency, CurrencyConfig } from '@/types/settings.types';

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    name: 'South African Rand',
    locale: 'en-ZA',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'de-DE',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    locale: 'en-GB',
  },
};

/**
 * Format an amount with the specified currency
 */
export function formatCurrency(amount: number, currency: Currency = 'ZAR'): string {
  const config = CURRENCIES[currency];

  if (!config) {
    console.warn(`Unknown currency: ${currency}, defaulting to ZAR`);
    return formatCurrency(amount, 'ZAR');
  }

  // Format using the currency's locale
  const formatted = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  // Add currency symbol
  return `${config.symbol} ${formatted}`;
}

/**
 * Get the symbol for a currency
 */
export function getCurrencySymbol(currency: Currency = 'ZAR'): string {
  return CURRENCIES[currency]?.symbol || 'R';
}

/**
 * Get the full name for a currency
 */
export function getCurrencyName(currency: Currency = 'ZAR'): string {
  return CURRENCIES[currency]?.name || 'South African Rand';
}

/**
 * Get currency configuration
 */
export function getCurrencyConfig(currency: Currency = 'ZAR'): CurrencyConfig {
  return CURRENCIES[currency] || CURRENCIES.ZAR;
}

/**
 * Parse a formatted currency string back to a number
 */
export function parseCurrency(formatted: string): number {
  // Remove currency symbols and spaces
  const cleaned = formatted.replace(/[^\d.,]/g, '');

  // Handle different decimal separators
  // If there are multiple commas/periods, assume the last one is decimal separator
  const lastComma = cleaned.lastIndexOf(',');
  const lastPeriod = cleaned.lastIndexOf('.');

  let normalized: string;
  if (lastComma > lastPeriod) {
    // Comma is decimal separator (European format)
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // Period is decimal separator (US/ZA format)
    normalized = cleaned.replace(/,/g, '');
  }

  return parseFloat(normalized) || 0;
}
