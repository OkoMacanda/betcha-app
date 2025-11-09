import { useState, useEffect, useRef } from 'react'
import { X, Maximize2, Minimize2, Zap, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  getLatestConfirmedScore,
  getPendingScores,
  subscribeToLiveScores,
  ScoreUpdate,
} from '@/lib/api/scores.api'
import { ScoreUpdateModal } from './ScoreUpdateModal'

interface FloatingScoreWidgetProps {
  betId: string
  userId: string
  isCaptain: boolean
  teamSide: 'creator' | 'opponent'
  gameName: string
  onClose: () => void
}

export function FloatingScoreWidget({
  betId,
  userId,
  isCaptain,
  teamSide,
  gameName,
  onClose,
}: FloatingScoreWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [latestScore, setLatestScore] = useState<ScoreUpdate | null>(null)
  const [pendingScores, setPendingScores] = useState<ScoreUpdate[]>([])
  const [showModal, setShowModal] = useState(false)
  const widgetRef = useRef<HTMLDivElement>(null)

  // Fetch initial scores
  useEffect(() => {
    const fetchScores = async () => {
      const { data: confirmed } = await getLatestConfirmedScore(betId)
      const { data: pending } = await getPendingScores(betId)

      if (confirmed) setLatestScore(confirmed)
      if (pending) setPendingScores(pending)
    }

    fetchScores()
  }, [betId])

  // Subscribe to real-time updates
  useEffect(() => {
    const subscription = subscribeToLiveScores(betId, (payload) => {
      console.log('Score update received:', payload)

      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const newScore = payload.new as ScoreUpdate

        if (newScore.is_confirmed) {
          setLatestScore(newScore)
          setPendingScores((prev) => prev.filter((s) => s.id !== newScore.id))
        } else {
          setPendingScores((prev) => {
            const exists = prev.find((s) => s.id === newScore.id)
            if (exists) {
              return prev.map((s) => (s.id === newScore.id ? newScore : s))
            }
            return [newScore, ...prev]
          })
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [betId])

  // Dragging logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (widgetRef.current) {
      const rect = widgetRef.current.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
      setIsDragging(true)
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)

      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  const hasPendingOpponentScores = pendingScores.some(
    (score) => score.team_side !== teamSide
  )

  if (!isExpanded) {
    return (
      <div
        ref={widgetRef}
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 9999,
        }}
        className="cursor-move"
        onMouseDown={handleMouseDown}
      >
        <Button
          onClick={() => setIsExpanded(true)}
          className="h-14 w-14 rounded-full bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-600 hover:via-blue-600 hover:to-purple-600 shadow-[0_0_30px_rgba(6,182,212,0.6)] border-2 border-cyan-400/50 relative"
        >
          <Zap className="h-6 w-6 text-white" />
          {hasPendingOpponentScores && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          )}
        </Button>
      </div>
    )
  }

  return (
    <>
      <div
        ref={widgetRef}
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 9999,
        }}
        className="select-none"
      >
        <div className="w-80 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-cyan-500/40 rounded-lg shadow-[0_0_40px_rgba(6,182,212,0.4)] overflow-hidden backdrop-blur-sm">
          {/* Header */}
          <div
            className="bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 px-4 py-3 cursor-move flex items-center justify-between"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-white animate-pulse" />
              <span className="text-sm font-bold text-white">Live Score</span>
              {hasPendingOpponentScores && (
                <Badge className="bg-red-500 text-white text-xs px-2 py-0 animate-pulse">
                  !
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white hover:bg-white/20"
                onClick={() => setIsExpanded(false)}
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white hover:bg-white/20"
                onClick={onClose}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Game Name */}
            <div className="text-center">
              <h3 className="text-sm font-semibold text-cyan-400">{gameName}</h3>
            </div>

            {/* Current Score */}
            <div className="bg-slate-800/50 border border-cyan-500/30 rounded-lg p-4">
              {latestScore ? (
                <div className="text-center">
                  <div className="text-xs text-slate-400 mb-2">Current Score</div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    {latestScore.score_data.team_score} -{' '}
                    {latestScore.score_data.opponent_score}
                  </div>
                  {latestScore.score_data.game_progress && (
                    <div className="text-xs text-slate-400 mt-2">
                      {latestScore.score_data.game_progress}
                    </div>
                  )}
                  <div className="text-xs text-green-400 mt-2 flex items-center justify-center gap-1">
                    <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                    Confirmed
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-400 text-sm">
                  No score updates yet
                </div>
              )}
            </div>

            {/* Pending Updates Alert */}
            {hasPendingOpponentScores && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-yellow-300 font-semibold">
                    Score Update Pending
                  </p>
                  <p className="text-xs text-yellow-200/70">
                    Confirm or dispute opponent's score
                  </p>
                </div>
              </div>
            )}

            {/* Update Button */}
            <Button
              onClick={() => setShowModal(true)}
              className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-600 hover:via-blue-600 hover:to-purple-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] font-semibold"
            >
              <Zap className="h-4 w-4 mr-2" />
              {isCaptain ? 'Update Score' : 'View Details'}
            </Button>
          </div>
        </div>
      </div>

      {/* Score Update Modal */}
      <ScoreUpdateModal
        open={showModal}
        onOpenChange={setShowModal}
        betId={betId}
        userId={userId}
        isCaptain={isCaptain}
        teamSide={teamSide}
        pendingScores={pendingScores}
      />
    </>
  )
}
