import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { getBetDisputes, getBetEvidence, Dispute, Evidence } from '@/lib/api/scores.api'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { AlertTriangle, FileText, Image, Video, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface DisputeResolutionProps {
  betId: string
  userId: string
  isAdmin?: boolean
}

export function DisputeResolution({ betId, userId, isAdmin = false }: DisputeResolutionProps) {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [resolution, setResolution] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)

      const [disputesResult, evidenceResult] = await Promise.all([
        getBetDisputes(betId),
        getBetEvidence(betId),
      ])

      if (disputesResult.data) setDisputes(disputesResult.data)
      if (evidenceResult.data) setEvidence(evidenceResult.data)

      setIsLoading(false)
    }

    fetchData()
  }, [betId])

  const handleResolveDispute = async (disputeId: string, status: 'resolved' | 'rejected') => {
    if (!resolution.trim()) {
      toast({
        title: 'Resolution required',
        description: 'Please provide a resolution message',
        variant: 'destructive',
      })
      return
    }

    setResolvingId(disputeId)

    const { error } = await supabase
      .from('disputes')
      .update({
        status,
        resolution,
        resolved_by: userId,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', disputeId)

    setResolvingId(null)

    if (error) {
      toast({
        title: 'Failed to resolve dispute',
        description: error.message,
        variant: 'destructive',
      })
      return
    }

    // Update local state
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === disputeId
          ? {
              ...d,
              status,
              resolution,
              resolved_by: userId,
              resolved_at: new Date().toISOString(),
            }
          : d
      )
    )

    setResolution('')

    toast({
      title: 'Dispute resolved',
      description: `Dispute has been ${status}`,
    })
  }

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'screenshot':
        return <Image className="h-4 w-4" />
      case 'video':
        return <Video className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            Pending
          </Badge>
        )
      case 'under_review':
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            Under Review
          </Badge>
        )
      case 'resolved':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Resolved
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            Rejected
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  if (disputes.length === 0) {
    return (
      <Card className="p-8 bg-slate-800/30 border-slate-700">
        <div className="text-center text-slate-400">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
          <p className="text-lg font-semibold">No disputes</p>
          <p className="text-sm mt-2">This bet has no active disputes</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Disputes List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Disputes
        </h2>

        {disputes.map((dispute) => (
          <Card
            key={dispute.id}
            className="p-6 bg-slate-800/50 border-2 border-yellow-500/30 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  {getStatusBadge(dispute.status)}
                  <Badge variant="outline" className="text-xs">
                    {dispute.dispute_type}
                  </Badge>
                </div>
                <p className="text-sm text-slate-300">{dispute.reason}</p>
                <p className="text-xs text-slate-500">
                  Raised {formatDistanceToNow(new Date(dispute.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Resolution */}
            {dispute.resolution && (
              <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-2">Resolution:</p>
                <p className="text-sm text-slate-200">{dispute.resolution}</p>
                {dispute.resolved_at && (
                  <p className="text-xs text-slate-500 mt-2">
                    Resolved {formatDistanceToNow(new Date(dispute.resolved_at), { addSuffix: true })}
                  </p>
                )}
              </div>
            )}

            {/* Admin Actions */}
            {isAdmin && dispute.status === 'pending' && (
              <div className="space-y-3 pt-4 border-t border-slate-700">
                <Textarea
                  placeholder="Enter resolution details..."
                  value={resolvingId === dispute.id ? resolution : ''}
                  onChange={(e) => setResolution(e.target.value)}
                  className="bg-slate-900/50 border-slate-600 text-white"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleResolveDispute(dispute.id, 'resolved')}
                    disabled={resolvingId === dispute.id}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                  >
                    {resolvingId === dispute.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Resolve
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleResolveDispute(dispute.id, 'rejected')}
                    disabled={resolvingId === dispute.id}
                    variant="outline"
                    className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    {resolvingId === dispute.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Evidence Section */}
      {evidence.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-purple-400 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Evidence
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evidence.map((item) => (
              <Card
                key={item.id}
                className="p-4 bg-slate-800/50 border border-purple-500/30 space-y-3"
              >
                <div className="flex items-center gap-2">
                  {getEvidenceIcon(item.evidence_type)}
                  <Badge variant="outline" className="text-xs">
                    {item.evidence_type}
                  </Badge>
                </div>

                {item.description && (
                  <p className="text-sm text-slate-300">{item.description}</p>
                )}

                {item.evidence_url && (
                  <a
                    href={item.evidence_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                  >
                    View Evidence
                  </a>
                )}

                <p className="text-xs text-slate-500">
                  Submitted{' '}
                  {formatDistanceToNow(new Date(item.submitted_at), { addSuffix: true })}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
