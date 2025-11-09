import { supabase } from '@/integrations/supabase/client';
import { Contact, ImportContactData } from '@/types/social.types';
import { handleApiError } from '@/lib/error-handler';

/**
 * Import contacts from phone or manual entry
 */
export async function importContacts(
  userId: string,
  contacts: ImportContactData[]
): Promise<{ data: Contact[] | null; error: string | null }> {
  try {
    const contactRecords = contacts.map(contact => ({
      user_id: userId,
      contact_name: contact.name,
      contact_email: contact.email,
      contact_phone: contact.phone,
      source: 'phone' as const,
    }));

    const { data, error } = await supabase
      .from('contacts')
      .upsert(contactRecords, {
        onConflict: 'user_id,contact_phone',
        ignoreDuplicates: true,
      })
      .select();

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    // Sync with platform users after import
    await syncContactsWithPlatformUsers(userId);

    return { data: data as Contact[], error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Get all contacts for a user
 */
export async function getContacts(
  userId: string
): Promise<{ data: Contact[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('contact_name', { ascending: true });

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    return { data: data as Contact[], error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Link a contact to a platform user
 */
export async function linkContact(
  contactId: string,
  linkedUserId: string
): Promise<{ data: Contact | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .update({ linked_user_id: linkedUserId })
      .eq('id', contactId)
      .select()
      .single();

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    return { data: data as Contact, error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Update contact stats after a challenge completes
 */
export async function updateContactStats(
  contactId: string,
  result: 'win' | 'loss'
): Promise<{ data: Contact | null; error: string | null }> {
  try {
    const { data: contact, error: fetchError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (fetchError) {
      return { data: null, error: handleApiError(fetchError) };
    }

    const updates: Partial<Contact> = {
      total_challenges: (contact.total_challenges || 0) + 1,
    };

    if (result === 'win') {
      updates.wins_against = (contact.wins_against || 0) + 1;
    } else {
      updates.losses_against = (contact.losses_against || 0) + 1;
    }

    const { data, error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', contactId)
      .select()
      .single();

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    return { data: data as Contact, error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Search contacts by name, email, or phone
 */
export async function searchContacts(
  userId: string,
  query: string
): Promise<{ data: Contact[] | null; error: string | null }> {
  try {
    const searchTerm = `%${query}%`;

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .or(`contact_name.ilike.${searchTerm},contact_email.ilike.${searchTerm},contact_phone.ilike.${searchTerm}`)
      .order('contact_name', { ascending: true });

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    return { data: data as Contact[], error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Delete a contact
 */
export async function deleteContact(
  contactId: string
): Promise<{ data: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId);

    if (error) {
      return { data: false, error: handleApiError(error) };
    }

    return { data: true, error: null };
  } catch (error) {
    return { data: false, error: handleApiError(error) };
  }
}

/**
 * Sync contacts with platform users (match by email/phone)
 */
export async function syncContactsWithPlatformUsers(
  userId: string
): Promise<{ data: number; error: string | null }> {
  try {
    // Get all contacts for user
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .is('linked_user_id', null);

    if (contactsError) {
      return { data: 0, error: handleApiError(contactsError) };
    }

    if (!contacts || contacts.length === 0) {
      return { data: 0, error: null };
    }

    let linkedCount = 0;

    // Match contacts with profiles by email
    for (const contact of contacts) {
      if (contact.contact_email) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('email', contact.contact_email)
          .maybeSingle();

        if (!profileError && profile) {
          await linkContact(contact.id, profile.user_id);
          linkedCount++;
        }
      }
    }

    return { data: linkedCount, error: null };
  } catch (error) {
    return { data: 0, error: handleApiError(error) };
  }
}

/**
 * Add a contact manually
 */
export async function addContact(
  userId: string,
  contactData: ImportContactData
): Promise<{ data: Contact | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        user_id: userId,
        contact_name: contactData.name,
        contact_email: contactData.email,
        contact_phone: contactData.phone,
        source: 'manual',
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    // Try to link with platform user
    if (contactData.email) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', contactData.email)
        .maybeSingle();

      if (profile) {
        await linkContact(data.id, profile.user_id);
      }
    }

    return { data: data as Contact, error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Get contact by linked user ID
 */
export async function getContactByUserId(
  userId: string,
  linkedUserId: string
): Promise<{ data: Contact | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .eq('linked_user_id', linkedUserId)
      .maybeSingle();

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    return { data: data as Contact | null, error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Create contact from opponent after challenge
 */
export async function createContactFromOpponent(
  userId: string,
  opponentId: string
): Promise<{ data: Contact | null; error: string | null }> {
  try {
    // Check if contact already exists
    const { data: existing } = await getContactByUserId(userId, opponentId);
    if (existing) {
      return { data: existing, error: null };
    }

    // Get opponent profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email, avatar_url')
      .eq('user_id', opponentId)
      .single();

    if (profileError) {
      return { data: null, error: handleApiError(profileError) };
    }

    // Create contact
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        user_id: userId,
        contact_name: profile.full_name || 'Unknown User',
        contact_email: profile.email,
        contact_avatar_url: profile.avatar_url,
        linked_user_id: opponentId,
        source: 'challenged',
        total_challenges: 1,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    return { data: data as Contact, error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}
