import { supabase } from '../../supabase_connection'

export function joinPresence(boardId, me, onSync) {
  const channel = supabase.channel(`presence:board:${boardId}`, {
    config: { presence: { key: me.id } },
  })

  channel.on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState() 
    onSync(state)
  })

  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ x: 0, y: 0, color: me.color, name: me.name })
    }
  })

  return channel
}

export function updateMyCursor(channel, data) {
  if (!channel) return
  channel.track(data)
}
