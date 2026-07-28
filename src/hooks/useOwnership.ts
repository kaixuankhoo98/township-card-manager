import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { ALL_CARDS } from '../lib/catalog'

export interface OwnershipRow {
  member_name: string
  card_id: string
  owned: boolean
}

const CARD_IDS = ALL_CARDS.map((c) => c.id)

export function useOwnershipQuery() {
  return useQuery({
    queryKey: ['ownership'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ownership')
        .select('member_name, card_id, owned')
        .in('card_id', CARD_IDS)
      if (error) throw error
      return data as OwnershipRow[]
    },
  })
}

export function ownersOf(rows: OwnershipRow[], cardId: string): string[] {
  return rows.filter((r) => r.card_id === cardId && r.owned).map((r) => r.member_name)
}

export function isOwnedBy(rows: OwnershipRow[], member: string, cardId: string): boolean {
  return rows.some((r) => r.card_id === cardId && r.member_name === member && r.owned)
}

export function useSetOwnership() {
  const { auth } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ cardId, owned }: { cardId: string; owned: boolean }) => {
      if (!auth) throw new Error('Not logged in')
      const { error } = await supabase.rpc('set_ownership', {
        p_member: auth.member,
        p_card_id: cardId,
        p_owned: owned,
        p_passphrase: auth.passphrase,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownership'] })
    },
  })
}
