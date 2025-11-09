import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';
import { paymentManager, type Currency, type BankAccount } from '@/lib/payment-enhanced';
import { useState, useEffect } from 'react';

export interface Transaction {
  id: string;
  user_id: string;
  bet_id: string | null;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'bet_placed' | 'bet_won' | 'bet_lost' | 'refund' | 'platform_fee';
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  wallet_balance: number;
  kyc_status: 'pending' | 'verified' | 'rejected';
  total_bets: number;
  total_wins: number;
  total_earnings: number;
  created_at: string;
  updated_at: string;
}

export function useWallet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currency, setCurrency] = useState<Currency>('ZAR'); // Default to South African Rand

  // Initialize payment provider when currency changes
  useEffect(() => {
    paymentManager.initializeProvider(undefined, currency).catch(console.error);
  }, [currency]);

  // Fetch user profile (includes wallet balance)
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user,
  });

  // Fetch transaction history
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });

  // Deposit mutation with payment integration
  const depositMutation = useMutation({
    mutationFn: async ({ amount }: { amount: number }) => {
      if (!user) throw new Error('User not authenticated');
      if (!profile?.email) throw new Error('User email not found');

      // Create a pending transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount,
          type: 'deposit',
          status: 'pending',
        })
        .select()
        .single();

      if (txError) throw txError;

      // Initialize payment provider
      await paymentManager.initializeProvider(undefined, currency);

      // Create payment intent
      const provider = paymentManager.getProvider();
      const paymentIntent = await provider.initializeDeposit(
        amount,
        profile.email,
        user.id,
        currency
      );

      // Open payment popup
      return new Promise<Transaction>((resolve, reject) => {
        paymentManager.openPaymentPopup(
          amount,
          profile.email!,
          paymentIntent.reference,
          async (reference) => {
            // Payment successful - verify and update balance
            try {
              const verification = await provider.verifyPayment(reference);

              if (verification.success) {
                // Update wallet balance
                const { error: updateError } = await supabase
                  .from('profiles')
                  .update({
                    wallet_balance: (profile?.wallet_balance || 0) + amount,
                  })
                  .eq('user_id', user.id);

                if (updateError) throw updateError;

                // Update transaction status
                await supabase
                  .from('transactions')
                  .update({ status: 'completed' })
                  .eq('id', transaction.id);

                resolve(transaction);
              } else {
                throw new Error('Payment verification failed');
              }
            } catch (error) {
              // Mark transaction as failed
              await supabase
                .from('transactions')
                .update({ status: 'failed' })
                .eq('id', transaction.id);
              reject(error);
            }
          },
          () => {
            // User closed popup - mark as cancelled
            supabase
              .from('transactions')
              .update({ status: 'failed' })
              .eq('id', transaction.id);
            reject(new Error('Payment cancelled'));
          },
          (error) => {
            // Payment error
            supabase
              .from('transactions')
              .update({ status: 'failed' })
              .eq('id', transaction.id);
            reject(error);
          }
        );
      });
    },
    onSuccess: () => {
      toast({
        title: 'Deposit successful',
        description: 'Your wallet has been credited.',
      });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Deposit failed',
        description: error.message || 'An error occurred during deposit',
        variant: 'destructive',
      });
    },
  });

  // Withdrawal mutation with payment integration
  const withdrawalMutation = useMutation({
    mutationFn: async ({ amount, bankAccount }: { amount: number; bankAccount?: BankAccount }) => {
      if (!user) throw new Error('User not authenticated');
      if (!profile) throw new Error('Profile not found');

      // Check KYC status
      if (profile.kyc_status !== 'verified') {
        throw new Error('KYC verification required for withdrawals');
      }

      // Check sufficient balance
      if (profile.wallet_balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Create a pending transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: -amount, // Negative for withdrawal
          type: 'withdrawal',
          status: 'pending',
        })
        .select()
        .single();

      if (txError) throw txError;

      // Initialize payment provider
      await paymentManager.initializeProvider(undefined, currency);

      // For production: Use provided bank account or fetch from user profile
      const userBankAccount: BankAccount = bankAccount || {
        accountNumber: '', // Should be stored in user profile
        accountName: profile.full_name || '',
        bankCode: '',
        bankName: '',
      };

      // Initiate withdrawal via payment provider
      const provider = paymentManager.getProvider();
      const payoutIntent = await provider.initializeWithdrawal(
        amount,
        userBankAccount,
        currency
      );

      // Deduct from wallet balance immediately (pending confirmation)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          wallet_balance: profile.wallet_balance - amount,
        })
        .eq('user_id', user.id);

      if (updateError) {
        // Rollback transaction
        await supabase
          .from('transactions')
          .update({ status: 'failed' })
          .eq('id', transaction.id);
        throw updateError;
      }

      // Transaction will be confirmed by webhook
      // Status remains 'pending' until backend confirms payout
      return { transaction, payoutIntent };
    },
    onSuccess: (data) => {
      toast({
        title: 'Withdrawal initiated',
        description: data.payoutIntent.message || 'Your withdrawal is being processed.',
      });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Withdrawal failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    profile,
    balance: profile?.wallet_balance ?? null,
    transactions,
    isLoading: profileLoading || transactionsLoading,
    deposit: depositMutation.mutate,
    withdraw: withdrawalMutation.mutate,
    isDepositing: depositMutation.isPending,
    isWithdrawing: withdrawalMutation.isPending,
    currency,
    setCurrency,
    providerType: paymentManager.getProviderType(),
  };
}
