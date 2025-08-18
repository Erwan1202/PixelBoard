import { React, useState } from 'react'
import { supabase } from '../../supabase_connection'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const signUp = async (e) => {
    e.preventDefault(); setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    alert(error ? error.message : 'Compte créé ! Vérifie tes emails si la confirmation est activée.')
  }
  const signIn = async (e) => {
    e.preventDefault(); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) alert(error.message)
  }
  const magicLink = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` }
    })
    setLoading(false)
    alert(error ? error.message : 'Lien magique envoyé.')
  }
  const github = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${location.origin}/auth/callback` }
    })
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-100">
      <form className="w-full max-w-sm bg-white p-6 rounded-xl shadow space-y-3">
        <h1 className="text-xl font-semibold">Connexion / Inscription</h1>
        <input className="w-full border p-2 rounded" placeholder="email"
               value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border p-2 rounded" placeholder="mot de passe" type="password"
               value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="w-full bg-black text-white p-2 rounded" onClick={signIn} disabled={loading}>Se connecter</button>
        <button className="w-full border p-2 rounded" onClick={signUp} disabled={loading}>Créer un compte</button>
        <div className="h-px bg-gray-200" />
        <button className="w-full border p-2 rounded" type="button" onClick={magicLink} disabled={loading}>
          Recevoir un lien magique ✉️
        </button>
        <button className="w-full border p-2 rounded" type="button" onClick={github}>
          Continuer avec GitHub
        </button>
      </form>
    </div>
  )
}
