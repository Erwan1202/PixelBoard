import React from 'react'
import { useEffect } from 'react'

export default function AuthCallback() {
  useEffect(() => {
    const timer = setTimeout(() => { window.location.replace('/') }, 500)
    return () => clearTimeout(timer)
  }, [])
  return <div className="p-6">Connexion en cours…</div>
}
