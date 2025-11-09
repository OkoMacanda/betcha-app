import { EvidenceTypeValue } from '@/types/evidence.types'
import { Image, Video, FileImage, FileText } from 'lucide-react'

export const EVIDENCE_TYPES = {
  PHOTO: 'photo',
  VIDEO: 'video',
  SCREENSHOT: 'screenshot',
  DOCUMENT: 'document',
} as const

export function getEvidenceIcon(type: EvidenceTypeValue) {
  const icons = {
    photo: Image,
    video: Video,
    screenshot: FileImage,
    document: FileText,
  }
  return icons[type]
}

export function validateEvidenceFile(file: File, type: EvidenceTypeValue): boolean {
  const allowedTypes: Record<EvidenceTypeValue, string[]> = {
    photo: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
    video: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
    screenshot: ['image/jpeg', 'image/jpg', 'image/png'],
    document: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  }

  return allowedTypes[type].includes(file.type)
}

export const ALLOWED_FILE_TYPES: Record<EvidenceTypeValue, string> = {
  photo: 'image/jpeg, image/jpg, image/png, image/gif',
  video: 'video/mp4, video/quicktime, video/x-msvideo, video/webm',
  screenshot: 'image/jpeg, image/jpg, image/png',
  document: 'application/pdf, image/jpeg, image/jpg, image/png',
}

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
export const MAX_FILE_SIZE_MB = 50
