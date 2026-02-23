import { useState } from 'react'
import { Info, X } from 'lucide-react'

export default function PageInfoBox({ icon, text, dismissKey }) {
  const storageKey = `rucola_dismissed_${dismissKey}`
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(storageKey) === 'true'
  })

  if (dismissed) return null

  function handleDismiss() {
    setDismissed(true)
    localStorage.setItem(storageKey, 'true')
  }

  return (
    <div className="mb-4 flex items-start gap-3 bg-primary/5 border border-primary/15 rounded-2xl px-4 py-3 animate-fade-in">
      <span className="text-xl shrink-0 mt-0.5">{icon || <Info size={20} className="text-primary" />}</span>
      <p className="text-sm text-warm-text flex-1 leading-relaxed">{text}</p>
      <button onClick={handleDismiss} className="text-warm-muted hover:text-warm-text shrink-0 mt-0.5">
        <X size={16} />
      </button>
    </div>
  )
}
