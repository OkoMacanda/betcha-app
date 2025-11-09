import { supabase } from '@/integrations/supabase/client';
import { ChallengeInvite, SendInviteData } from '@/types/social.types';
import { handleApiError } from '@/lib/error-handler';

/**
 * Generate a unique invite token
 */
function generateInviteToken(): string {
  return `inv_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Send an email invitation
 */
export async function sendEmailInvite(
  betId: string,
  inviterId: string,
  inviteeEmail: string
): Promise<{ data: ChallengeInvite | null; error: string | null }> {
  try {
    const inviteToken = generateInviteToken();

    // Check if invitee is already a platform user
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', inviteeEmail)
      .maybeSingle();

    // Create invite record
    const { data, error } = await supabase
      .from('challenge_invites')
      .insert({
        bet_id: betId,
        inviter_id: inviterId,
        invitee_email: inviteeEmail,
        invitee_user_id: existingUser?.user_id,
        invite_method: 'email',
        invite_token: inviteToken,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    // TODO: Send actual email via email service
    // For now, just log the invite URL
    const inviteUrl = `${window.location.origin}/challenge/invite/${inviteToken}`;
    console.log('Email invite URL:', inviteUrl);

    // In production, you would send email via SendGrid, AWS SES, etc.
    // await sendEmail({
    //   to: inviteeEmail,
    //   subject: 'You\'ve been challenged on Betcha!',
    //   html: `Click here to accept: ${inviteUrl}`
    // });

    return { data: data as ChallengeInvite, error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Send an SMS invitation
 */
export async function sendSMSInvite(
  betId: string,
  inviterId: string,
  inviteePhone: string
): Promise<{ data: ChallengeInvite | null; error: string | null }> {
  try {
    const inviteToken = generateInviteToken();

    // Create invite record
    const { data, error } = await supabase
      .from('challenge_invites')
      .insert({
        bet_id: betId,
        inviter_id: inviterId,
        invitee_phone: inviteePhone,
        invite_method: 'sms',
        invite_token: inviteToken,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    // TODO: Send actual SMS via Twilio
    const inviteUrl = `${window.location.origin}/challenge/invite/${inviteToken}`;
    console.log('SMS invite URL:', inviteUrl);

    // In production, integrate with Twilio:
    // const twilio = require('twilio')(accountSid, authToken);
    // await twilio.messages.create({
    //   body: `You've been challenged on Betcha! Accept here: ${inviteUrl}`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: inviteePhone
    // });

    return { data: data as ChallengeInvite, error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Send an in-app invitation
 */
export async function sendInAppInvite(
  betId: string,
  inviterId: string,
  inviteeUserId: string
): Promise<{ data: ChallengeInvite | null; error: string | null }> {
  try {
    const inviteToken = generateInviteToken();

    // Create invite record
    const { data, error } = await supabase
      .from('challenge_invites')
      .insert({
        bet_id: betId,
        inviter_id: inviterId,
        invitee_user_id: inviteeUserId,
        invite_method: 'in_app',
        invite_token: inviteToken,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    // TODO: Create in-app notification
    // await createNotification({
    //   user_id: inviteeUserId,
    //   type: 'challenge_invite',
    //   data: { bet_id: betId, invite_id: data.id }
    // });

    return { data: data as ChallengeInvite, error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Get an invite by token
 */
export async function getInviteByToken(
  token: string
): Promise<{ data: ChallengeInvite | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('challenge_invites')
      .select('*')
      .eq('invite_token', token)
      .single();

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    // Check if expired
    const invite = data as ChallengeInvite;
    if (new Date(invite.expires_at) < new Date()) {
      // Mark as expired
      await supabase
        .from('challenge_invites')
        .update({ status: 'expired' })
        .eq('id', invite.id);

      return { data: null, error: 'Invite has expired' };
    }

    return { data: invite, error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Accept an invite
 */
export async function acceptInvite(
  token: string,
  userId: string
): Promise<{ data: ChallengeInvite | null; error: string | null }> {
  try {
    // Get invite
    const { data: invite, error: getError } = await getInviteByToken(token);
    if (getError || !invite) {
      return { data: null, error: getError || 'Invite not found' };
    }

    // Check if already accepted
    if (invite.status === 'accepted') {
      return { data: null, error: 'Invite already accepted' };
    }

    // Update invite status
    const { data, error } = await supabase
      .from('challenge_invites')
      .update({
        status: 'accepted',
        invitee_user_id: userId,
        responded_at: new Date().toISOString(),
      })
      .eq('id', invite.id)
      .select()
      .single();

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    // TODO: Update bet with opponent
    // await supabase
    //   .from('bets')
    //   .update({ opponent_id: userId, status: 'active' })
    //   .eq('id', invite.bet_id);

    return { data: data as ChallengeInvite, error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Decline an invite
 */
export async function declineInvite(
  token: string
): Promise<{ data: ChallengeInvite | null; error: string | null }> {
  try {
    const { data: invite, error: getError } = await getInviteByToken(token);
    if (getError || !invite) {
      return { data: null, error: getError || 'Invite not found' };
    }

    const { data, error } = await supabase
      .from('challenge_invites')
      .update({
        status: 'declined',
        responded_at: new Date().toISOString(),
      })
      .eq('id', invite.id)
      .select()
      .single();

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    return { data: data as ChallengeInvite, error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Resend an invite
 */
export async function resendInvite(
  inviteId: string
): Promise<{ data: ChallengeInvite | null; error: string | null }> {
  try {
    // Get existing invite
    const { data: invite, error: getError } = await supabase
      .from('challenge_invites')
      .select('*')
      .eq('id', inviteId)
      .single();

    if (getError) {
      return { data: null, error: handleApiError(getError) };
    }

    // Generate new token and extend expiry
    const newToken = generateInviteToken();
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 7);

    const { data, error } = await supabase
      .from('challenge_invites')
      .update({
        invite_token: newToken,
        expires_at: newExpiry.toISOString(),
        status: 'pending',
      })
      .eq('id', inviteId)
      .select()
      .single();

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    // Resend via original method
    const updatedInvite = data as ChallengeInvite;
    if (updatedInvite.invite_method === 'email' && updatedInvite.invitee_email) {
      // Resend email (placeholder)
      console.log('Resending email invite');
    } else if (updatedInvite.invite_method === 'sms' && updatedInvite.invitee_phone) {
      // Resend SMS (placeholder)
      console.log('Resending SMS invite');
    }

    return { data: updatedInvite, error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Get all invites sent by a user
 */
export async function getSentInvites(
  userId: string
): Promise<{ data: ChallengeInvite[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('challenge_invites')
      .select('*')
      .eq('inviter_id', userId)
      .order('sent_at', { ascending: false });

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    return { data: data as ChallengeInvite[], error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Get all invites received by a user
 */
export async function getReceivedInvites(
  userId: string
): Promise<{ data: ChallengeInvite[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('challenge_invites')
      .select('*')
      .eq('invitee_user_id', userId)
      .order('sent_at', { ascending: false });

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    return { data: data as ChallengeInvite[], error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

/**
 * Get pending invites for a bet
 */
export async function getBetInvites(
  betId: string
): Promise<{ data: ChallengeInvite[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('challenge_invites')
      .select('*')
      .eq('bet_id', betId)
      .order('sent_at', { ascending: false });

    if (error) {
      return { data: null, error: handleApiError(error) };
    }

    return { data: data as ChallengeInvite[], error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}
