import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trophy, ArrowLeft, Users, DollarSign, Clock, Shield, Loader2, AlertCircle, Search } from "lucide-react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePageSEO } from "@/hooks/usePageSEO";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useCurrency } from "@/hooks/useCurrency";
import { createBet } from "@/lib/api/bets.api";
import { createGroupIndividualChallenge, createTeamChallenge } from "@/lib/api/groupBetting.api";
import Navigation from "@/components/Navigation";
import ChallengeTypeSelector from "@/components/ChallengeTypeSelector";
import ContactsPicker from "@/components/ContactsPicker";
import GroupPicker from "@/components/GroupPicker";
import InviteModal from "@/components/InviteModal";
import type { ChallengeType } from "@/types/social.types";

interface GameRule {
  id: string;
  name: string;
  category: string;
  description: string;
  win_condition: {
    type: string;
    params: Record<string, any>;
  };
  evidence_required: string[];
  typical_duration?: string;
  difficulty?: string;
  popularity?: number;
}

const CreateBet = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { balance, isLoading: walletLoading } = useWallet();
  const { format: formatCurrency } = useCurrency();

  const gameRule = location.state?.gameRule as GameRule | undefined;
  const gameName = location.state?.gameName || gameRule?.name || "";
  const contactIdFromUrl = searchParams.get('contactId');
  const groupIdFromUrl = searchParams.get('groupId');

  usePageSEO({ title: "Create Challenge – Challenger", description: "Set up the rules, stakes, and participants for your challenge.", canonicalPath: "/create-challenge" });

  const [challengeType, setChallengeType] = useState<ChallengeType>('one_on_one');
  const [formData, setFormData] = useState({
    gameName: gameName,
    betAmount: "",
    opponentEmail: "",
    duration: gameRule?.typical_duration || "",
    rules: gameRule?.description || "",
  });

  // Group betting fields
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(groupIdFromUrl);
  const [numTeams, setNumTeams] = useState(2);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const [isCreating, setIsCreating] = useState(false);
  const [insufficientFunds, setInsufficientFunds] = useState(false);

  // Check if user has sufficient balance
  useEffect(() => {
    if (formData.betAmount && balance !== null) {
      const amount = parseFloat(formData.betAmount);
      setInsufficientFunds(amount > balance);
    } else {
      setInsufficientFunds(false);
    }
  }, [formData.betAmount, balance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (insufficientFunds) {
      toast({
        title: "Insufficient Balance",
        description: "Please add funds to your wallet first.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a challenge.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const betAmount = parseFloat(formData.betAmount);

      // Handle group betting challenges
      if (challengeType === 'group_individual') {
        const { data, error } = await createGroupIndividualChallenge(user.id, {
          challenge_type: 'group_individual',
          entry_fee: betAmount,
          prize_distribution: { first: 50, second: 35, third: 15 },
          game_name: formData.gameName,
          game_rules: formData.rules,
          duration: formData.duration,
        });

        if (error || !data) {
          toast({
            title: "Failed to Create Challenge",
            description: error || "Please try again.",
            variant: "destructive",
          });
          setIsCreating(false);
          return;
        }

        toast({
          title: "Group Challenge Created!",
          description: "Invite participants to join your challenge.",
        });

        setShowInviteModal(true);
        setIsCreating(false);
        return;
      }

      if (challengeType === 'team_vs_team' || challengeType === 'tournament') {
        const { data, error } = await createTeamChallenge(user.id, {
          challenge_type: challengeType,
          entry_fee: betAmount,
          num_teams: numTeams,
          prize_distribution: numTeams === 2
            ? { first: 100 }
            : { first: 50, second: 35, third: 15 },
          game_name: formData.gameName,
          game_rules: formData.rules,
          duration: formData.duration,
        });

        if (error || !data) {
          toast({
            title: "Failed to Create Challenge",
            description: error || "Please try again.",
            variant: "destructive",
          });
          setIsCreating(false);
          return;
        }

        toast({
          title: "Team Challenge Created!",
          description: "Invite teams to join your challenge.",
        });

        setShowInviteModal(true);
        setIsCreating(false);
        return;
      }

      // Standard one-on-one bet
      const { data: bet, error } = await createBet(user.id, {
        opponent_email: formData.opponentEmail,
        game_name: formData.gameName,
        bet_amount: betAmount,
        game_rules: formData.rules,
        duration: formData.duration,
        game_rule_id: gameRule?.id || null,
        win_condition: gameRule?.win_condition || null,
        evidence_required: gameRule?.evidence_required || null,
      });

      if (error || !bet) {
        toast({
          title: "Failed to Create Bet",
          description: error || "Please try again.",
          variant: "destructive",
        });
        setIsCreating(false);
        return;
      }

      toast({
        title: "Challenge Created Successfully!",
        description: `Your challenge is locked in. Waiting for ${formData.opponentEmail} to accept.`,
      });

      setTimeout(() => {
        navigate("/active-challenges");
      }, 1500);
    } catch (error: any) {
      console.error('Challenge creation error:', error);
      toast({
        title: "Failed to Create Challenge",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (walletLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold">Create Your Challenge</h1>
            {balance !== null && balance !== undefined && (
              <Badge variant="outline" className="text-lg px-4 py-2">
                Balance: {formatCurrency(balance ?? 0)}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Set up the rules, stakes, and participants for your competitive challenge
          </p>
          {gameRule && (
            <Alert className="mt-4">
              <Trophy className="h-4 w-4" />
              <AlertDescription>
                Using pre-built game rule: <strong>{gameRule.name}</strong>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Challenge Type Selector */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Challenge Type</h3>
            <ChallengeTypeSelector
              selected={challengeType}
              onChange={setChallengeType}
            />
          </Card>

          {/* Game Name */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="gameName">Game/Challenge Name</Label>
                <Input
                  id="gameName"
                  placeholder="e.g., Basketball 1v1, Spelling Bee"
                  value={formData.gameName}
                  onChange={(e) => setFormData({ ...formData, gameName: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="rules">Game Rules & Win Conditions</Label>
                <Textarea
                  id="rules"
                  placeholder="Describe how the game works and how to win..."
                  value={formData.rules}
                  onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                  rows={4}
                  required
                />
                <p className="text-sm text-muted-foreground mt-2">
                  REF AI will use these rules to track progress and resolve disputes
                </p>
              </div>
            </div>
          </Card>

          {/* Challenge Details */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-accent" />
              Challenge Details
            </h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="betAmount">Challenge Amount (per person)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R</span>
                  <Input
                    id="betAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.betAmount}
                    onChange={(e) => setFormData({ ...formData, betAmount: e.target.value })}
                    className={`pl-8 ${insufficientFunds ? 'border-destructive' : ''}`}
                    required
                  />
                </div>
                {insufficientFunds && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Insufficient balance. Please{' '}
                      <button
                        type="button"
                        className="underline font-medium"
                        onClick={() => navigate('/wallet')}
                      >
                        add funds
                      </button>{' '}
                      to your wallet.
                    </AlertDescription>
                  </Alert>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  10% platform fee applies to winnings
                </p>
              </div>

              {/* Conditional opponent selection based on challenge type */}
              {challengeType === 'one_on_one' && (
                <div>
                  <Label htmlFor="opponentEmail">Opponent Email Address</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="opponentEmail"
                      type="email"
                      placeholder="opponent@example.com"
                      value={formData.opponentEmail}
                      onChange={(e) => setFormData({ ...formData, opponentEmail: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    If the user isn't registered yet, we'll send them an email invite
                  </p>
                </div>
              )}

              {/* Group/Team challenge participant selection */}
              {(challengeType === 'team_vs_team' || challengeType === 'tournament') && (
                <div>
                  <Label htmlFor="numTeams">Number of Teams</Label>
                  <Input
                    id="numTeams"
                    type="number"
                    min="2"
                    value={numTeams}
                    onChange={(e) => setNumTeams(parseInt(e.target.value))}
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    {numTeams === 2
                      ? 'Winner takes all (split among team members)'
                      : 'Tournament mode: 50% 1st, 35% 2nd, 15% 3rd'}
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="duration">Game Duration</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="duration"
                    placeholder="e.g., 30 minutes, 1 hour"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Security Info */}
          <Card className="p-6 bg-primary/5 border-primary/20">
            <div className="flex gap-4">
              <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">How Challenger Keeps You Safe</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Funds are held in secure escrow until the challenge concludes</li>
                  <li>• REF AI monitors game progress and resolves disputes</li>
                  <li>• Winner receives payout automatically (minus 10% fee)</li>
                  <li>• Full KYC verification ensures legitimate participants</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/games")}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="hero"
              className="flex-1"
              disabled={isCreating || insufficientFunds}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : challengeType === 'one_on_one' ? (
                'Create Challenge & Lock Funds'
              ) : (
                'Create Challenge & Invite Participants'
              )}
            </Button>
          </div>
        </form>

        {/* Invite Modal for group challenges */}
        {showInviteModal && (
          <InviteModal
            open={showInviteModal}
            onOpenChange={setShowInviteModal}
            betId=""
            onInviteSent={() => {
              toast({ title: "Invites sent successfully!" });
              navigate("/active-challenges");
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CreateBet;
