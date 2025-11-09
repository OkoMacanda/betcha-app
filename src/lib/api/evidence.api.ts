import { supabase } from '@/integrations/supabase/client'
import { EvidenceInput } from '@/types/evidence.types'
import { Evidence } from '@/types/database.types'
import { handleApiError, handleStorageError } from '@/lib/error-handler'

export async function submitEvidence(
  userId: string,
  input: EvidenceInput
): Promise<{ data: Evidence | null; error: string | null }> {
  try {
    // Upload file first
    const { data: fileUrl, error: uploadError } = await uploadEvidenceFile(
      input.file,
      input.bet_id,
      userId
    )

    if (uploadError || !fileUrl) {
      return { data: null, error: uploadError || 'File upload failed' }
    }

    // Create evidence record
    const { data, error } = await supabase
      .from('evidence')
      .insert({
        bet_id: input.bet_id,
        user_id: userId,
        evidence_type: input.evidence_type,
        evidence_url: fileUrl,
        description: input.description || null,
        status: 'submitted',
      })
      .select()
      .single()

    if (error) {
      return { data: null, error: handleApiError(error) }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleApiError(error) }
  }
}

export async function getBetEvidence(
  betId: string
): Promise<{ data: Evidence[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('evidence')
      .select('*')
      .eq('bet_id', betId)
      .order('submitted_at', { ascending: false })

    if (error) {
      return { data: null, error: handleApiError(error) }
    }

    return { data: data || [], error: null }
  } catch (error) {
    return { data: null, error: handleApiError(error) }
  }
}

export async function uploadEvidenceFile(
  file: File,
  betId: string,
  userId: string
): Promise<{ data: string | null; error: string | null }> {
  try {
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = `${betId}/${userId}/${timestamp}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('evidence')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      return { data: null, error: handleStorageError(uploadError) }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('evidence')
      .getPublicUrl(fileName)

    return { data: urlData.publicUrl, error: null }
  } catch (error) {
    return { data: null, error: handleStorageError(error) }
  }
}

export async function deleteEvidence(
  evidenceId: string,
  evidenceUrl: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Delete from database
    const { error: dbError } = await supabase
      .from('evidence')
      .delete()
      .eq('id', evidenceId)

    if (dbError) {
      return { success: false, error: handleApiError(dbError) }
    }

    // Extract file path from URL
    const urlParts = evidenceUrl.split('/evidence/')
    if (urlParts.length > 1) {
      const filePath = urlParts[1]

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('evidence')
        .remove([filePath])

      if (storageError) {
        return { success: false, error: handleStorageError(storageError) }
      }
    }

    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: handleApiError(error) }
  }
}
