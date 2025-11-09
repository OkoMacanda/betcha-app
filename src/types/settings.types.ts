export type Currency = 'ZAR' | 'USD' | 'EUR' | 'GBP';

export type ProfileVisibility = 'public' | 'friends' | 'private';

export type Theme = 'light' | 'dark' | 'system';

export interface UserSettings {
  id: string;
  user_id: string;
  currency: Currency;
  display_name?: string;
  phone_number?: string;
  avatar_url?: string;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  profile_visibility: ProfileVisibility;
  show_betting_history: boolean;
  theme: Theme;
  created_at: string;
  updated_at: string;
}

export interface CurrencyConfig {
  code: Currency;
  symbol: string;
  name: string;
  locale: string;
}

export interface UpdateSettingsInput {
  currency?: Currency;
  display_name?: string;
  phone_number?: string;
  avatar_url?: string;
  email_notifications?: boolean;
  push_notifications?: boolean;
  sms_notifications?: boolean;
  profile_visibility?: ProfileVisibility;
  show_betting_history?: boolean;
  theme?: Theme;
}
