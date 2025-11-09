import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/useCurrency';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/components/Navigation';
import EvidenceSubmission from '@/components/EvidenceSubmission';
import DisputeManager from '@/components/DisputeManager';
import RechallengeModal from '@/components/RechallengeModal';
import ChallengeLobby from '@/components/ChallengeLobby';
import { FloatingScoreWidget } from '@/components/FloatingScoreWidget';
import { DisputeResolution } from '@/components/DisputeResolution';
import {
  Loader2,
  ArrowLeft,
  Trophy,
  DollarSign,
  Clock,
  Users,
  Shield,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Timer,
  Repeat,
  UserPlus,
  Zap
} from 'lucide-react';
import { acceptBet, rejectBet } from '@/lib/api/bets.api';
import { useContacts } from '@/hooks/useContacts';
import { useGroupChallenge } from '@/hooks/useGroupBetting';

interface Bet {
  id: string;
  creator_id: string;
  opponent_id: string;
  game_name: string;
  bet_amount: number;
  game_rules: string;
  duration: string;
  status: string;
  winner_id?: string;
  created_at: string;
  game_rule_id?: string;
  win_condition?: any;
  evidence_required?: string[];
  live_tracking_enabled?: boolean;
  captain_creator?: string;
  captain_opponent?: string;
  current_score?: any;
  creator: {
    email: string;
  } | null;
  opponent: {
    email: string;
  } | null;
}

interface Evidence {
  id: string;
  bet_id: string;
  user_id: string;
  evidence_type: string;
  evidence_url: string;
  description: string;
  submitted_at: string;
  status: string;
}

interface Dispute {
  id: string;
  bet_id: string;
  raised_by_user_id: string;
  reason: string;
  status: string;
  created_at: string;
  resolved_at?: string;
  resolution?: string;
}

