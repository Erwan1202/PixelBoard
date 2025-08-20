import { useAuthStore } from '../state/UseAuthStore'
import React from 'react'


export default function Header() {
  const { user, signOut } = useAuthStore()
  return (
    <header className="h-14 px-4 border-b flex items-center justify-between">
      <h1 className="font-semibold">PixelBoard</h1>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">{user?.email}</span>
        <button onClick={signOut} className="border px-3 py-1 rounded hover:bg-gray-50">Se déconnecter</button>
      </div>
    </header>
  )
}
