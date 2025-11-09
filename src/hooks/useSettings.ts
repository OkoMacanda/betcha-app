import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { toast } from './use-toast';
import {
  getUserSettings,
  updateUserSettings,
  createDefaultSettings,
} from '@/lib/api/settings.api';
import { UpdateSettingsInput } from '@/types/settings.types';

/**
 * Hook for managing user settings
 */
export function useSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user settings
  const {
    data: settings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await getUserSettings(user.id);

      if (error) {
        throw new Error(error);
      }

      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: UpdateSettingsInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await updateUserSettings(user.id, updates);

      if (error) throw new Error(error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings', user?.id] });
      toast({
        title: 'Settings updated',
        description: 'Your preferences have been saved successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update settings',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    settings,
    isLoading,
    error,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}
