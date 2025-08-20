import { supabase } from '../../supabase_connection'

export async function placePixel(boardId, x, y, colorIdx) {
  const { error } = await supabase.rpc('place_pixel', {
    p_board_id: boardId,
    p_x: x,
    p_y: y,
    p_color_idx: colorIdx,
  })
  if (error) throw error
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
