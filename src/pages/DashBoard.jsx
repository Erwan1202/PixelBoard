import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getAllBoards, getPixelCounts} from '../services/board'
import { useAuthStore } from '../state/UseAuthStore'
import React from 'react'

import PropTypes from 'prop-types'

function BoardCard({ b }) {
  return (
    <div className="card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <div>
        <div style={{ fontWeight: 600 }}>{b.name}</div>
        <div style={{ fontSize: 12, color:'#64748b' }}>
          {b.width}×{b.height} • {b.pixelCount} pixels
        </div>
      </div>
      <Link className="btn secondary" to={`/board/${b.id}`}>Ouvrir</Link>
    </div>
  )
}

BoardCard.propTypes = {
  b: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    pixelCount: PropTypes.number.isRequired,
  }).isRequired,
}


export default function DashBoard() {
  const { user } = useAuthStore()
  const [searchParams] = useSearchParams()
  const [boards, setBoards] = useState([])
  const [sort, setSort] = useState('most_pixels') // 'most_pixels' | 'recent' | 'name'
  const [q, setQ] = useState('')

  useEffect(() => {
    async function load() {
      const list = await getAllBoards()
      const counts = await getPixelCounts()
      const enriched = list.map(b => ({ ...b, pixelCount: counts.get(b.id) ?? 0 }))
      setBoards(enriched)
    }
    load()
  }, [])

  useEffect(() => {
    if (searchParams.get('welcome')) {
      // petit message d’accueil, optionnel
      console.log('Bienvenue !')
    }
  }, [searchParams])

  const filtered = useMemo(() => {
    let arr = boards
    if (q.trim()) {
      const s = q.trim().toLowerCase()
      arr = arr.filter(b => b.name.toLowerCase().includes(s))
    }
    if (sort === 'most_pixels') arr = [...arr].sort((a,b)=>b.pixelCount - a.pixelCount)
    if (sort === 'recent')      arr = [...arr].sort((a,b)=> new Date(b.created_at) - new Date(a.created_at))
    if (sort === 'name')        arr = [...arr].sort((a,b)=> a.name.localeCompare(b.name))
    return arr
  }, [boards, sort, q])

  return (
    <div className="container" style={{ maxWidth: 820 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h1 style={{ margin: 0 }}>Boards publics</h1>
        <div style={{ fontSize: 14, color:'#475569' }}>
          Bonjour {user?.email ?? 'invité'}
        </div>
      </div>

      <div className="card" style={{ marginTop: 12, display:'grid', gap:12 }}>
        <div className="row" style={{ justifyContent:'space-between' }}>
          <input className="input" placeholder="Rechercher un board…" value={q} onChange={e=>setQ(e.target.value)} style={{ flex:1 }} />
          <select className="input" value={sort} onChange={e=>setSort(e.target.value)} style={{ width: 200 }}>
            <option value="most_pixels">Plus de pixels</option>
            <option value="recent">Plus récents</option>
            <option value="name">Nom (A→Z)</option>
          </select>
        </div>

        {filtered.length === 0 && <div style={{ color:'#64748b' }}>Aucun board trouvé.</div>}

        <div style={{ display:'grid', gap:12 }}>
          {filtered.map(b => <BoardCard key={b.id} b={b} />)}
        </div>
      </div>
    </div>
  )
}
