import { useState } from 'react';
import { Repeat } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { rechallenge } from '@/lib/api/challengeHistory.api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface RechallengeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalBetId: string;
  originalBetData: {
    game_name: string;
    bet_amount: number;
    game_rules?: string;
    opponent_name: string;
  };
}

export default function RechallengeModal({
  open,
  onOpenChange,
  originalBetId,
  originalBetData,
}: RechallengeModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState(originalBetData.bet_amount.toString());
  const [rules, setRules] = useState(originalBetData.game_rules || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await rechallenge(originalBetId, user.id);
      if (error) throw new Error(error);

      toast({
        title: 'Challenge sent!',
        description: `Rechallenge sent to ${originalBetData.opponent_name}`,
      });

      if (data?.betId) {
        navigate(`/bet/${data.betId}`);
      }

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Failed to send challenge',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Rechallenge {originalBetData.opponent_name}
          </DialogTitle>
          <DialogDescription>
            Challenge {originalBetData.opponent_name} to another {originalBetData.game_name} match
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Bet Amount (R)</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="rules">Rules (Optional)</Label>
            <Textarea
              id="rules"
              placeholder="Same as last time?"
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              rows={3}
            />
          </div>

          <div className="rounded-lg bg-muted p-3 space-y-1">
            <p className="text-sm font-medium">Summary</p>
            <p className="text-sm text-muted-foreground">Game: {originalBetData.game_name}</p>
            <p className="text-sm text-muted-foreground">
              Amount: R{parseFloat(amount || '0').toFixed(2)}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!amount || isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Challenge'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
