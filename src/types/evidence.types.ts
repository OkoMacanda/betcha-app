import { Evidence } from './database.types'
import { Bet } from './bet.types'

// Evidence type enum
export const EvidenceType = {
  PHOTO: 'photo',
  VIDEO: 'video',
  SCREENSHOT: 'screenshot',
  DOCUMENT: 'document',
} as const

export type EvidenceTypeValue = (typeof EvidenceType)[keyof typeof EvidenceType]

// Evidence status enum
export const EvidenceStatus = {
  SUBMITTED: 'submitted',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
} as const

export type EvidenceStatusType = (typeof EvidenceStatus)[keyof typeof EvidenceStatus]

// Evidence with bet details
export interface EvidenceWithBet extends Evidence {
  bet?: Bet
}

// Input for submitting evidence
export interface EvidenceInput {
  bet_id: string
  evidence_type: EvidenceTypeValue
  file: File
  description?: string
}

// Evidence file validation
export interface EvidenceValidationResult {
  valid: boolean
  error?: string
}

// Helper functions
export function validateEvidenceFile(
  file: File,
  type: EvidenceTypeValue
): EvidenceValidationResult {
  const maxSizeMB = 50
  const maxSizeBytes = maxSizeMB * 1024 * 1024

  // Check file size
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    }
  }

  // Check file type
  const allowedTypes: Record<EvidenceTypeValue, string[]> = {
    photo: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
    video: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
    screenshot: ['image/jpeg', 'image/jpg', 'image/png'],
    document: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  }

  if (!allowedTypes[type].includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type for ${type}. Allowed: ${allowedTypes[type].join(', ')}`,
    }
  }

  return { valid: true }
}

export function getEvidenceTypeLabel(type: EvidenceTypeValue): string {
  const labels: Record<EvidenceTypeValue, string> = {
    photo: 'Photo',
    video: 'Video',
    screenshot: 'Screenshot',
    document: 'Document',
  }
  return labels[type]
}

export function getEvidenceStatusLabel(status: EvidenceStatusType): string {
  const labels: Record<EvidenceStatusType, string> = {
    submitted: 'Submitted',
    verified: 'Verified',
    rejected: 'Rejected',
  }
  return labels[status]
}

export function isEvidenceVerified(status: EvidenceStatusType): boolean {
  return status === EvidenceStatus.VERIFIED
}

export function isEvidenceRejected(status: EvidenceStatusType): boolean {
  return status === EvidenceStatus.REJECTED
}
