import { supabase } from '../../supabase_connection'

// src/services/pixels.js
export async function placePixel(boardId, x, y, color_idx) {
  const { data, error, status, statusText } = await supabase
    .rpc('place_pixel', { board_id: boardId, x, y, color_idx }) // <-- adapte les noms EXACTS attendus
  if (error) {
    console.error('place_pixel RPC error:', { status, statusText, error })
    throw error
  }
  return data
}




export function subscribePixels(boardId, onPixel) {
  const channel = supabase
    .channel(`board:${boardId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'pixel_events',
        filter: `board_id=eq.${boardId}`,
      },
      (payload) => {
        const e = payload.new
        onPixel({
          x: e.x,
          y: e.y,
          color_idx: e.color_idx,
          user_id: e.user_id,
          created_at: e.created_at,
        })
      }
    )
    .subscribe()
  return channel
}


export async function loadPixelHistory(boardId, limit = 100000) {
  const { data, error } = await supabase
    .from('pixel_events')
    .select('x,y,color_idx,created_at')
    .eq('board_id', boardId)
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) throw error
  return data
}

export async function loadCurrentPixels(boardId) {
  const { data, error } = await supabase
    .from('current_pixels')
    .select('x,y,color_idx')
    .eq('board_id', boardId)
  if (error) throw error
  return data
}
