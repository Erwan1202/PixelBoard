import PropTypes from 'prop-types'
import React from 'react'

export default function Palette({ colors, selected, onSelect, cooldownMs }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-wrap gap-2">
        {colors.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            disabled={cooldownMs > 0}
            title={`Couleur #${i}`}
            className={`h-8 w-8 rounded-md border ring-offset-1 ${selected===i ? 'ring-2 ring-black' : 'ring-0'} ${cooldownMs>0 ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.05]'}`}
            style={{ background: c }}
          />
        ))}
      </div>

      <div className="min-w-[160px]">
        {cooldownMs > 0 ? (
          <div className="text-sm text-gray-600">
            Cooldown&nbsp;
            <span className="font-medium">{(cooldownMs/1000).toFixed(1)}s</span>
            <div className="h-1 bg-gray-200 rounded mt-1 overflow-hidden">
              <div
                className="h-full bg-black"
                style={{ width: `${Math.max(0, (1 - cooldownMs/2000))*100}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">Prêt à peindre 🎨</div>
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
