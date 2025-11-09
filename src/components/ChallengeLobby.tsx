import { useQuery } from '@tanstack/react-query';
import { User, CheckCircle, Clock, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getChallengeParticipants } from '@/lib/api/groupBetting.api';
import { useGroupChallenge } from '@/hooks/useGroupBetting';

interface ChallengeLobbyProps {
  betId: string;
  minParticipants: number;
  maxParticipants?: number;
  isOwner: boolean;
  onInvite: () => void;
}

export default function ChallengeLobby({
  betId,
  minParticipants,
  maxParticipants,
  isOwner,
  onInvite,
}: ChallengeLobbyProps) {
  const { participants, startChallenge, leaveChallenge, isStarting } = useGroupChallenge(betId);

  const canStart = participants.length >= minParticipants;
  const isFull = maxParticipants ? participants.length >= maxParticipants : false;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Challenge Lobby</h3>
          <p className="text-sm text-muted-foreground">
            {participants.length} / {maxParticipants || '∞'} participants
            {!canStart && ` (min ${minParticipants} needed)`}
          </p>
        </div>
        {!isFull && (
          <Button onClick={onInvite} variant="outline" size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite More
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {participants.map((participant) => (
          <div key={participant.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
            <Avatar className="h-10 w-10">
              <AvatarImage src={participant.profile?.avatar_url} />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{participant.profile?.full_name || 'Unknown'}</p>
              <p className="text-sm text-muted-foreground">R{participant.escrow_amount}</p>
            </div>
            {participant.entry_paid ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Paid
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                Pending
              </Badge>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {isOwner && (
          <Button
            onClick={() => startChallenge(betId)}
            disabled={!canStart || isStarting}
            className="flex-1"
          >
            {isStarting ? 'Starting...' : 'Start Challenge'}
          </Button>
        )}
        <Button
          onClick={() => leaveChallenge(betId)}
          variant="outline"
          className={isOwner ? '' : 'flex-1'}
        >
          Leave
        </Button>
      </div>

      {!canStart && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Need {minParticipants - participants.length} more participant(s) to start
        </p>
      )}
    </Card>
  );
}
