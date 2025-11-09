import { supabase } from '@/integrations/supabase/client'
import { KYCVerification } from '@/types/database.types'
import { handleApiError, handleStorageError } from '@/lib/error-handler'

interface KYCDocuments {
  idFront: File
  idBack: File
  selfie: File
}

export async function submitKYC(
  userId: string,
  documents: KYCDocuments
): Promise<{ data: KYCVerification | null; error: string | null }> {
  try {
    // Upload documents
    const { data: idFrontUrl, error: frontError } = await uploadKYCDocument(
      documents.idFront,
      userId,
      'id_front'
    )

    if (frontError || !idFrontUrl) {
      return { data: null, error: frontError || 'Failed to upload ID front' }
    }

    const { data: idBackUrl, error: backError } = await uploadKYCDocument(
      documents.idBack,
      userId,
      'id_back'
    )

    if (backError || !idBackUrl) {
      return { data: null, error: backError || 'Failed to upload ID back' }
    }

    const { data: selfieUrl, error: selfieError } = await uploadKYCDocument(
      documents.selfie,
      userId,
      'selfie'
    )

    if (selfieError || !selfieUrl) {
      return { data: null, error: selfieError || 'Failed to upload selfie' }
    }

    // Create KYC verification record
    const { data, error } = await supabase
      .from('kyc_verifications')
      .insert({
        user_id: userId,
        status: 'pending',
        id_front_url: idFrontUrl,
        id_back_url: idBackUrl,
        selfie_url: selfieUrl,
      })
      .select()
      .single()

    if (error) {
      return { data: null, error: handleApiError(error) }
    }

    // Update profile KYC status
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ kyc_status: 'pending' })
      .eq('user_id', userId)

    if (profileError) {
      return { data: null, error: handleApiError(profileError) }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleApiError(error) }
  }
}

export async function getKYCStatus(
  userId: string
): Promise<{ data: KYCVerification | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('kyc_verifications')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      return { data: null, error: handleApiError(error) }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleApiError(error) }
  }
}

export async function uploadKYCDocument(
  file: File,
  userId: string,
  type: string
): Promise<{ data: string | null; error: string | null }> {
  try {
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${type}_${timestamp}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('kyc-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      return { data: null, error: handleStorageError(uploadError) }
    }

    // Return the storage path (not public URL for security)
    return { data: fileName, error: null }
  } catch (error) {
    return { data: null, error: handleStorageError(error) }
  }
}
