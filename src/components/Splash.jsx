import { useState, useEffect } from 'react'

export default function Splash() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Trigger animation after mount
    requestAnimationFrame(() => setShow(true))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-warm-bg to-green-50 flex flex-col items-center justify-center gap-6">
      {/* Chef mascot */}
      <div className={`transition-all duration-700 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
        <div className="w-28 h-28 bg-white rounded-full shadow-xl flex items-center justify-center">
          <span className="text-6xl" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))' }}>👨‍🍳</span>
        </div>
      </div>

      {/* Logo */}
      <div className={`text-center transition-all duration-700 delay-200 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <h1 className="text-4xl font-black text-primary tracking-tight">
          🥬 Rucola
        </h1>
        <p className="text-warm-muted text-sm mt-1 font-medium">Il tuo sous-chef personale</p>
      </div>

      {/* Loading dots */}
      <div className={`flex gap-2 transition-all duration-700 delay-500 ${show ? 'opacity-100' : 'opacity-0'}`}>
        <span className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2.5 h-2.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2.5 h-2.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}
