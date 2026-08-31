import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { fetchAllRows } from '../lib/fetchAllRows'
import { useAuth } from '../context/AuthContext'
import { ALL_CARDS } from '../lib/catalog'

export interface SendLogRow {
  id: number
  sender_name: string
  recipient_name: string
  card_id: string
  sent_at: string
  undone: boolean
  undone_at: string | null
}

const CARD_IDS = ALL_CARDS.map((c) => c.id)

export function useSendLogQuery() {
  return useQuery({
    queryKey: ['send_log'],
    queryFn: async () =>
      fetchAllRows<SendLogRow>((from, to) =>
        supabase
          .from('send_log')
          .select('id, sender_name, recipient_name, card_id, sent_at, undone, undone_at')
          .in('card_id', CARD_IDS)
          .order('sent_at', { ascending: false })
          .range(from, to),
      ),
  })
}

export function useLogSend() {
  const { auth } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ recipient, cardId }: { recipient: string; cardId: string }) => {
      if (!auth) throw new Error('Not logged in')
      const { error } = await supabase.rpc('log_send', {
        p_sender: auth.member,
        p_recipient: recipient,
        p_card_id: cardId,
        p_passphrase: auth.passphrase,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['send_log'] })
      queryClient.invalidateQueries({ queryKey: ['ownership'] })
    },
  })
}

export function useUndoSend() {
  const { auth } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sendId: number) => {
      if (!auth) throw new Error('Not logged in')
      const { error } = await supabase.rpc('undo_send', {
        p_send_id: sendId,
        p_passphrase: auth.passphrase,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['send_log'] })
      queryClient.invalidateQueries({ queryKey: ['ownership'] })
    },
  })
}
