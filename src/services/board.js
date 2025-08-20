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
