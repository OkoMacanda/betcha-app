import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { toast } from './use-toast';
import {
  createGroupIndividualChallenge,
  createTeamChallenge,
  joinChallenge,
  leaveChallenge,
  startChallenge,
  submitChallengeResults,
  getChallengeParticipants,
  getChallengeTeams,
} from '@/lib/api/groupBetting.api';
import { GroupChallengeData, TeamChallengeData, ChallengeResults } from '@/types/social.types';

/**
 * Hook for group individual challenges
 */
export function useGroupChallenge(betId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch participants
  const {
    data: participants,
    isLoading: isLoadingParticipants,
    error: participantsError,
  } = useQuery({
    queryKey: ['challenge-participants', betId],
    queryFn: async () => {
      if (!betId) return [];
      const { data, error } = await getChallengeParticipants(betId);
      if (error) throw new Error(error);
      return data || [];
    },
    enabled: !!betId,
  });

  // Create challenge mutation
  const createMutation = useMutation({
    mutationFn: async (data: GroupChallengeData) => {
      if (!user) throw new Error('Not authenticated');
      const result = await createGroupIndividualChallenge(user.id, data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast({
        title: 'Challenge created',
        description: 'Your group challenge has been created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create challenge',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Join challenge mutation
  const joinMutation = useMutation({
    mutationFn: async (challengeBetId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await joinChallenge(challengeBetId, user.id);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Joined challenge',
        description: 'You have successfully joined the challenge',
      });
      if (betId) {
        queryClient.invalidateQueries({ queryKey: ['challenge-participants', betId] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to join',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Leave challenge mutation
  const leaveMutation = useMutation({
    mutationFn: async (challengeBetId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await leaveChallenge(challengeBetId, user.id);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Left challenge',
        description: 'You have left the challenge',
      });
      if (betId) {
        queryClient.invalidateQueries({ queryKey: ['challenge-participants', betId] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to leave',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Start challenge mutation
  const startMutation = useMutation({
    mutationFn: async (challengeBetId: string) => {
      const { data, error } = await startChallenge(challengeBetId);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Challenge started',
        description: 'The challenge has begun!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to start',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Submit results mutation
  const submitResultsMutation = useMutation({
    mutationFn: async (results: ChallengeResults) => {
      const { data, error } = await submitChallengeResults(results.bet_id, results);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Results submitted',
        description: 'Challenge has been completed',
      });
      if (betId) {
        queryClient.invalidateQueries({ queryKey: ['challenge-participants', betId] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to submit results',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    participants: participants || [],
    isLoadingParticipants,
    participantsError,
    createChallenge: createMutation.mutate,
    isCreating: createMutation.isPending,
    joinChallenge: joinMutation.mutate,
    isJoining: joinMutation.isPending,
    leaveChallenge: leaveMutation.mutate,
    isLeaving: leaveMutation.isPending,
    startChallenge: startMutation.mutate,
    isStarting: startMutation.isPending,
    submitResults: submitResultsMutation.mutate,
    isSubmitting: submitResultsMutation.isPending,
  };
}

/**
 * Hook for team challenges and tournaments
 */
export function useTeamChallenge(betId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch teams
  const {
    data: teams,
    isLoading: isLoadingTeams,
    error: teamsError,
  } = useQuery({
    queryKey: ['challenge-teams', betId],
    queryFn: async () => {
      if (!betId) return [];
      const { data, error } = await getChallengeTeams(betId);
      if (error) throw new Error(error);
      return data || [];
    },
    enabled: !!betId,
  });

  // Create team challenge mutation
  const createMutation = useMutation({
    mutationFn: async (data: TeamChallengeData) => {
      if (!user) throw new Error('Not authenticated');
      const result = await createTeamChallenge(user.id, data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast({
        title: 'Team challenge created',
        description: 'Your team challenge has been created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create challenge',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Join team mutation
  const joinTeamMutation = useMutation({
    mutationFn: async ({ challengeBetId, teamName }: { challengeBetId: string; teamName: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await joinChallenge(challengeBetId, user.id, teamName);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Joined team',
        description: 'You have successfully joined the team',
      });
      if (betId) {
        queryClient.invalidateQueries({ queryKey: ['challenge-teams', betId] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to join team',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Submit team results mutation
  const submitTeamResultsMutation = useMutation({
    mutationFn: async (results: ChallengeResults) => {
      const { data, error } = await submitChallengeResults(results.bet_id, results);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Results submitted',
        description: 'Challenge has been completed',
      });
      if (betId) {
        queryClient.invalidateQueries({ queryKey: ['challenge-teams', betId] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to submit results',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    teams: teams || [],
    isLoadingTeams,
    teamsError,
    createTeamChallenge: createMutation.mutate,
    isCreating: createMutation.isPending,
    joinTeam: joinTeamMutation.mutate,
    isJoiningTeam: joinTeamMutation.isPending,
    submitTeamResults: submitTeamResultsMutation.mutate,
    isSubmitting: submitTeamResultsMutation.isPending,
  };
}

/**
 * Hook for tournaments (3+ teams)
 */
export function useTournament(betId?: string) {
  // Tournament is essentially a team challenge with 3+ teams
  // Reuse team challenge hook
  return useTeamChallenge(betId);
}
