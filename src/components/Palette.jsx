import PropTypes from 'prop-types'
import { useEffect, useRef } from 'react'
import React from 'react'


export default function Palette({ colors, selected, onSelect, cooldownMs }) {
  const bar = useRef(null)

  useEffect(() => {
    if (!bar.current) return
    const pct = Math.max(0, (1 - cooldownMs / 2000) * 100)
    bar.current.style.width = `${pct}%`
  }, [cooldownMs])

  return (
    <div className="row">
      <div className="palette">
        {colors.map((c, i) => (
          <button
            key={i}
            type="button"
            className={`swatch ${selected === i ? 'selected' : ''}`}
            onClick={() => onSelect(i)}
            disabled={cooldownMs > 0}
            title={`Couleur #${i}`}
            style={{ background: c }}
          />
        ))}
      </div>

      <div className="cooldown">
        {cooldownMs > 0 ? (
          <>
            Cooldown <strong>{(cooldownMs / 1000).toFixed(1)}s</strong>
            <div className="cooldown-bar"><div ref={bar} /></div>
          </>
        ) : (
          <>Prêt à peindre 🎨</>
        )}
      </div>
    </div>
  )
}

Palette.propTypes = {
  colors: PropTypes.array.isRequired,
  selected: PropTypes.number.isRequired,
  onSelect: PropTypes.func.isRequired,
  cooldownMs: PropTypes.number.isRequired,
}
