import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  History,
  Filter,
  TrendingUp,
  TrendingDown,
  Trophy,
  Target,
  Calendar,
  User,
  Repeat,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import {
  getChallengeHistory,
  getHistoryStats,
  exportChallengeHistoryCSV,
} from '@/lib/api/challengeHistory.api';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import HeadToHeadStats from '@/components/HeadToHeadStats';
import RechallengeModal from '@/components/RechallengeModal';

export default function ChallengeHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const opponentIdFromUrl = searchParams.get('opponentId');

  const [filter, setFilter] = useState<'all' | 'won' | 'lost' | 'active' | 'cancelled'>('all');
  const [selectedOpponentId, setSelectedOpponentId] = useState<string | null>(
    opponentIdFromUrl
  );
  const [showRechallengeModal, setShowRechallengeModal] = useState(false);
  const [rechallengeData, setRechallengeData] = useState<any>(null);

  const { data: history, isLoading } = useQuery({
    queryKey: ['challengeHistory', user?.id, filter],
    queryFn: () => getChallengeHistory(user!.id, filter),
    enabled: !!user,
  });

  const { data: h2hStats } = useQuery({
    queryKey: ['headToHeadStats', user?.id, selectedOpponentId],
    queryFn: () => getHistoryStats(user!.id, selectedOpponentId!),
    enabled: !!user && !!selectedOpponentId,
  });

  const handleExportCSV = async () => {
    if (!user) return;
    const { data, error } = await exportChallengeHistoryCSV(user.id);
    if (error) {
      console.error('Failed to export:', error);
      return;
    }

    // Create and download CSV
    if (data) {
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `betcha-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  const handleRechallenge = (challenge: any) => {
    setRechallengeData({
      originalBetId: challenge.bet_id,
      originalBetData: {
        game_name: challenge.game_name,
        bet_amount: challenge.bet_amount,
        game_rules: challenge.game_rules,
        opponent_name: challenge.opponent_name,
      },
    });
    setShowRechallengeModal(true);
  };

  const overallStats = {
    total: history?.data?.length || 0,
    won: history?.data?.filter((h) => h.result === 'won').length || 0,
    lost: history?.data?.filter((h) => h.result === 'lost').length || 0,
    active: history?.data?.filter((h) => h.result === 'active').length || 0,
    totalWon: history?.data
      ?.filter((h) => h.result === 'won')
      .reduce((sum, h) => sum + (h.winnings || 0), 0) || 0,
    totalLost: history?.data
      ?.filter((h) => h.result === 'lost')
      .reduce((sum, h) => sum + h.bet_amount, 0) || 0,
  };

  const winRate = overallStats.total > 0
    ? ((overallStats.won / (overallStats.won + overallStats.lost)) * 100).toFixed(1)
    : '0.0';

  const netProfit = overallStats.totalWon - overallStats.totalLost;

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Challenge History</h1>
            <p className="text-muted-foreground">
              View your past challenges and statistics
            </p>
          </div>
        <Button onClick={handleExportCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Trophy className="h-4 w-4" />
              <span>Wins</span>
            </div>
            <p className="text-3xl font-bold text-green-500">{overallStats.won}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              <span>Losses</span>
            </div>
            <p className="text-3xl font-bold text-red-500">{overallStats.lost}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
            <p className="text-3xl font-bold">{winRate}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Net Profit</p>
            <p
              className={`text-3xl font-bold ${
                netProfit >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {netProfit >= 0 ? '+' : ''}R{netProfit.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Head-to-Head Stats */}
      {selectedOpponentId && h2hStats?.data && (
        <div className="mb-6">
          <HeadToHeadStats stats={h2hStats.data} />
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => setSelectedOpponentId(null)}
          >
            Clear Filter
          </Button>
        </div>
      )}

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v: any) => setFilter(v)}>
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="all">All ({overallStats.total})</TabsTrigger>
          <TabsTrigger value="won">Won ({overallStats.won})</TabsTrigger>
          <TabsTrigger value="lost">Lost ({overallStats.lost})</TabsTrigger>
          <TabsTrigger value="active">Active ({overallStats.active})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading history...
            </div>
          ) : history?.data?.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <History className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-xl font-medium mb-2">No challenges found</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    {filter === 'all'
                      ? "You haven't completed any challenges yet"
                      : `No ${filter} challenges found`}
                  </p>
                  <Button onClick={() => navigate('/create-bet')}>
                    Create Your First Challenge
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            history?.data?.map((challenge) => (
              <Card
                key={challenge.bet_id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Opponent Avatar */}
                    <Avatar className="h-12 w-12">
                      {challenge.opponent_avatar ? (
                        <AvatarImage src={challenge.opponent_avatar} />
                      ) : null}
                      <AvatarFallback>
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>

                    {/* Challenge Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{challenge.game_name}</p>
                            {challenge.result === 'won' && (
                              <Badge className="bg-green-500">Won</Badge>
                            )}
                            {challenge.result === 'lost' && (
                              <Badge variant="destructive">Lost</Badge>
                            )}
                            {challenge.result === 'active' && (
                              <Badge variant="secondary">Active</Badge>
                            )}
                            {challenge.result === 'cancelled' && (
                              <Badge variant="outline">Cancelled</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            vs {challenge.opponent_name}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-bold">
                            R{challenge.bet_amount.toFixed(2)}
                          </p>
                          {challenge.result === 'won' && challenge.winnings && (
                            <p className="text-sm text-green-500">
                              +R{challenge.winnings.toFixed(2)}
                            </p>
                          )}
                          {challenge.result === 'lost' && (
                            <p className="text-sm text-red-500">
                              -R{challenge.bet_amount.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {format(new Date(challenge.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                        {challenge.challenge_type !== 'one_on_one' && (
                          <Badge variant="outline" className="text-xs">
                            {challenge.challenge_type === 'group_individual' && 'Group'}
                            {challenge.challenge_type === 'team_vs_team' && 'Team vs Team'}
                            {challenge.challenge_type === 'tournament' && 'Tournament'}
                          </Badge>
                        )}
                      </div>

                      {challenge.game_rules && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {challenge.game_rules}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/bet/${challenge.bet_id}`)}
                      >
                        View
                      </Button>
                      {(challenge.result === 'won' || challenge.result === 'lost') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRechallenge(challenge)}
                        >
                          <Repeat className="h-3 w-3 mr-1" />
                          Rechallenge
                        </Button>
                      )}
                      {!selectedOpponentId && challenge.opponent_id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedOpponentId(challenge.opponent_id)}
                        >
                          Head-to-Head
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Rechallenge Modal */}
      {rechallengeData && (
        <RechallengeModal
          open={showRechallengeModal}
          onOpenChange={setShowRechallengeModal}
          originalBetId={rechallengeData.originalBetId}
          originalBetData={rechallengeData.originalBetData}
        />
      )}
      </div>
    </div>
  );
}
