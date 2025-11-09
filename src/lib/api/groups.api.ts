import { supabase } from '@/integrations/supabase/client';
import { FriendGroup, GroupMember, CreateGroupData } from '@/types/social.types';
import { handleApiError } from '@/lib/error-handler';

/**
 * Create a new friend group
 */
export async function createGroup(
  userId: string,
  data: CreateGroupData
): Promise<{ data: FriendGroup | null; error: string | null }> {
  try {
    // Create the group
    const { data: group, error: groupError } = await supabase
      .from('friend_groups')
      .insert({
        owner_id: userId,
        name: data.name,
        description: data.description,
        member_count: (data.memberIds?.length || 0) + 1, // +1 for owner
      })
      .select()
      .single();

    if (groupError) {
      return { data: null, error: handleApiError(groupError) };
    }

    // Add owner as member
    await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: userId,
      role: 'owner',
    });

    // Add other members if provided
    if (data.memberIds && data.memberIds.length > 0) {
      const members = data.memberIds.map(memberId => ({
        group_id: group.id,
        user_id: memberId,
        role: 'member',
      }));

      await supabase.from('group_members').insert(members);
    }

    return { data: group as FriendGroup, error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Get all groups for a user (owned + member of)
 */
export async function getGroups(
  userId: string
): Promise<{ data: FriendGroup[] | null; error: string | null }> {
  try {
    // Get groups where user is owner or member
    const { data, error } = await supabase
      .from('friend_groups')
      .select('*')
      .or(`owner_id.eq.${userId},id.in.(select group_id from group_members where user_id='${userId}')`)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    return { data: data as FriendGroup[], error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Get a specific group by ID
 */
export async function getGroup(
  groupId: string
): Promise<{ data: FriendGroup | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('friend_groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    return { data: data as FriendGroup, error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Get all members of a group
 */
export async function getGroupMembers(
  groupId: string
): Promise<{ data: GroupMember[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        *,
        profile:user_id (
          full_name,
          avatar_url
        )
      `)
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    return { data: data as unknown as GroupMember[], error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Add a member to a group
 */
export async function addGroupMember(
  groupId: string,
  userId: string,
  role: 'admin' | 'member' = 'member'
): Promise<{ data: GroupMember | null; error: string | null }> {
  try {
    // Check if member already exists
    const { data: existing } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return { data: existing as GroupMember, error: 'User is already a member' };
    }

    // Add member
    const { data, error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: userId,
        role,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    // Update group member count
    await supabase.rpc('increment', {
      table_name: 'friend_groups',
      row_id: groupId,
      column_name: 'member_count',
    });

    return { data: data as GroupMember, error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Remove a member from a group
 */
export async function removeGroupMember(
  groupId: string,
  userId: string
): Promise<{ data: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) {
      return { data: false, error: handleApiError(error) };
    }

    // Update group member count
    const { data: group } = await supabase
      .from('friend_groups')
      .select('member_count')
      .eq('id', groupId)
      .single();

    if (group && group.member_count > 0) {
      await supabase
        .from('friend_groups')
        .update({ member_count: group.member_count - 1 })
        .eq('id', groupId);
    }

    return { data: true, error: null };
  } catch (error) {
    return { data: false, error: handleApiError(error) };
  }
}

/**
 * Update a group
 */
export async function updateGroup(
  groupId: string,
  data: Partial<CreateGroupData>
): Promise<{ data: FriendGroup | null; error: string | null }> {
  try {
    const updates: any = {};
    if (data.name) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;

    const { data: updatedGroup, error } = await supabase
      .from('friend_groups')
      .update(updates)
      .eq('id', groupId)
      .select()
      .single();

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    return { data: updatedGroup as FriendGroup, error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Delete a group
 */
export async function deleteGroup(
  groupId: string
): Promise<{ data: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('friend_groups')
      .delete()
      .eq('id', groupId);

    if (error) {
      return { data: false, error: handleApiError(error) };
    }

    return { data: true, error: null };
  } catch (error) {
    return { data: false, error: handleApiError(error) };
  }
}

/**
 * Check if user is member of a group
 */
export async function isGroupMember(
  groupId: string,
  userId: string
): Promise<{ data: boolean; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return { data: false, error: handleApiError(error) };
    }

    return { data: !!data, error: null };
  } catch (error) {
    return { data: false, error: handleApiError(error) };
  }
}

/**
 * Get group member IDs only (for quick lookups)
 */
export async function getGroupMemberIds(
  groupId: string
): Promise<{ data: string[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    return { data: data.map(m => m.user_id), error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}
