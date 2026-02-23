/**
 * Cute chef mascot for Rucola app
 * Supports different moods: happy, thinking, waving, cooking
 */
export default function ChefMascot({ mood = 'happy', size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
    xl: 'w-36 h-36'
  }

  const emojis = {
    happy: '👨‍🍳',
    thinking: '🤔',
    waving: '👋',
    cooking: '🍳',
    star: '⭐',
    love: '😍'
  }

  const bubbles = {
    happy: null,
    thinking: '💭',
    waving: '✨',
    cooking: '🔥',
    star: '⭐',
    love: '❤️'
  }

  return (
    <div className={`relative inline-flex items-center justify-center ${sizes[size]} ${className}`}>
      {/* Background circle with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 rounded-full" />

      {/* Chef emoji */}
      <span
        className="relative z-10"
        style={{
          fontSize: size === 'sm' ? '28px' : size === 'md' ? '44px' : size === 'lg' ? '60px' : '76px',
          filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))'
        }}
      >
        {emojis[mood] || emojis.happy}
      </span>

      {/* Floating bubble */}
      {bubbles[mood] && (
        <span className="absolute -top-1 -right-1 text-sm animate-bounce">
          {bubbles[mood]}
        </span>
      )}
    </div>
  )
}
