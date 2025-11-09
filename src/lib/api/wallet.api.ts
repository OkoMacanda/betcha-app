import { supabase } from '@/integrations/supabase/client'
import { Transaction } from '@/types/database.types'
import { handleApiError } from '@/lib/error-handler'

export async function getWalletBalance(
  userId: string
): Promise<{ data: number | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (error) {
      return { data: null, error: handleApiError(error) }
    }

    return { data: data.balance, error: null }
  } catch (error) {
    return { data: null, error: handleApiError(error) }
  }
}

export async function getTransactions(
  userId: string
): Promise<{ data: Transaction[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: null, error: handleApiError(error) }
    }

    return { data: data || [], error: null }
  } catch (error) {
    return { data: null, error: handleApiError(error) }
  }
}

export async function deposit(
  userId: string,
  amount: number,
  paymentIntentId?: string
): Promise<{ data: Transaction | null; error: string | null }> {
  try {
    // Create transaction and update balance
    const { error: walletError } = await supabase.rpc('update_wallet_balance', {
      p_user_id: userId,
      p_amount: amount,
      p_transaction_type: 'deposit',
    })

    if (walletError) {
      return { data: null, error: handleApiError(walletError) }
    }

    // Get the created transaction
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'deposit')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      return { data: null, error: handleApiError(error) }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleApiError(error) }
  }
}

export async function withdraw(
  userId: string,
  amount: number
): Promise<{ data: Transaction | null; error: string | null }> {
  try {
    // Check KYC status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('kyc_status, balance')
      .eq('user_id', userId)
      .single()

    if (profileError) {
      return { data: null, error: handleApiError(profileError) }
    }

    if (profile.kyc_status !== 'verified') {
      return { data: null, error: 'KYC verification required for withdrawals' }
    }

    if (profile.balance < amount) {
      return { data: null, error: 'Insufficient balance' }
    }

    // Create withdrawal transaction and update balance
    const { error: walletError } = await supabase.rpc('update_wallet_balance', {
      p_user_id: userId,
      p_amount: -amount,
      p_transaction_type: 'withdrawal',
    })

    if (walletError) {
      return { data: null, error: handleApiError(walletError) }
    }

    // Get the created transaction
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'withdrawal')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      return { data: null, error: handleApiError(error) }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleApiError(error) }
  }
}
