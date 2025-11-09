import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { updateBetScore, confirmScore, raiseDispute } from '@/lib/api/scores.api'
import { Loader2, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface ScoreUpdateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  betId: string
  userId: string
  isCaptain: boolean
  teamSide: 'creator' | 'opponent'
  pendingScores?: Array<{
    id: string
    team_side: string
    score_data: {
      team_score: number
      opponent_score: number
      game_progress?: string
    }
  }>
}

export function ScoreUpdateModal({
  open,
  onOpenChange,
  betId,
  userId,
  isCaptain,
  teamSide,
  pendingScores = [],
}: ScoreUpdateModalProps) {
  const [teamScore, setTeamScore] = useState('')
  const [opponentScore, setOpponentScore] = useState('')
  const [gameProgress, setGameProgress] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isDisputing, setIsDisputing] = useState(false)

  const handleSubmitScore = async () => {
    if (!teamScore || !opponentScore) {
      toast({
        title: 'Invalid input',
        description: 'Please enter both team scores',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    const { data, error } = await updateBetScore(betId, userId, teamSide, {
      team_score: parseInt(teamScore),
      opponent_score: parseInt(opponentScore),
      game_progress: gameProgress || undefined,
    })

    setIsSubmitting(false)

    if (error) {
      toast({
        title: 'Score update failed',
        description: error,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Score updated!',
      description: 'Waiting for opponent captain to confirm',
    })

    setTeamScore('')
    setOpponentScore('')
    setGameProgress('')
  }

  const handleConfirmScore = async (scoreUpdateId: string) => {
    setIsConfirming(true)

    const { success, error } = await confirmScore(scoreUpdateId, userId)

    setIsConfirming(false)

    if (error) {
      toast({
        title: 'Confirmation failed',
        description: error,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Score confirmed!',
      description: 'Both teams agree on the current score',
    })

    onOpenChange(false)
  }

  const handleDispute = async (reason: string) => {
    if (!reason.trim()) {
      toast({
        title: 'Invalid input',
        description: 'Please provide a reason for the dispute',
        variant: 'destructive',
      })
      return
    }

    setIsDisputing(true)

    const { data, error } = await raiseDispute(betId, userId, reason, 'score_mismatch')

    setIsDisputing(false)

    if (error) {
      toast({
        title: 'Dispute failed',
        description: error,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Dispute raised',
      description: 'An admin will review the score discrepancy',
    })

    onOpenChange(false)
  }

  // Find pending scores from the opposing team
  const opposingPendingScores = pendingScores.filter(
    (score) => score.team_side !== teamSide
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
            <Zap className="h-6 w-6 text-cyan-400" />
            Live Score Tracking
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            {isCaptain
              ? 'Update your team score and confirm opponent scores'
              : 'View live score updates from team captains'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Pending Score Confirmations */}
          {opposingPendingScores.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Pending Confirmation
              </h3>
              {opposingPendingScores.map((score) => (
                <div
                  key={score.id}
                  className="p-4 bg-slate-800/50 border border-yellow-500/30 rounded-lg space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-slate-300">
                      Opponent's Score Update:
                    </div>
                    <div className="text-lg font-bold text-yellow-400">
                      {score.score_data.team_score} - {score.score_data.opponent_score}
                    </div>
                  </div>
                  {score.score_data.game_progress && (
                    <div className="text-xs text-slate-400">
                      {score.score_data.game_progress}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleConfirmScore(score.id)}
                      disabled={isConfirming}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                    >
                      {isConfirming ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Confirm
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        const reason = prompt('Why do you dispute this score?')
                        if (reason) handleDispute(reason)
                      }}
                      disabled={isDisputing}
                      variant="outline"
                      className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      {isDisputing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Dispute
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Score Update Form (Captains Only) */}
          {isCaptain && (
            <div className="space-y-4 p-4 bg-slate-800/30 border border-cyan-500/20 rounded-lg">
              <h3 className="text-sm font-semibold text-purple-400">
                Submit Score Update
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teamScore" className="text-slate-300">
                    Your Team Score
                  </Label>
                  <Input
                    id="teamScore"
                    type="number"
                    min="0"
                    value={teamScore}
                    onChange={(e) => setTeamScore(e.target.value)}
                    className="bg-slate-900/50 border-cyan-500/30 focus:border-cyan-400 text-white"
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="opponentScore" className="text-slate-300">
                    Opponent Score
                  </Label>
                  <Input
                    id="opponentScore"
                    type="number"
                    min="0"
                    value={opponentScore}
                    onChange={(e) => setOpponentScore(e.target.value)}
                    className="bg-slate-900/50 border-purple-500/30 focus:border-purple-400 text-white"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gameProgress" className="text-slate-300">
                  Game Progress (Optional)
                </Label>
                <Textarea
                  id="gameProgress"
                  value={gameProgress}
                  onChange={(e) => setGameProgress(e.target.value)}
                  className="bg-slate-900/50 border-slate-600 focus:border-cyan-400 text-white"
                  placeholder="e.g., End of 2nd quarter, Half-time, etc."
                  rows={2}
                />
              </div>

              <Button
                onClick={handleSubmitScore}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-600 hover:via-blue-600 hover:to-purple-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Submit Score Update
                  </>
                )}
              </Button>
            </div>
          )}

          {!isCaptain && opposingPendingScores.length === 0 && (
            <div className="text-center p-8 text-slate-400">
              <p>No pending score updates</p>
              <p className="text-sm mt-2">
                Only team captains can submit scores
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
