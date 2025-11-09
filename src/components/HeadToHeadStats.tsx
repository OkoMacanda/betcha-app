import { TrendingUp, TrendingDown, Trophy, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { HeadToHeadStats as Stats } from '@/types/social.types';

interface HeadToHeadStatsProps {
  stats: Stats;
}

export default function HeadToHeadStats({ stats }: HeadToHeadStatsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={stats.opponent_avatar} />
            <AvatarFallback>{stats.opponent_name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>vs {stats.opponent_name}</CardTitle>
            <p className="text-sm text-muted-foreground">Head-to-Head Record</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Trophy className="h-4 w-4" />
              <span>Wins</span>
            </div>
            <p className="text-2xl font-bold text-green-500">{stats.wins}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              <span>Losses</span>
            </div>
            <p className="text-2xl font-bold text-red-500">{stats.losses}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold">{stats.win_rate.toFixed(1)}%</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Challenges</p>
            <p className="text-2xl font-bold">{stats.total_challenges}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>Total Won</span>
            </div>
            <p className="text-lg font-semibold text-green-500">
              R{stats.total_won.toFixed(2)}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span>Total Lost</span>
            </div>
            <p className="text-lg font-semibold text-red-500">
              R{stats.total_lost.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-muted">
          <p className="text-sm font-medium">Net Profit</p>
          <p className={`text-xl font-bold ${
            stats.net_profit >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {stats.net_profit >= 0 ? '+' : ''}R{stats.net_profit.toFixed(2)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
