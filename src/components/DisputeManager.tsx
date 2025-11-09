import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, MessageSquare, Shield, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface DisputeManagerProps {
  betId: string;
  userId: string;
  userRole: 'creator' | 'opponent';
}

interface Dispute {
  id: string;
  bet_id: string;
  raised_by: string;
  reason: string;
  status: 'open' | 'under_review' | 'resolved' | 'rejected';
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
}

interface RefDecision {
  id: string;
  bet_id: string;
  decision_type: 'auto_resolve' | 'needs_evidence' | 'needs_human' | 'disputed';
  winner_id: string | null;
  confidence_score: number;
  reasoning: string;
  created_at: string;
}

export function DisputeManager({ betId, userId, userRole }: DisputeManagerProps) {
  const [disputeReason, setDisputeReason] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch disputes for this bet
  const { data: disputes, isLoading: disputesLoading } = useQuery({
    queryKey: ['disputes', betId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disputes')
        .select('*')
        .eq('bet_id', betId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Dispute[];
    },
  });

  // Fetch REF AI decision
  const { data: refDecision } = useQuery({
    queryKey: ['ref-decision', betId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ref_decisions')
        .select('*')
        .eq('bet_id', betId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data as RefDecision | null;
    },
  });

  // Create dispute mutation
  const createDisputeMutation = useMutation({
    mutationFn: async (reason: string) => {
      const { data, error } = await supabase
        .from('disputes')
        .insert({
          bet_id: betId,
          raised_by: userId,
          reason: reason,
          status: 'open',
        })
        .select()
        .single();

      if (error) throw error;

      // Also update bet status to 'disputed'
      await supabase
        .from('bets')
        .update({ status: 'disputed' })
        .eq('id', betId);

      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Dispute raised',
        description: 'Your dispute has been submitted for review',
      });
      queryClient.invalidateQueries({ queryKey: ['disputes', betId] });
      setDisputeReason('');
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to raise dispute',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleRaiseDispute = () => {
    if (!disputeReason.trim()) {
      toast({
        title: 'Reason required',
        description: 'Please provide a reason for the dispute',
        variant: 'destructive',
      });
      return;
    }

    createDisputeMutation.mutate(disputeReason);
  };

  const getStatusBadge = (status: Dispute['status']) => {
    const variants: Record<Dispute['status'], { variant: 'default' | 'secondary' | 'destructive'; icon: any }> = {
      open: { variant: 'secondary', icon: Clock },
      under_review: { variant: 'default', icon: Shield },
      resolved: { variant: 'default', icon: CheckCircle2 },
      rejected: { variant: 'destructive', icon: XCircle },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 95) return <Badge className="bg-green-500">High ({confidence}%)</Badge>;
    if (confidence >= 70) return <Badge className="bg-yellow-500">Medium ({confidence}%)</Badge>;
    return <Badge className="bg-red-500">Low ({confidence}%)</Badge>;
  };

  if (disputesLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const hasActiveDispute = disputes?.some((d) => d.status === 'open' || d.status === 'under_review');

  return (
    <div className="space-y-4">
      {/* REF AI Decision Card */}
      {refDecision && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <CardTitle>REF AI Decision</CardTitle>
              </div>
              {getConfidenceBadge(refDecision.confidence_score)}
            </div>
            <CardDescription>Automated decision based on submitted evidence</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Decision Type:</p>
              <Badge>{refDecision.decision_type.replace('_', ' ')}</Badge>
            </div>

            {refDecision.winner_id && (
              <div>
                <p className="text-sm font-medium mb-1">Winner Determined:</p>
                <p className="text-sm text-muted-foreground">User ID: {refDecision.winner_id}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-1">Reasoning:</p>
              <p className="text-sm text-muted-foreground">{refDecision.reasoning}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Decision made: {format(new Date(refDecision.created_at), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>

            {refDecision.confidence_score < 95 && !hasActiveDispute && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This decision has {refDecision.confidence_score < 70 ? 'low' : 'medium'} confidence.
                  If you disagree with the outcome, you can raise a dispute.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Disputes Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Disputes</CardTitle>
            {!hasActiveDispute && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Raise Dispute
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Raise a Dispute</DialogTitle>
                    <DialogDescription>
                      Explain why you disagree with the bet outcome or REF AI decision
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Describe your reason for disputing this bet..."
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      rows={6}
                    />
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Disputes are reviewed by our moderation team. False disputes may result in
                        penalties.
                      </AlertDescription>
                    </Alert>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRaiseDispute}
                      disabled={createDisputeMutation.isPending}
                    >
                      {createDisputeMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Submit Dispute
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <CardDescription>
            {disputes && disputes.length > 0
              ? `${disputes.length} dispute${disputes.length > 1 ? 's' : ''} raised`
              : 'No disputes raised yet'}
          </CardDescription>
        </CardHeader>

        {disputes && disputes.length > 0 && (
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="open">
                  Open ({disputes.filter((d) => d.status === 'open' || d.status === 'under_review').length})
                </TabsTrigger>
                <TabsTrigger value="resolved">
                  Resolved ({disputes.filter((d) => d.status === 'resolved' || d.status === 'rejected').length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {disputes.map((dispute) => (
                  <Card key={dispute.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(dispute.created_at), 'MMM dd, yyyy HH:mm')}
                          </span>
                          {getStatusBadge(dispute.status)}
                        </div>
                        <p className="text-sm">{dispute.reason}</p>
                        {dispute.resolution && (
                          <div className="mt-2 p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-1">Resolution:</p>
                            <p className="text-sm">{dispute.resolution}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="open" className="space-y-4">
                {disputes
                  .filter((d) => d.status === 'open' || d.status === 'under_review')
                  .map((dispute) => (
                    <Card key={dispute.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(dispute.created_at), 'MMM dd, yyyy HH:mm')}
                            </span>
                            {getStatusBadge(dispute.status)}
                          </div>
                          <p className="text-sm">{dispute.reason}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>

              <TabsContent value="resolved" className="space-y-4">
                {disputes
                  .filter((d) => d.status === 'resolved' || d.status === 'rejected')
                  .map((dispute) => (
                    <Card key={dispute.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(dispute.created_at), 'MMM dd, yyyy HH:mm')}
                            </span>
                            {getStatusBadge(dispute.status)}
                          </div>
                          <p className="text-sm">{dispute.reason}</p>
                          {dispute.resolution && (
                            <div className="mt-2 p-3 bg-muted rounded-lg">
                              <p className="text-sm font-medium mb-1">Resolution:</p>
                              <p className="text-sm">{dispute.resolution}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default DisputeManager;
