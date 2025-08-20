// src/pages/BoardPage.jsx
import { useEffect, useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { getBoardById } from '../services/board'
import BoardCanvas from '../components/BoardCanva'
import Palette from '../components/Palette'
import { useAuthStore } from '../state/UseAuthStore'
import React from 'react'

const DEFAULT_PALETTE = ['#000','#fff','#f00','#0f0','#00f','#ff0','#f0f','#0ff']

export default function BoardPage() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const [searchParams] = useSearchParams()
  const [board, setBoard] = useState(null)
  const [colorIndex, setColorIndex] = useState(0)
  const [cooldownMs, setCooldownMs] = useState(0)

  // cooldown visuel
  useEffect(() => {
    if (cooldownMs <= 0) return
    const t = setInterval(() => setCooldownMs(c => Math.max(0, c - 100)), 100)
    return () => clearInterval(t)
  }, [cooldownMs])

  // charge le board
  useEffect(() => {
    let alive = true
    getBoardById(id).then(b => { if (alive) setBoard(b) })
    return () => { alive = false }
  }, [id])

  if (!board) return <div className="container">Chargement…</div>

  const palette = (board.palette?.length ? board.palette : DEFAULT_PALETTE)

  // --- NEW: deep-link lecture ---
  const qx = Number(searchParams.get('x'))
  const qy = Number(searchParams.get('y'))
  const qz = Number(searchParams.get('z')) // échelle au chargement (taille d’un pixel en px)
  const initialView =
    Number.isFinite(qx) && Number.isFinite(qy)
      ? { x: qx, y: qy, z: Number.isFinite(qz) ? qz : undefined }
      : undefined

  // --- NEW: share handler (copie presse‑papiers) ---
  const handleShare = ({ x, y, z }) => {
    const url = `${location.origin}/board/${board.id}?x=${x}&y=${y}&z=${Math.round(z)}`
    navigator.clipboard.writeText(url).then(
      () => console.log('Lien copié:', url),
      () => alert(url) // fallback si permissions bloquées
    )
  }

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
          currentUser={{ id: user?.id, name: user?.email || 'user' }}

          /* NEW */
          initialView={initialView}
          onShare={handleShare}
        />
      </div>
    </div>
  )
}
