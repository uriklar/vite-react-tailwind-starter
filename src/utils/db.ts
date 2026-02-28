import { supabase } from './supabase'

export interface Submission {
  id: string
  user_id: string
  name: string
  bracket: any
  created_at: string
  updated_at: string
}

/**
 * Fetch all submissions from the database.
 */
export const getSubmissions = async (): Promise<Submission[]> => {
  const { data, error } = await supabase.from('submissions').select('*')
  if (error) {
    console.error('Error fetching submissions:', error)
    return []
  }
  return data ?? []
}

/**
 * Fetch a single submission by id.
 */
export const getSubmission = async (id: string): Promise<Submission | null> => {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', id)
    .single()
  if (error) {
    console.error('Error fetching submission:', error)
    return null
  }
  return data
}

/**
 * Upsert a submission (insert or update based on user_id).
 */
export const upsertSubmission = async (
  userId: string,
  name: string,
  bracket: any
): Promise<Submission | null> => {
  const { data, error } = await supabase
    .from('submissions')
    .upsert(
      { user_id: userId, name, bracket, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    .select()
    .single()
  if (error) {
    console.error('Error upserting submission:', error)
    return null
  }
  return data
}

/**
 * Fetch the latest official results from the database.
 * Returns the `results` field of the most recently updated record.
 */
export const getOfficialResults = async (): Promise<any | null> => {
  const { data, error } = await supabase
    .from('official_results')
    .select('results')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()
  if (error) {
    console.error('Error fetching official results:', error)
    return null
  }
  return data?.results ?? null
}
