import { useEffect, useState } from 'react'
import { listBoards, createBoard } from '../services/board'
import React from 'react'


export default function BoardsPanel() {
  const [boards, setBoards] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('Mon premier board')

  const refresh = async () => {
    setLoading(true)
    try { setBoards(await listBoards()) } finally { setLoading(false) }
  }

  useEffect(() => { refresh() }, [])

  const onCreate = async (e) => {
    e.preventDefault()
    try {
      await createBoard({ name })
      setName('Mon board')
      await refresh()
    } catch (e) { alert(e.message) }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onCreate} className="flex items-center gap-2">
        <input className="border rounded px-3 py-2 w-full" value={name} onChange={e=>setName(e.target.value)} />
        <button className="bg-black text-white px-3 py-2 rounded">Créer</button>
      </form>

      {loading ? (
        <div className="text-sm text-gray-500">Chargement…</div>
      ) : boards.length === 0 ? (
        <div className="text-sm text-gray-500">Aucun board pour l’instant.</div>
      ) : (
        <ul className="grid md:grid-cols-2 gap-3">
          {boards.map(b => (
            <li key={b.id} className="border rounded-lg p-3 hover:shadow-sm">
              <div className="font-medium">{b.name}</div>
              <div className="text-xs text-gray-500">{b.width}×{b.height} • {b.visibility}</div>
              <a href={`/board/${b.id}`} className="inline-block mt-2 text-sm underline">Ouvrir</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
