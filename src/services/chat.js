
import { supabase } from '../supabase_connection'

export const subChat = (boardId, onMsg) =>
  supabase.channel(`chat:${boardId}`)
    .on('postgres_changes',
      { event:'INSERT', schema:'public', table:'messages', filter:`board_id=eq.${boardId}` },
      p => onMsg(p.new))
    .subscribe()

export async function sendMsg(boardId, text) {
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('messages').insert({ board_id: boardId, user_id: user.id, body: text })
  if (error) throw error
}
