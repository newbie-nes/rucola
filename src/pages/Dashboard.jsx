import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { RefreshCw, ChefHat, Plus, Moon } from 'lucide-react'
import FeedbackModal from '../components/FeedbackModal'
import RecipeCard from '../components/RecipeCard'
import recipes, { getRecipesForUser } from '../data/recipes'

export default function Dashboard() {
  const { t } = useTranslation()
  const { user, userProfile } = useAuth()
  const navigate = useNavigate()
  const [showFeedback, setShowFeedback] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const hour = new Date().getHours()
  const isEvening = hour >= 19
  const [showDinner, setShowDinner] = useState(false)
  const mealType = showDinner ? 'dinner' : 'lunch'

  const name = user?.displayName?.split(' ')[0] || ''

  const greeting = useMemo(() => {
    if (hour < 12) return t('dashboard.greetingMorning', { name })
    if (hour < 18) return t('dashboard.greeting', { name })
    return t('dashboard.greetingEvening', { name })
  }, [hour, name, t])

  const suggested = useMemo(() => {
    if (!userProfile) return []
    const fridge = userProfile.fridge || { base: [], vegetable: [], protein: [] }
    const fridgeItems = [...fridge.base, ...fridge.vegetable, ...fridge.protein]
    const all = getRecipesForUser(userProfile, fridgeItems)
    // Shuffle with refreshKey as seed
    const shuffled = [...all].sort(() => Math.random() - 0.5 + refreshKey * 0)
    return shuffled.slice(0, 3)
  }, [userProfile, refreshKey])

  // Check if feedback needed (simplified — check localStorage)
  useEffect(() => {
    const lastFeedback = localStorage.getItem('rucola_last_feedback')
    const today = new Date().toDateString()
    const lastMeal = localStorage.getItem('rucola_last_meal')
    if (lastMeal && lastFeedback !== today) {
      setShowFeedback(true)
    }
  }, [])

  const souschefMessages = [
    t('dashboard.souschefTip1'),
    t('dashboard.souschefTip2'),
    t('dashboard.souschefTip3'),
    t('dashboard.souschefTip4')
  ]
  const tip = souschefMessages[Math.floor(Math.random() * souschefMessages.length)]

  const fridgeEmpty = !userProfile?.fridge ||
    (userProfile.fridge.base?.length === 0 &&
     userProfile.fridge.vegetable?.length === 0 &&
     userProfile.fridge.protein?.length === 0)

  return (
    <div className="page-container">
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{greeting}</h1>
        <p className="text-warm-muted">{t('dashboard.whatToday')}</p>
      </div>

      {/* Sous-chef card */}
      <div className="card bg-gradient-to-br from-primary/5 to-accent/10 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
            <ChefHat className="text-primary" size={24} />
          </div>
          <div>
            <p className="font-semibold text-sm text-primary mb-1">{t('dashboard.souschefSays')}</p>
            <p className="text-sm text-warm-text">{tip}</p>
          </div>
        </div>
      </div>

      {/* Fridge empty warning */}
      {fridgeEmpty && (
        <button
          onClick={() => navigate('/fridge')}
          className="w-full card border-2 border-dashed border-primary/30 mb-6 flex items-center gap-3 text-left"
        >
          <div className="text-3xl">🧊</div>
          <div>
            <p className="font-semibold text-primary">{t('dashboard.noFridge')}</p>
            <p className="text-sm text-warm-muted flex items-center gap-1">
              <Plus size={14} /> {t('fridge.title')}
            </p>
          </div>
        </button>
      )}

      {/* Dinner button (after 19:00) */}
      {isEvening && (
        <button
          onClick={() => setShowDinner(!showDinner)}
          className={`w-full mb-4 py-3 px-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all ${
            showDinner ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-600'
          }`}
        >
          <Moon size={18} />
          {showDinner ? t('dashboard.dinnerTitle') : t('dashboard.dinnerAvailable')}
        </button>
      )}

      {/* Recipe suggestions */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">
          {showDinner ? t('dashboard.dinnerTitle') : t('dashboard.lunchTitle')}
        </h2>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="text-primary flex items-center gap-1 text-sm font-medium"
        >
          <RefreshCw size={16} /> {t('dashboard.regenerate')}
        </button>
      </div>

      <div className="space-y-4">
        {suggested.length > 0 ? (
          suggested.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))
        ) : (
          <div className="card text-center py-8">
            <div className="text-4xl mb-3">🍳</div>
            <p className="text-warm-muted">{t('common.noResults')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
