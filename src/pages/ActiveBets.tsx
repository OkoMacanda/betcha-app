import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Trophy,
  Clock,
  Users,
  DollarSign,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Timer,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePageSEO } from "@/hooks/usePageSEO";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";
import { getUserBets } from "@/lib/api/bets.api";
import Navigation from "@/components/Navigation";

interface Bet {
  id: string;
  creator_id: string;
  opponent_id: string | null;
  game_name: string;
  bet_amount: number;
  status: string;
  created_at: string;
  winner_id?: string;
  creator: {
    email: string;
    user_id?: string;
    full_name?: string;
    username?: string;
  } | null;
  opponent: {
    email: string;
    user_id?: string;
    full_name?: string;
    username?: string;
  } | null;
}

const ActiveBets = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance, isLoading: walletLoading } = useWallet();
  const { format: formatCurrency } = useCurrency();

  usePageSEO({
    title: "Active Challenges – Betcha",
    description: "Track your live and completed challenges, stats and wallet.",
    canonicalPath: "/active-challenges",
  });

  const [bets, setBets] = useState<Bet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    activeChallenges: 0,
    winRate: 0,
    totalChallenges: 0,
  });

  useEffect(() => {
    if (user) {
      fetchBets();
      calculateStats();
    }
  }, [user]);

  const fetchBets = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await getUserBets(user.id);

      if (error) {
        console.error("Error fetching bets:", error);
        return;
      }

      setBets(data || []);
    } catch (error: any) {
      console.error("Error fetching bets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = async () => {
    if (!user) return;

    try {
      // Get all bets for this user
      const { data: allBets, error } = await supabase
        .from("bets")
        .select("*")
        .or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`);

      if (error) throw error;

      const activeChallengesCount = allBets?.filter(
        (bet) => bet.status === "active" || bet.status === "pending"
      ).length || 0;

      const completedBets = allBets?.filter((bet) => bet.status === "completed") || [];
      const wonBets = completedBets.filter((bet) => bet.winner_id === user.id).length;

      const winRate = completedBets.length > 0 ? (wonBets / completedBets.length) * 100 : 0;

      setStats({
        activeChallenges: activeChallengesCount,
        winRate: Math.round(winRate),
        totalChallenges: allBets?.length || 0,
      });
    } catch (error: any) {
      console.error("Error calculating stats:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Timer className="w-3 h-3" />
            Pending
          </Badge>
        );
      case "active":
        return (
          <Badge className="bg-blue-500 gap-1">
            <Clock className="w-3 h-3" />
            Active
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-500 gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </Badge>
        );
      case "disputed":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            Disputed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="gap-1">
            <XCircle className="w-3 h-3" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOpponentEmail = (bet: Bet) => {
    if (!user) return "";

    // If I'm the creator, show opponent (or "Open Challenge" if no opponent)
    if (bet.creator_id === user.id) {
      return bet.opponent?.email || "Open Challenge";
    }

    // If I'm the opponent, show creator
    return bet.creator?.email || "Unknown";
  };

  const filterBetsByStatus = (status: string[]) => {
    return bets.filter((bet) => status.includes(bet.status));
  };

  const BetCard = ({ bet }: { bet: Bet }) => {
    const isWinner = bet.winner_id === user?.id;
    const isCompleted = bet.status === "completed";

    return (
      <Card
        key={bet.id}
        className="p-6 hover:border-primary transition-smooth cursor-pointer"
        onClick={() => navigate(`/bet/${bet.id}`)}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold">{bet.game_name}</h3>
              {getStatusBadge(bet.status)}
              {isCompleted && bet.winner_id && (
                <Badge className={isWinner ? "bg-gradient-accent" : "bg-gray-500"}>
                  {isWinner ? "Won" : "Lost"}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>vs {getOpponentEmail(bet)}</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span>{formatCurrency(bet.bet_amount)}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Created {new Date(bet.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {isCompleted && (
              <div className="text-right">
                {isWinner ? (
                  <>
                    <p className="text-2xl font-bold text-accent">
                      +{formatCurrency(bet.bet_amount * 2 * 0.9)}
                    </p>
                    <p className="text-sm text-muted-foreground">Paid out</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-destructive">
                      -{formatCurrency(bet.bet_amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">Lost challenge</p>
                  </>
                )}
              </div>
            )}
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  if (isLoading || walletLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingBets = filterBetsByStatus(["pending"]);
  const activeBets = filterBetsByStatus(["active", "disputed"]);
  const completedBets = filterBetsByStatus(["completed", "cancelled"]);

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Challenges</p>
                <p className="text-3xl font-bold">{stats.activeChallenges}</p>
              </div>
              <Play className="w-8 h-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
                <p className="text-3xl font-bold text-accent">{stats.winRate}%</p>
              </div>
              <Trophy className="w-8 h-8 text-accent" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Wallet Balance</p>
                <p className="text-3xl font-bold">
                  {balance !== null ? formatCurrency(balance) : formatCurrency(0)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </Card>
        </div>

        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">My Challenges</h2>
          <Button variant="hero" onClick={() => navigate("/create-challenge")}>
            Create New Challenge
          </Button>
        </div>

        {/* Challenges Tabs */}
        {bets.length === 0 ? (
          <Alert>
            <Trophy className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">No challenges yet!</p>
              <p className="text-sm">
                Start your first competitive challenge now.
              </p>
              <Button
                variant="link"
                className="p-0 h-auto mt-2"
                onClick={() => navigate("/create-challenge")}
              >
                Create your first challenge →
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">
                Pending ({pendingBets.length})
              </TabsTrigger>
              <TabsTrigger value="active">Active ({activeBets.length})</TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedBets.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingBets.length === 0 ? (
                <Alert>
                  <Timer className="h-4 w-4" />
                  <AlertDescription>No pending challenges</AlertDescription>
                </Alert>
              ) : (
                pendingBets.map((bet) => <BetCard key={bet.id} bet={bet} />)
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {activeBets.length === 0 ? (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>No active challenges</AlertDescription>
                </Alert>
              ) : (
                activeBets.map((bet) => <BetCard key={bet.id} bet={bet} />)
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedBets.length === 0 ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>No completed challenges</AlertDescription>
                </Alert>
              ) : (
                completedBets.map((bet) => <BetCard key={bet.id} bet={bet} />)
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default ActiveBets;
