// src/components/BoardCanvas.jsx
import React, { useEffect, useRef, useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import { placePixel, subscribePixels } from '../services/pixel'
import { supabase } from '../../supabase_connection'

/**
 * BoardCanvas
 * - Zoom/pan (molette + shift+drag ou clic milieu)
 * - Survol pixel (highlight)
 * - Clic => place_pixel (RPC) ; maj live via Realtime
 * - DPI aware + resize observer
 */
export default function BoardCanvas({ boardId, width, height, palette, colorIndex = 1 }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  const [scale, setScale] = useState(12) // px par “pixel” de la grille
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [hover, setHover] = useState({ x: -1, y: -1 })

  // Etat local des pixels affichés (clé "x,y" -> color_idx)
  const pixelsRef = useRef(new Map())

  const colors = useMemo(
    () => (Array.isArray(palette) && palette.length ? palette : ['#000', '#fff']),
    [palette]
  )

  // --- Helpers ---
  const screenToBoard = (sx, sy) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = Math.floor((sx - rect.left - offset.x) / scale)
    const y = Math.floor((sy - rect.top - offset.y) / scale)
    return { x, y }
  }

  const applyPixel = (x, y, color_idx) => {
    pixelsRef.current.set(`${x},${y}`, color_idx)
    draw()
  }

  // --- Realtime subscribe ---
  useEffect(() => {
    if (!boardId) return
    const channel = subscribePixels(boardId, (e) => applyPixel(e.x, e.y, e.color_idx))
    return () => {
      // v2 API : removeChannel pour se désabonner proprement
      supabase.removeChannel(channel)
    }
  }, [boardId])

  // --- Dessin ---
  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    const dpr = window.devicePixelRatio || 1
    const cw = canvas.clientWidth
    const ch = canvas.clientHeight
    if (canvas.width !== Math.floor(cw * dpr) || canvas.height !== Math.floor(ch * dpr)) {
      canvas.width = Math.floor(cw * dpr)
      canvas.height = Math.floor(ch * dpr)
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // fond
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, cw, ch)

    // zone du board
    ctx.save()
    ctx.translate(offset.x, offset.y)
    ctx.fillStyle = '#111827'
    ctx.fillRect(0, 0, width * scale, height * scale)

    // pixels (état local)
    for (const [key, cidx] of pixelsRef.current) {
      const [x, y] = key.split(',').map(Number)
      ctx.fillStyle = colors[cidx % colors.length]
      ctx.fillRect(x * scale, y * scale, scale, scale)
    }

    // grille légère
    if (scale >= 8) {
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 1
      for (let x = 0; x <= width; x++) {
        const px = Math.floor(x * scale) + 0.5
        ctx.beginPath()
        ctx.moveTo(px, 0)
        ctx.lineTo(px, height * scale)
        ctx.stroke()
      }
      for (let y = 0; y <= height; y++) {
        const py = Math.floor(y * scale) + 0.5
        ctx.beginPath()
        ctx.moveTo(0, py)
        ctx.lineTo(width * scale, py)
        ctx.stroke()
      }
    }

    // highlight hover
    if (hover.x >= 0 && hover.y >= 0 && hover.x < width && hover.y < height) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      ctx.fillRect(hover.x * scale, hover.y * scale, scale, scale)
    }

    ctx.restore()
  }

  // redraw sur resize et changements d'état
  useEffect(() => {
    const ro = new ResizeObserver(() => draw())
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [width, height, scale, offset, hover, colors])

  useEffect(() => { draw() })

  // interactions
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let dragging = false
    let start = { x: 0, y: 0 }
    let startOffset = { ...offset }

    const onPointerDown = async (e) => {
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        // pan
        dragging = true
        start = { x: e.clientX, y: e.clientY }
        startOffset = { ...offset }
      } else if (e.button === 0) {
        // paint -> RPC place_pixel
        const { x, y } = screenToBoard(e.clientX, e.clientY)
        if (x >= 0 && y >= 0 && x < width && y < height) {
          try {
            await placePixel(boardId, x, y, colorIndex)
            // Pas besoin d'appliquer localement : l'event Realtime arrive et met à jour
          } catch (err) {
            alert(err.message) // affichage simple pour debug (cooldown, etc.)
          }
        }
      }
    }

    const onPointerMove = (e) => {
      if (dragging) {
        setOffset({
          x: startOffset.x + (e.clientX - start.x),
          y: startOffset.y + (e.clientY - start.y),
        })
      } else {
        const p = screenToBoard(e.clientX, e.clientY)
        if (p.x !== hover.x || p.y !== hover.y) setHover(p)
      }
    }

    const onPointerUp = () => { dragging = false }

    const onWheel = (e) => {
      e.preventDefault()
      const old = scale
      const dir = Math.sign(e.deltaY)
      const next = Math.min(40, Math.max(4, old + dir * -1 * (old >= 16 ? 2 : 1)))
      if (next === old) return

      // zoom centré souris
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const wx = (mx - offset.x) / old
      const wy = (my - offset.y) / old
      setScale(next)
      setOffset({ x: mx - wx * next, y: my - wy * next })
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [scale, offset, hover, width, height, boardId, colorIndex])

  return (
    <div ref={containerRef} className="w-full h-[70vh] md:h-[78vh] border rounded-xl bg-slate-900 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none cursor-crosshair"
        aria-label="Pixel board"
      />
      <div className="absolute hidden" aria-hidden />
    </div>
  )
}

BoardCanvas.propTypes = {
  boardId: PropTypes.string.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  palette: PropTypes.array.isRequired,
  colorIndex: PropTypes.number, // index dans la palette (par défaut 1)
}
