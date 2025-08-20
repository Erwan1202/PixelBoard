
import { supabase } from '../../supabase_connection'

export function joinPresence(boardId, me) {
  const channel = supabase.channel(`presence:board:${boardId}`, { config: { presence: { key: me.id } }})
  channel.on('presence', { event: 'sync' }, () => {
    channel.presenceState()
  })
  channel.subscribe(async status => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ x: 0, y: 0, color: me.colorIdx, name: me.name })
    }
  })
  return channel
}

export function updateCursor(channel, { x, y, color }) {
  channel.track({ x, y, color }) 
}
