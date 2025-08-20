import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getBoardById } from '../services/board'
import BoardCanvas from '../components/BoardCanva'
import { useAuthStore } from '../state/UseAuthStore' // <-- important
import React from 'react'

export default function BoardPage() {
  const { id } = useParams()
  const { user } = useAuthStore()               // <-- récupère l'utilisateur connecté
  const [board, setBoard] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    getBoardById(id)
      .then(b => { if (alive) setBoard(b) })
      .catch(e => { if (alive) setError(e.message) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [id])

  if (loading) return <div className="p-6">Chargement…</div>
  if (error) return <div className="p-6 text-red-600">Erreur : {error}</div>
  if (!board) return <div className="p-6">Board introuvable.</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <Link to="/" className="text-sm underline text-gray-600">← Retour</Link>
            <h1 className="text-2xl font-bold">{board.name}</h1>
            <div className="text-xs text-gray-500">{board.width}×{board.height}</div>
          </div>
        </div>

        <BoardCanvas
          boardId={board.id}           // <-- requis pour realtime/RPC
          width={board.width}
          height={board.height}
          palette={board.palette}
          colorIndex={1}               // TODO: reliera à une palette UI
        />

        <p className="text-sm text-gray-500 mt-3">
          Connecté en tant que {user?.email ?? 'invité'} — molette = zoom • shift + drag = pan • clic = peindre
        </p>
      </div>
    </div>
  )
}
