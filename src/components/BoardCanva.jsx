// src/components/BoardCanvas.jsx
import React, { useEffect, useRef, useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import { placePixel, subscribePixels, loadCurrentPixels } from '../services/pixel'
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
  initialView, // { x, y, z? }
  onShare,
}) {
  const canvasRef = useRef(null)
  const miniRef = useRef(null)          // <-- mini-map
  const containerRef = useRef(null)

  const [scale, setScale] = useState(12)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [hover, setHover] = useState({ x: -1, y: -1 })

  const pixelsRef = useRef(new Map())
  const colors = useMemo(() => (Array.isArray(palette) && palette.length ? palette : ['#000', '#fff']), [palette])

  const [cursors, setCursors] = useState([])
  const presenceChannelRef = useRef(null)

  const lastSentRef = useRef(0)
  const throttlePresence = (fn, minDelayMs) => {
    const now = performance.now()
    if (now - lastSentRef.current > minDelayMs) { lastSentRef.current = now; fn() }
  }

  const screenToBoard = (sx, sy) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = Math.floor((sx - rect.left - offset.x) / scale)
    const y = Math.floor((sy - rect.top - offset.y) / scale)
    return { x, y }
  }

  const centerOn = (x, y, z) => {
    const cont = containerRef.current
    if (!cont) return
    const s = Number.isFinite(z) ? z : scale
    if (Number.isFinite(z)) setScale(z)
    const cx = cont.clientWidth / 2
    const cy = cont.clientHeight / 2
    setOffset({
      x: Math.round(cx - (x + 0.5) * s),
      y: Math.round(cy - (y + 0.5) * s),
    })
  }

  const applyPixel = (x, y, color_idx) => { pixelsRef.current.set(`${x},${y}`, color_idx); draw() }

