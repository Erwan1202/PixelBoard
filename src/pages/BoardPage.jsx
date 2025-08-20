import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getBoardById } from '../services/board'
import BoardCanvas from '../components/BoardCanva'
import Palette from '../components/Palette'
import { useAuthStore } from '../state/UseAuthStore'
import React from 'react'

export default function BoardPage() {
  const { id } = useParams()
  useAuthStore()
  const [board, setBoard] = useState(null)

  // état pour la couleur sélectionnée
  const [colorIndex, setColorIndex] = useState(0)
  // état pour cooldown (en millisecondes)
  const [cooldownMs, setCooldownMs] = useState(0)

  // décrémente le cooldown chaque 100ms
  useEffect(() => {
    if (cooldownMs <= 0) return
    const t = setInterval(() => {
      setCooldownMs((c) => Math.max(0, c - 100))
    }, 100)
    return () => clearInterval(t)
  }, [cooldownMs])

  // charge le board depuis la BDD
  useEffect(() => {
    async function load() {
      const b = await getBoardById(id)
      setBoard(b)
    }
    load()
  }, [id])

  if (!board) return <div className="p-6">Chargement…</div>

  return (
    <div className="p-4 space-y-4">
      <Link to="/" className="text-indigo-500 underline">← Retour</Link>

      <h1 className="text-2xl font-bold">{board.name}</h1>

      {/* Palette de couleurs avec feedback cooldown */}
      <Palette
        colors={['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']}
        selected={colorIndex}
        onSelect={setColorIndex}
        cooldownMs={cooldownMs}
      />

      {/* Le canvas avec la grille */}
      <BoardCanvas
        boardId={board.id}
        width={board.width}
        height={board.height}
        palette={['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']}
        colorIndex={colorIndex}
        cooldownMs={cooldownMs}
        onCooldownStart={(ms) => setCooldownMs(ms)}
      />
    </div>
  )
}
