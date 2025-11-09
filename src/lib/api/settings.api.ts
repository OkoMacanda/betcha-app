import { supabase } from '@/integrations/supabase/client';
import { handleApiError } from '@/lib/error-handler';
import { UserSettings, UpdateSettingsInput } from '@/types/settings.types';

/**
 * Get user settings by user ID
 */
export async function getUserSettings(
  userId: string
): Promise<{ data: UserSettings | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    // If no settings exist, create default ones
    if (!data) {
      return createDefaultSettings(userId);
    }

    return { data: data as UserSettings, error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Create default settings for a new user
 */
export async function createDefaultSettings(
  userId: string
): Promise<{ data: UserSettings | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .insert({
        user_id: userId,
        currency: 'ZAR',
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        profile_visibility: 'public',
        show_betting_history: true,
        theme: 'system',
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    return { data: data as UserSettings, error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  userId: string,
  updates: UpdateSettingsInput
): Promise<{ data: UserSettings | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    return { data: data as UserSettings, error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Delete user settings (for cleanup)
 */
export async function deleteUserSettings(
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('user_settings')
      .delete()
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: handleApiError(error) };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
}
