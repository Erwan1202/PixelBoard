import { useAuthStore } from '../state/UseAuthStore'
import React from 'react'

export default function Dashboard() {
  const { user, signOut } = useAuthStore()
  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">PixelBoard</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-70">{user?.email}</span>
          <button className="border px-3 py-1 rounded" onClick={signOut}>Se déconnecter</button>
        </div>
      </div>
      <div className="mt-6">Bienvenue 🔓</div>
    </div>
  )
}