const BetDetail = () => {
  const { betId } = useParams<{ betId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { format: formatCurrency } = useCurrency();
  const { addContact } = useContacts();
  const { participants } = useGroupChallenge(betId);

  const [bet, setBet] = useState<Bet | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRechallengeModal, setShowRechallengeModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showLiveWidget, setShowLiveWidget] = useState(false);
  const [isEnablingTracking, setIsEnablingTracking] = useState(false);

  useEffect(() => {
    if (betId) {
      fetchBetDetails();
      fetchEvidence();
      fetchDisputes();
    }
  }, [betId]);

  const fetchBetDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('bets')
        .select(`
          *,
          creator:profiles!bets_creator_id_fkey(email),
          opponent:profiles!bets_opponent_id_fkey(email)
        `)
        .eq('id', betId)
        .single();

      if (error) throw error;
      setBet(data);
    } catch (error: any) {
      console.error('Error fetching bet:', error);
      toast({
        title: 'Failed to load bet',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvidence = async () => {
    try {
      const { data, error } = await supabase
        .from('evidence')
        .select('*')
        .eq('bet_id', betId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setEvidence(data || []);
    } catch (error: any) {
      console.error('Error fetching evidence:', error);
    }
  };

  const fetchDisputes = async () => {
    try {
      const { data, error } = await supabase
        .from('disputes')
        .select('*')
        .eq('bet_id', betId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDisputes(data || []);
    } catch (error: any) {
      console.error('Error fetching disputes:', error);
    }
  };

  const handleAcceptBet = async () => {
    if (!bet || !user) return;

    setIsAccepting(true);
    try {
      const { success, error } = await acceptBet(bet.id, user.id, bet.bet_amount);

      if (!success || error) {
        throw new Error(error || 'Failed to accept bet');
      }

      toast({
        title: 'Bet Accepted!',
        description: 'Your funds are locked in escrow. The game can now begin.',
      });

      await fetchBetDetails();
    } catch (error: any) {
      console.error('Error accepting bet:', error);
      toast({
        title: 'Failed to Accept Bet',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRejectBet = async () => {
    if (!bet || !user) return;

    setIsRejecting(true);
    try {
      const { success, error } = await rejectBet(bet.id);

      if (!success || error) {
        throw new Error(error || 'Failed to reject bet');
      }

      toast({
        title: 'Bet Rejected',
        description: 'The bet has been cancelled and funds returned.',
      });

      setTimeout(() => navigate('/active-bets'), 1500);
    } catch (error: any) {
      console.error('Error rejecting bet:', error);
      toast({
        title: 'Failed to Reject Bet',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const handleAddToContacts = async (opponentId: string, opponentEmail: string) => {
    if (!user) return;

    try {
      await addContact(user.id, {
        contact_name: opponentEmail.split('@')[0],
        contact_email: opponentEmail,
        linked_user_id: opponentId,
        source: 'challenged',
      });

      toast({
        title: 'Contact Added',
        description: 'Opponent added to your contacts.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to Add Contact',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEnableLiveTracking = async () => {
    if (!bet || !user) return;

    setIsEnablingTracking(true);

    try {
      // Set current user as captain for their team
      const updates: any = {
        live_tracking_enabled: true,
      };

      if (isCreator) {
        updates.captain_creator = user.id;
      } else if (isOpponent) {
        updates.captain_opponent = user.id;
      }

      const { error } = await supabase
        .from('bets')
        .update(updates)
        .eq('id', bet.id);

      if (error) throw error;

      toast({
        title: 'Live tracking enabled',
        description: 'You can now update scores in real-time',
      });

      setShowLiveWidget(true);
      await fetchBetDetails();
    } catch (error: any) {
      toast({
        title: 'Failed to enable tracking',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsEnablingTracking(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Timer className="w-3 h-3" />Pending</Badge>;
      case 'active':
        return <Badge className="bg-blue-500 gap-1"><Clock className="w-3 h-3" />Active</Badge>;
      case 'completed':
        return <Badge className="bg-green-500 gap-1"><CheckCircle2 className="w-3 h-3" />Completed</Badge>;
      case 'disputed':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" />Disputed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="gap-1"><XCircle className="w-3 h-3" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!bet) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Bet not found</AlertDescription>
          </Alert>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/active-bets')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Active Bets
          </Button>
        </div>
      </div>
    );
  }

  const isCreator = user?.id === bet.creator_id;
  const isOpponent = user?.id === bet.opponent_id;
  const isParticipant = isCreator || isOpponent;
  const opponentId = isCreator ? bet.opponent_id : bet.creator_id;
  const opponentEmail = isCreator
    ? (bet.opponent?.email || "Open Challenge")
    : (bet.creator?.email || "Unknown");
  const isCompleted = bet.status === 'completed';
  const isCancelled = bet.status === 'cancelled';
  const canRechallenge = (isCompleted || isCancelled) && isParticipant;
  const isCaptain = (isCreator && bet.captain_creator === user?.id) || (isOpponent && bet.captain_opponent === user?.id);
  const teamSide = isCreator ? 'creator' : 'opponent';
  const canEnableLiveTracking = bet.status === 'active' && isParticipant && !bet.live_tracking_enabled;

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => navigate('/active-bets')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Active Bets
          </Button>
          <div className="flex gap-2">
            {canEnableLiveTracking && (
              <Button
                variant="outline"
                onClick={handleEnableLiveTracking}
                disabled={isEnablingTracking}
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
              >
                {isEnablingTracking ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Enable Live Tracking
              </Button>
            )}
            {bet.live_tracking_enabled && (
              <Button
                variant="outline"
                onClick={() => setShowLiveWidget(!showLiveWidget)}
                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
              >
                <Zap className="w-4 h-4 mr-2" />
                {showLiveWidget ? 'Hide' : 'Show'} Live Score
              </Button>
            )}
            {canRechallenge && (
              <Button
                variant="outline"
                onClick={() => setShowRechallengeModal(true)}
              >
                <Repeat className="w-4 h-4 mr-2" />
                Rechallenge
              </Button>
            )}
            {isParticipant && opponentId && (
              <Button
                variant="outline"
                onClick={() => handleAddToContacts(opponentId, opponentEmail)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add to Contacts
              </Button>
            )}
          </div>
        </div>

        {/* Bet Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl flex items-center gap-3">
                  <Trophy className="w-8 h-8 text-primary" />
                  {bet.game_name}
                </CardTitle>
                <CardDescription className="mt-2 text-base">
                  Created {new Date(bet.created_at).toLocaleDateString()}
                </CardDescription>
              </div>
              {getStatusBadge(bet.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Participants */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">Creator</span>
                    {isCreator && <Badge variant="outline">You</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{bet.creator?.email || "Unknown"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">Opponent</span>
                    {isOpponent && <Badge variant="outline">You</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{bet.opponent?.email || "Open Challenge"}</p>
                </CardContent>
              </Card>
            </div>

            {/* Bet Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Bet Amount</p>
                  <p className="text-lg font-semibold">{formatCurrency(bet.bet_amount)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-lg font-semibold">{bet.duration}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Escrow Status</p>
                  <p className="text-lg font-semibold">
                    {bet.status === 'active' ? 'Locked' : bet.status === 'completed' ? 'Released' : 'Pending'}
                  </p>
                </div>
              </div>
            </div>

            {/* Game Rules */}
            <div>
              <h3 className="font-semibold mb-2">Game Rules</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{bet.game_rules}</p>
            </div>

            {/* Pending Bet Actions */}
            {bet.status === 'pending' && isOpponent && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-3">You've been challenged to a bet!</p>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleAcceptBet}
                      disabled={isAccepting || isRejecting}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      {isAccepting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Accepting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Accept Bet
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleRejectBet}
                      disabled={isAccepting || isRejecting}
                    >
                      {isRejecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </>
                      )}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {bet.status === 'pending' && isCreator && (
              <Alert>
                <Timer className="h-4 w-4" />
                <AlertDescription>
                  Waiting for {bet.opponent?.email || "an opponent"} to accept your bet challenge.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Group Challenge Lobby */}
        {bet.status === 'pending' && bet.challenge_type && bet.challenge_type !== 'one_on_one' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Challenge Lobby</CardTitle>
              <CardDescription>
                Waiting for participants to join
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChallengeLobby
                betId={bet.id}
                minParticipants={bet.challenge_type === 'group_individual' ? 3 : 4}
                maxParticipants={20}
                isOwner={isCreator}
                onInvite={() => setShowInviteModal(true)}
              />
            </CardContent>
          </Card>
        )}

        {/* Evidence & Disputes Tabs */}
        {bet.status === 'active' || bet.status === 'disputed' || bet.status === 'completed' ? (
          <Tabs defaultValue={bet.live_tracking_enabled ? "live-scores" : "evidence"} className="space-y-4">
            <TabsList className={`grid w-full ${bet.live_tracking_enabled ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {bet.live_tracking_enabled && (
                <TabsTrigger value="live-scores" className="gap-2">
                  <Zap className="w-3 h-3" />
                  Live Scores
                </TabsTrigger>
              )}
              <TabsTrigger value="evidence">Evidence ({evidence.length})</TabsTrigger>
              <TabsTrigger value="disputes">Disputes ({disputes.length})</TabsTrigger>
            </TabsList>

            {bet.live_tracking_enabled && (
              <TabsContent value="live-scores">
                <Card className="bg-slate-900/50 border-cyan-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-cyan-400">
                      <Zap className="h-5 w-5" />
                      Live Score Management
                    </CardTitle>
                    <CardDescription>
                      Track scores in real-time and resolve disputes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DisputeResolution
                      betId={bet.id}
                      userId={user?.id || ''}
                      isAdmin={false}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="evidence">
              <Card>
                <CardHeader>
                  <CardTitle>Evidence Submission</CardTitle>
                  <CardDescription>
                    Submit evidence of your performance to claim victory
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isParticipant ? (
                    <EvidenceSubmission
                      betId={bet.id}
                      userId={user?.id || ''}
                      onEvidenceSubmitted={fetchEvidence}
                    />
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Only bet participants can submit evidence.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Evidence History */}
                  {evidence.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <h3 className="font-semibold">Submitted Evidence</h3>
                      {evidence.map((item) => (
                        <Card key={item.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <Badge variant="outline">{item.evidence_type}</Badge>
                                <p className="text-sm mt-2">{item.description}</p>
                              </div>
                              <Badge>
                                {item.user_id === bet.creator_id ? 'Creator' : 'Opponent'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Submitted {new Date(item.submitted_at).toLocaleString()}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="disputes">
              <Card>
                <CardHeader>
                  <CardTitle>Dispute Management</CardTitle>
                  <CardDescription>
                    Raise or view disputes about bet outcomes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isParticipant ? (
                    <DisputeManager
                      betId={bet.id}
                      userId={user?.id || ''}
                      onDisputeUpdate={fetchDisputes}
                    />
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Only bet participants can manage disputes.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Dispute History */}
                  {disputes.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <h3 className="font-semibold">Dispute History</h3>
                      {disputes.map((dispute) => (
                        <Card key={dispute.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <Badge variant={dispute.status === 'resolved' ? 'outline' : 'destructive'}>
                                  {dispute.status}
                                </Badge>
                                <p className="text-sm mt-2">{dispute.reason}</p>
                                {dispute.resolution && (
                                  <p className="text-sm text-green-600 mt-2">
                                    Resolution: {dispute.resolution}
                                  </p>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Raised {new Date(dispute.created_at).toLocaleString()}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : null}

        {/* Rechallenge Modal */}
        <RechallengeModal
          open={showRechallengeModal}
          onOpenChange={setShowRechallengeModal}
          originalBetId={bet.id}
          originalBetData={{
            game_name: bet.game_name,
            bet_amount: bet.bet_amount,
            game_rules: bet.game_rules,
            opponent_name: opponentEmail,
          }}
        />
      </div>

      {/* Floating Live Score Widget */}
      {bet.live_tracking_enabled && showLiveWidget && user && (
        <FloatingScoreWidget
          betId={bet.id}
          userId={user.id}
          isCaptain={isCaptain}
          teamSide={teamSide}
          gameName={bet.game_name}
          onClose={() => setShowLiveWidget(false)}
        />
      )}
    </div>
  );
};

export default BetDetail;
