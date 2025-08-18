import React from 'react'
import { useEffect } from 'react'
import { useAuthStore } from './state/UseAuthStore'
import LoginPage from './pages/LoginPage'

export default function App() {
  const { init, user, loading } = useAuthStore()

  useEffect(() => { init() }, [])

  if (loading) return <div className="p-6">Chargement…</div>
  return user ? <Dashboard/> : <LoginPage/>
}

function Dashboard() {
  return <div className="p-6">Connecté ✅</div>
}
