import { PostgrestError, StorageError } from '@supabase/supabase-js'

export function handleApiError(error: PostgrestError | Error | unknown): string {
  if (!error) return 'An unknown error occurred'

  // Handle Supabase PostgrestError
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const postgrestError = error as PostgrestError

    // Map common error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
      '23505': 'This record already exists',
      '23503': 'Referenced record not found',
      '23502': 'Required field is missing',
      '42501': 'Permission denied',
      '42P01': 'Table not found',
      PGRST116: 'No rows found',
      PGRST301: 'Invalid API request',
    }

    if (postgrestError.code && errorMessages[postgrestError.code]) {
      return errorMessages[postgrestError.code]
    }

    return postgrestError.message || 'Database error occurred'
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error
  }

  return 'An unexpected error occurred'
}

export function handleStorageError(error: StorageError | Error | unknown): string {
  if (!error) return 'An unknown storage error occurred'

  // Handle Supabase StorageError
  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    const storageError = error as StorageError

    const errorMessages: Record<string, string> = {
      '400': 'Invalid file or request',
      '401': 'Authentication required',
      '403': 'Permission denied',
      '404': 'File not found',
      '409': 'File already exists',
      '413': 'File too large',
      '415': 'Unsupported file type',
    }

    const statusCode = storageError.statusCode?.toString()
    if (statusCode && errorMessages[statusCode]) {
      return errorMessages[statusCode]
    }

    return storageError.message || 'Storage error occurred'
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error
  }

  return 'An unexpected storage error occurred'
}

export function logError(error: unknown, context?: string): void {
  console.error(`[Error${context ? ` - ${context}` : ''}]:`, error)

  // In production, you could send errors to an external service
  // Example: Sentry, LogRocket, etc.
  if (import.meta.env.PROD) {
    // sendToErrorTracking(error, context)
  }
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('connection')
    )
  }
  return false
}

export function getUserFriendlyMessage(error: unknown, context?: string): string {
  const errorMessage = handleApiError(error)

  if (isNetworkError(error)) {
    return 'Network error. Please check your internet connection.'
  }

  if (context) {
    return `Failed to ${context}: ${errorMessage}`
  }

  return errorMessage
}
