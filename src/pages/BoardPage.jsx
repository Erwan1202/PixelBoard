// src/pages/BoardPage.jsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getBoardById } from '../services/board'
import BoardCanvas from '../components/BoardCanva'
import Palette from '../components/Palette'
import { useAuthStore } from '../state/UseAuthStore'   // <-- IMPORTANT
import React from 'react'


const DEFAULT_PALETTE = [
  '#000000','#ffffff','#ff0000','#00ff00','#0000ff',
  '#ffff00','#ff00ff','#00ffff'
]

export default function BoardPage() {
  const { id } = useParams()
  const { user } = useAuthStore()                     // <-- on récupère l'utilisateur
  const [board, setBoard] = useState(null)
  const [colorIndex, setColorIndex] = useState(0)
  const [cooldownMs, setCooldownMs] = useState(0)

  // décrémente le cooldown
  useEffect(() => {
    if (cooldownMs <= 0) return
    const t = setInterval(() => setCooldownMs((c) => Math.max(0, c - 100)), 100)
    return () => clearInterval(t)
  }, [cooldownMs])

  // charge le board
  useEffect(() => {
    let alive = true
    getBoardById(id)
      .then(b => { if (alive) setBoard(b) })
      .catch(err => alert(err.message))
    return () => { alive = false }
  }, [id])

  if (!board) return <div className="container">Chargement…</div>

  // palette provenant du board si dispo, sinon défaut
  const palette = Array.isArray(board.palette) && board.palette.length
    ? board.palette
    : DEFAULT_PALETTE

  return (
    <div className="container">
      <Link to="/">← Retour</Link>
      <h1 className="text-2xl font-bold">{board.name}</h1>

      <Palette
        colors={palette}
        selected={colorIndex}
        onSelect={setColorIndex}
        cooldownMs={cooldownMs}
      />

      <div style={{ marginTop: 12 }}>
        <BoardCanvas
          boardId={board.id}
          width={board.width}
          height={board.height}
          palette={palette}
          colorIndex={colorIndex}
          cooldownMs={cooldownMs}
          onCooldownStart={(ms) => setCooldownMs(ms)}
          currentUser={{ id: user?.id, name: user?.email || 'user' }}  // <-- on passe l'user ici
        />
      </div>
    </div>
  )
}