useEffect(() => {
  let alive = true
  async function preload() {
    if (!boardId) return
    try {
      const rows = await loadCurrentPixels(boardId)
      if (!alive) return
      pixelsRef.current.clear()
      for (const e of rows) {
        pixelsRef.current.set(`${e.x},${e.y}`, e.color_idx)
      }
      draw()
    } catch (e) {
      console.error('preload error:', e)
    }
  }
  preload()
  return () => { alive = false }
}, [boardId])



  useEffect(() => {
    if (!boardId) return
    const channel = subscribePixels(boardId, (e) => applyPixel(e.x, e.y, e.color_idx))
    return () => { supabase.removeChannel(channel) }
  }, [boardId])

  useEffect(() => {
    if (!boardId || !currentUser?.id) return
    const me = { id: currentUser.id, name: currentUser.name || 'user', color: colors[colorIndex % colors.length] || '#fff' }
    presenceChannelRef.current = joinPresence(boardId, me, (state) => {
      const list = []
      Object.entries(state).forEach(([uid, arr]) => { const last = arr.at(-1); if (last) list.push({ id: uid, ...last }) })
      setCursors(list); draw()
    })
    return () => { if (presenceChannelRef.current) supabase.removeChannel(presenceChannelRef.current) }
  }, [boardId, currentUser?.id])

  useEffect(() => {
    if (!initialView) return
    const { x, y, z } = initialView
    if (Number.isFinite(x) && Number.isFinite(y)) setTimeout(() => centerOn(x, y, z), 0)
  }, [initialView?.x, initialView?.y, initialView?.z])

  // ---------- RENDERING ----------
  const drawMiniMap = () => {
    const mini = miniRef.current
    if (!mini) return
    const ctx = mini.getContext('2d')
    const W = mini.width = 200
    const H = mini.height = 200
    // fond
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, W, H)
    // zone board
    ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, W, H)
    const s = Math.min(W / width, H / height) // échelle mini
    // pixels
    for (const [key, cidx] of pixelsRef.current) {
      const [x, y] = key.split(',').map(Number)
      ctx.fillStyle = colors[cidx % colors.length]
      ctx.fillRect(Math.floor(x * s), Math.floor(y * s), Math.ceil(s), Math.ceil(s))
    }
    // viewport rectangle
    const cont = containerRef.current
    if (!cont) return
    const viewW = cont.clientWidth / scale
    const viewH = cont.clientHeight / scale
    const vx = Math.max(0, Math.min(width - viewW, -offset.x / scale))
    const vy = Math.max(0, Math.min(height - viewH, -offset.y / scale))
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2
    ctx.strokeRect(vx * s, vy * s, viewW * s, viewH * s)
  }

  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    const dpr = window.devicePixelRatio || 1
    const cw = canvas.clientWidth, ch = canvas.clientHeight
    if (canvas.width !== Math.floor(cw * dpr) || canvas.height !== Math.floor(ch * dpr)) {
      canvas.width = Math.floor(cw * dpr); canvas.height = Math.floor(ch * dpr)
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, cw, ch)

    ctx.save(); ctx.translate(offset.x, offset.y)
    ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, width * scale, height * scale)

    for (const [key, cidx] of pixelsRef.current) {
      const [x, y] = key.split(',').map(Number)
      ctx.fillStyle = colors[cidx % colors.length]
      ctx.fillRect(x * scale, y * scale, scale, scale)
    }

    if (scale >= 8) {
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1
      for (let x = 0; x <= width; x++) { const px = Math.floor(x * scale) + 0.5; ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, height * scale); ctx.stroke() }
      for (let y = 0; y <= height; y++) { const py = Math.floor(y * scale) + 0.5; ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(width * scale, py); ctx.stroke() }
    }

    if (hover.x >= 0 && hover.y >= 0 && hover.x < width && hover.y < height) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      ctx.fillRect(hover.x * scale, hover.y * scale, scale, scale)
    }

    // ghost cursors
    ctx.font = '12px system-ui, sans-serif'; ctx.textBaseline = 'top'
    for (const c of cursors) {
      if (c.id === currentUser?.id) continue
      if (c.x == null || c.y == null) continue
      const sx = offset.x + c.x * scale, sy = offset.y + c.y * scale
      ctx.fillStyle = c.color || '#fff'; ctx.globalAlpha = .8; ctx.fillRect(sx, sy, scale, scale)
      ctx.globalAlpha = 1; ctx.strokeStyle = '#000'; ctx.strokeRect(sx + .5, sy + .5, scale - 1, scale - 1)
      if (scale >= 10) {
        const text = c.name || 'user', pad = 4, tw = ctx.measureText(text).width
        ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(sx + scale + 4, sy - 2, tw + pad * 2, 16)
        ctx.fillStyle = '#fff'; ctx.fillText(text, sx + scale + 4 + pad, sy)
      }
    }
    ctx.restore()

    drawMiniMap()
  }

  useEffect(() => {
    const ro = new ResizeObserver(() => draw())
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [width, height, scale, offset, hover, colors, cursors])
  useEffect(() => { draw() }, [width, height, scale, offset, hover])

  // ---------- INTERACTIONS ----------
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let dragging = false
    let start = { x: 0, y: 0 }
    let startOffset = { ...offset }

    const onPointerDown = async (e) => {
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        dragging = true; start = { x: e.clientX, y: e.clientY }; startOffset = { ...offset }
      } else if (e.button === 0) {
        if (cooldownMs > 0) return
        const { x, y } = screenToBoard(e.clientX, e.clientY)
        if (x >= 0 && y >= 0 && x < width && y < height) {
          try {
            applyPixel(x, y, colorIndex)
            await placePixel(boardId, x, y, colorIndex)
            onCooldownStart(2000)
          } catch (err) {
            pixelsRef.current.delete(`${x},${y}`); draw()
            if (String(err.message || '').toLowerCase().includes('cooldown')) onCooldownStart(1500)
            else alert(err.message)
          }
        }
      }
    }

    const onPointerMove = (e) => {
      if (dragging) {
        setOffset({ x: startOffset.x + (e.clientX - start.x), y: startOffset.y + (e.clientY - start.y) })
      } else {
        const p = screenToBoard(e.clientX, e.clientY)
        if (p.x !== hover.x || p.y !== hover.y) setHover(p)
        throttlePresence(() => {
          if (presenceChannelRef.current && currentUser?.id) {
            updateMyCursor(presenceChannelRef.current, {
              x: Math.max(0, Math.min(width - 1, p.x)),
              y: Math.max(0, Math.min(height - 1, p.y)),
              color: colors[colorIndex % colors.length] || '#fff',
              name: currentUser?.name || 'user',
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
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const wx = (mx - offset.x) / old
      const wy = (my - offset.y) / old
      setScale(next); setOffset({ x: mx - wx * next, y: my - wy * next })
    }

    const onContextMenu = (e) => {
      if (!onShare) return
      e.preventDefault()
      const { x, y } = screenToBoard(e.clientX, e.clientY)
      if (x >= 0 && y >= 0 && x < width && y < height) onShare({ x, y, z: scale })
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('contextmenu', onContextMenu)

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('contextmenu', onContextMenu)
    }
  }, [scale, offset, hover, width, height, boardId, colorIndex, cooldownMs, currentUser, colors, onShare])

  // mini-map interactions
  useEffect(() => {
    const mini = miniRef.current
    if (!mini) return
    const rectToBoard = (clientX, clientY) => {
      const r = mini.getBoundingClientRect()
      const mx = clientX - r.left, my = clientY - r.top
      const s = Math.min(200 / width, 200 / height)
      const bx = Math.floor(mx / s)
      const by = Math.floor(my / s)
      return { x: Math.max(0, Math.min(width - 1, bx)), y: Math.max(0, Math.min(height - 1, by)) }
    }
    let dragging = false
    const down = (e) => { dragging = true; const p = rectToBoard(e.clientX, e.clientY); centerOn(p.x, p.y) }
    const move = (e) => { if (!dragging) return; const p = rectToBoard(e.clientX, e.clientY); centerOn(p.x, p.y) }
    const up = () => { dragging = false }
    mini.addEventListener('mousedown', down)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => {
      mini.removeEventListener('mousedown', down)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
  }, [width, height, scale, offset])

  return (
    <div ref={containerRef} className="canvas-wrap" style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', cursor: cooldownMs > 0 ? 'not-allowed' : 'crosshair' }}
        aria-label="Pixel board"
      />
      {/* Mini-map */}
      <div style={{
        position: 'absolute', right: 10, bottom: 10, width: 200, height: 200,
        borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb', background: '#0b1220',
        boxShadow: '0 2px 10px rgba(0,0,0,.25)'
      }}>
        <canvas ref={miniRef} width={200} height={200} />
      </div>
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
  currentUser: PropTypes.shape({ id: PropTypes.string, name: PropTypes.string }),
  initialView: PropTypes.shape({ x: PropTypes.number, y: PropTypes.number, z: PropTypes.number }),
  onShare: PropTypes.func,
}
