import { supabase } from '../../supabase_connection'

export async function listBoards() {
  const { data, error } = await supabase
    .from('boards')
    .select('id,name,width,height,visibility,created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createBoard({ name, width = 100, height = 100, palette, visibility = 'public' }) {
  const defaultPalette = palette ?? ["#000000","#ffffff","#ff0000","#00ff00","#0000ff"]
  const { data, error } = await supabase
    .from('boards')
    .insert([{ name, width, height, visibility, palette: defaultPalette, owner_id: (await supabase.auth.getUser()).data.user.id }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getBoardById(id) {
  const { data, error } = await supabase
    .from('boards')
    .select('id,name,width,height,palette')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getAllBoards() {
  const { data, error } = await supabase
    .from('boards')
    .select('id,name,width,height,created_at,owner_id')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getPixelCounts() {
  const { data, error } = await supabase
    .from('board_pixel_counts')
    .select('board_id, pixel_count')
  if (error) throw error
  const map = new Map()
  for (const row of data) map.set(row.board_id, row.pixel_count)
  return map
}