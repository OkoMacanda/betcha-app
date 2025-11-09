import { useSettings } from './useSettings';
import { formatCurrency, getCurrencySymbol, getCurrencyConfig } from '@/lib/currency';
import { Currency } from '@/types/settings.types';

/**
 * Hook that provides currency formatting based on user preferences
 */
export function useCurrency() {
  const { settings, isLoading } = useSettings();

  const currency: Currency = settings?.currency || 'ZAR';
  const symbol = getCurrencySymbol(currency);
  const config = getCurrencyConfig(currency);

  /**
   * Format an amount in the user's preferred currency
   */
  const format = (amount: number): string => {
    return formatCurrency(amount, currency);
  };

  return {
    currency,
    symbol,
    config,
    format,
    isLoading,
  };
}
