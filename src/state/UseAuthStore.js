import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set) => ({
  session: null,
  user: null,
  loading: true,
  init: async () => {
    const { data } = await supabase.auth.getSession()
    set({ session: data.session, user: data.session?.user ?? null, loading: false })
    supabase.auth.onAuthStateChange((_evt, session) => {
      set({ session, user: session?.user ?? null })
    })
  },
  signOut: async () => { await supabase.auth.signOut() }
}))
