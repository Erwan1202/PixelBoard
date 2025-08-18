import { React, useEffect } from 'react'
export default function AuthCallback() {
  useEffect(() => {
    const t = setTimeout(() => window.location.replace('/'), 400)
    return () => clearTimeout(t)
  }, [])
  return <div className="p-6">Connexion en cours…</div>
}
