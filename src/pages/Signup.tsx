import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase_connection'

export default function Signup() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const validate = () => {
    if (displayName.trim().length < 2) return 'Le pseudo doit faire au moins 2 caractères.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email invalide.'
    if (password.length < 8) return 'Mot de passe trop court (min. 8).'
    if (password !== confirm) return 'Les mots de passe ne correspondent pas.'
    return null
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const v = validate()
    if (v) return setError(v)
    setError(null)
    setLoading(true)
    try {
      // 1) créer le compte
      const { data, error: authErr } = await supabase.auth.signUp({ email, password })
      if (authErr) throw authErr
      const uid = data.user?.id
      if (!uid) throw new Error("Création du compte incomplète.")

      // 2) créer le profil
      const { error: profErr } = await supabase.from('profiles').insert({
        id: uid,
        display_name: displayName.trim(),
      })
      if (profErr && profErr.code !== '23505') throw profErr // ignore conflit si déjà créé

      // 3) rediriger
      navigate('/dashboard?welcome=1')
    } catch (err) {
      setError(err.message ?? String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <h1 style={{ marginBottom: 8 }}>Créer un compte</h1>
      <p style={{ color: '#475569', marginTop: 0 }}>Rejoins le PixelBoard et dessine avec nous ✨</p>

      <form onSubmit={onSubmit} className="card" style={{ display: 'grid', gap: 12 }}>
        {error && <div style={{ color: '#b91c1c' }}>{error}</div>}

        <label>
          Pseudo
          <input className="input" value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="ex. Erwan" />
        </label>
        <label>
          Email
          <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="toi@exemple.com" />
        </label>
        <label>
          Mot de passe
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
        </label>
        <label>
          Confirmation
          <input className="input" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="••••••••" />
        </label>

        <button className="btn" disabled={loading}>{loading ? 'Création…' : 'Créer mon compte'}</button>
        <div style={{ fontSize: 14 }}>
          Déjà inscrit ? <Link to="/login">Se connecter</Link>
        </div>
      </form>
    </div>
  )
}
