// src/components/BoardCanvas.jsx
import React, { useEffect, useRef, useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import { placePixel, subscribePixels } from '../services/pixel'
import { supabase } from '../../supabase_connection'
import { joinPresence, updateMyCursor } from '../services/presence'

export default function BoardCanvas({
  boardId,
  width,
  height,
  palette,
  colorIndex = 1,
  cooldownMs = 0,
  onCooldownStart = () => {},
  currentUser, // { id, name }
}) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  const [scale, setScale] = useState(12)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [hover, setHover] = useState({ x: -1, y: -1 })

  // pixels affichés (clé "x,y" -> color_idx)
  const pixelsRef = useRef(new Map())

  const colors = useMemo(
    () => (Array.isArray(palette) && palette.length ? palette : ['#000', '#fff']),
    [palette]
  )

  // --- presence state (autres curseurs) ---
  const [cursors, setCursors] = useState([]) // [{ id, x, y, color, name }]
  const presenceChannelRef = useRef(null)

  // util: throttling envoi présence
  const lastSentRef = useRef(0)
  const throttlePresence = (fn, minDelayMs) => {
    const now = performance.now()
    if (now - lastSentRef.current > minDelayMs) {
      lastSentRef.current = now
      fn()
    }
  }

  // conversions coordonnées écran -> board
  const screenToBoard = (sx, sy) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = Math.floor((sx - rect.left - offset.x) / scale)
    const y = Math.floor((sy - rect.top - offset.y) / scale)
    return { x, y }
  }

  // applique un pixel dans le buffer local puis redraw
  const applyPixel = (x, y, color_idx) => {
    pixelsRef.current.set(`${x},${y}`, color_idx)
    draw()
  }

  // --- subscribe pixel events (Realtime) ---
  useEffect(() => {
    if (!boardId) return
    const channel = subscribePixels(boardId, (e) => {
      // console.log('[realtime]', e)
      applyPixel(e.x, e.y, e.color_idx)
    })
    return () => { supabase.removeChannel(channel) }
  }, [boardId])

  // --- join presence + sync cursors ---
  useEffect(() => {
    if (!boardId || !currentUser?.id) return
    const me = {
      id: currentUser.id,
      name: currentUser.name || 'user',
      color: colors[colorIndex % colors.length] || '#fff',
    }
    presenceChannelRef.current = joinPresence(boardId, me, (state) => {
      const list = []
      Object.entries(state).forEach(([uid, arr]) => {
        const last = arr[arr.length - 1]
        if (!last) return
        list.push({ id: uid, ...last })
      })
      setCursors(list)
      // redraw pour afficher/mettre à jour les curseurs
      draw()
    })
    return () => {
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current)
        presenceChannelRef.current = null
      }
    }
  }, [boardId, currentUser?.id])

  // si la couleur sélectionnée change, mets à jour la présence au prochain move
  useEffect(() => {
    lastSentRef.current = 0 // force prochain envoi immédiat
  }, [colorIndex])

  // --- dessin principal ---
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
    ctx.fillStyle = '#0b1220'
    ctx.fillRect(0, 0, cw, ch)

    // zone du board
    ctx.save()
    ctx.translate(offset.x, offset.y)
    ctx.fillStyle = '#111827'
    ctx.fillRect(0, 0, width * scale, height * scale)

    // pixels
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
        ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, height * scale); ctx.stroke()
      }
      for (let y = 0; y <= height; y++) {
        const py = Math.floor(y * scale) + 0.5
        ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(width * scale, py); ctx.stroke()
      }
    }

    // hover highlight
    if (hover.x >= 0 && hover.y >= 0 && hover.x < width && hover.y < height) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      ctx.fillRect(hover.x * scale, hover.y * scale, scale, scale)
    }

    // ghost cursors (autres utilisateurs)
    for (const c of cursors) {
      if (c.id === currentUser?.id) continue // ignore notre propre curseur (option)
      if (c.x == null || c.y == null) continue
      // position en pixels écran
      const sx = offset.x + c.x * scale
      const sy = offset.y + c.y * scale

      // petit rectangle + contour
      ctx.fillStyle = c.color || '#fff'
      ctx.globalAlpha = 0.8
      ctx.fillRect(sx, sy, scale, scale)
      ctx.globalAlpha = 1
      ctx.strokeStyle = '#000'
      ctx.strokeRect(sx + 0.5, sy + 0.5, scale - 1, scale - 1)

      // label
      if (scale >= 10) {
        ctx.font = '12px system-ui, sans-serif'
        ctx.fillStyle = 'rgba(0,0,0,0.7)'
        ctx.fillRect(sx + scale + 4, sy - 2, ctx.measureText(c.name || 'user').width + 8, 16)
        ctx.fillStyle = '#fff'
        ctx.fillText(c.name || 'user', sx + scale + 8, sy + 10)
      }
    }

    ctx.restore()
  }

  // redraw sur resize et changements d'état
  useEffect(() => {
    const ro = new ResizeObserver(() => draw())
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [width, height, scale, offset, hover, colors, cursors])

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
        if (cooldownMs > 0) return // bloque pendant cooldown
        const { x, y } = screenToBoard(e.clientX, e.clientY)
        if (x >= 0 && y >= 0 && x < width && y < height) {
          try {
            // 1) dessiner optimiste
            applyPixel(x, y, colorIndex)
            // 2) envoyer au serveur
            await placePixel(boardId, x, y, colorIndex)
            onCooldownStart(2000) // cooldown visuel 2s
          } catch (err) {
            // revert si erreur
            pixelsRef.current.delete(`${x},${y}`); draw()
            if (String(err.message || '').toLowerCase().includes('cooldown')) onCooldownStart(1500)
            else alert(err.message)
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

        // publier notre position (throttle 10 Hz)
        throttlePresence(() => {
          if (presenceChannelRef.current && currentUser?.id) {
            updateMyCursor(presenceChannelRef.current, {
              x: Math.max(0, Math.min(width - 1, p.x)),
              y: Math.max(0, Math.min(height - 1, p.y)),
              color: colors[colorIndex % colors.length] || '#fff',
              name: currentUser.name || 'user',
            })
          }
        }, 100)
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
  }, [scale, offset, hover, width, height, boardId, colorIndex, cooldownMs, currentUser, colors])

  return (
    <div ref={containerRef} className="canvas-wrap">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', cursor: cooldownMs > 0 ? 'not-allowed' : 'crosshair' }}
        aria-label="Pixel board"
      />
    </div>
  )
}

BoardCanvas.propTypes = {
  boardId: PropTypes.string.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  palette: PropTypes.array.isRequired,
  colorIndex: PropTypes.number,
  cooldownMs: PropTypes.number,
  onCooldownStart: PropTypes.func,
  currentUser: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
  }),
}
