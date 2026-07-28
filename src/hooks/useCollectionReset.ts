import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export interface CollectionResetRow {
  member_name: string
  lap_number: number
  reset_at: string
}

export function useLapQuery() {
  return useQuery({
    queryKey: ['collection_resets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collection_resets')
        .select('member_name, lap_number, reset_at')
      if (error) throw error
      return data as CollectionResetRow[]
    },
  })
}

export function currentLap(rows: CollectionResetRow[], member: string): number {
  return rows.filter((r) => r.member_name === member).length + 1
}

export function useResetCollection() {
  const { auth } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!auth) throw new Error('Not logged in')
      const { error } = await supabase.rpc('reset_collection', {
        p_member: auth.member,
        p_passphrase: auth.passphrase,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownership'] })
      queryClient.invalidateQueries({ queryKey: ['collection_resets'] })
    },
  })
}
