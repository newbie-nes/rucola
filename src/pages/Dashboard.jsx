import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { RefreshCw, ChefHat, Plus, Moon, Star, Send, ShoppingCart } from 'lucide-react'
import RecipeCard from '../components/RecipeCard'
import PageInfoBox from '../components/PageInfoBox'
import ChefMascot from '../components/ChefMascot'
import { getRecipesForUser } from '../data/recipes'
import { toLocalDateKey, seededShuffle, mulberry32, hashStringToInt } from '../utils/dateHelpers'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

export default function Dashboard() {
  const { t } = useTranslation()
  const { user, userProfile, updateUserProfile, migrateMealEntry } = useAuth()
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(() => {
    const saved = sessionStorage.getItem('rucola_dashboard_refreshKey')
    return saved ? Number(saved) : 0
  })
  const [lunchboxFilter, setLunchboxFilter] = useState(() => {
    return sessionStorage.getItem('rucola_dashboard_lunchboxFilter') === 'true'
  })

  // Inline feedback state
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackHovered, setFeedbackHovered] = useState(0)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  const hour = new Date().getHours()
  const isEvening = hour >= 19
  const [showDinner, setShowDinner] = useState(false)

  useEffect(() => {
    sessionStorage.setItem('rucola_dashboard_refreshKey', String(refreshKey))
  }, [refreshKey])

  useEffect(() => {
    sessionStorage.setItem('rucola_dashboard_lunchboxFilter', String(lunchboxFilter))
  }, [lunchboxFilter])

  const name = user?.displayName?.split(' ')[0] || ''

  // Get yesterday's meal for variety (from Firestore via profile)
  const yesterdayMeal = useMemo(() => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const key = toLocalDateKey(yesterday)
    const history = userProfile?.mealHistory || {}
    const raw = history[key]
    if (!raw) return null
    const migrated = migrateMealEntry(raw)
    // Prefer dinner, fallback to lunch
    return migrated?.dinner || migrated?.lunch || null
  }, [userProfile, migrateMealEntry])

  // Check if feedback already given today (stored in profile)
  const feedbackAlreadyGiven = useMemo(() => {
    const lastFeedback = userProfile?.lastFeedbackDate
    return lastFeedback === toLocalDateKey()
  }, [userProfile])

  const showFeedbackForm = yesterdayMeal && !feedbackAlreadyGiven && !feedbackSubmitted

  const greeting = useMemo(() => {
    if (hour < 12) return t('dashboard.greetingMorning', { name })
    if (hour < 18) return t('dashboard.greeting', { name })
    return t('dashboard.greetingEvening', { name })
  }, [hour, name, t])

  const suggested = useMemo(() => {
    if (!userProfile) return []
    const fridge = userProfile.fridge || { base: [], vegetable: [], protein: [], spice: [], altro: [] }
    const fridgeItems = [...fridge.base, ...fridge.vegetable, ...fridge.protein, ...(fridge.spice || []), ...(fridge.altro || [])]
    const yesterdayId = yesterdayMeal?.recipeId || null
    const all = getRecipesForUser(userProfile, fridgeItems, yesterdayId)
    const filtered = lunchboxFilter ? all.filter(r => r.tags && r.tags.includes('lunchbox')) : all

    // Seed deterministico: stesse ricette finche' non cambia giorno/utente/refreshKey
    const seed = hashStringToInt(`${toLocalDateKey()}_${user?.uid || 'anon'}_${refreshKey}`)
    const rng = mulberry32(seed)

    // Separa per tier di qualita'
    const perfect = filtered.filter(r => r._fridgeMatch.missing.length === 0)
    const almost = filtered.filter(r => r._fridgeMatch.missing.length === 1)
    const rest = filtered.filter(r => r._fridgeMatch.missing.length > 1)

    // Combina: SEMPRE prima le perfette, poi quasi-perfette, poi il resto
    const prioritized = [
      ...seededShuffle(perfect, rng),
      ...seededShuffle(almost, rng),
      ...seededShuffle(rest, rng)
    ]

    return prioritized.slice(0, 3)
  }, [userProfile, refreshKey, yesterdayMeal, lunchboxFilter, user])

  const tip = useMemo(() => {
    const msgs = [
      t('dashboard.souschefTip1'),
      t('dashboard.souschefTip2'),
      t('dashboard.souschefTip3'),
      t('dashboard.souschefTip4')
    ]
    const tipSeed = hashStringToInt(`tip_${toLocalDateKey()}_${user?.uid || 'anon'}`)
    const tipRng = mulberry32(tipSeed)
    return msgs[Math.floor(tipRng() * msgs.length)]
  }, [t, user])

  const fridgeEmpty = !userProfile?.fridge ||
    (userProfile.fridge.base?.length === 0 &&
     userProfile.fridge.vegetable?.length === 0 &&
     userProfile.fridge.protein?.length === 0 &&
     (userProfile.fridge.spice?.length || 0) === 0 &&
     (userProfile.fridge.altro?.length || 0) === 0)

  async function submitFeedback() {
    if (feedbackRating === 0) return
    const mealId = yesterdayMeal?.recipeId || '?'
    const mealName = yesterdayMeal?.recipeName || '?'

    // Save feedback to Firestore
    try {
      await addDoc(collection(db, 'feedbacks'), {
        userId: user?.uid || 'unknown',
        userName: user?.displayName || 'Unknown',
        userEmail: user?.email || '',
        mealId: String(mealId),
        mealName,
        rating: feedbackRating,
        comment: feedbackComment,
        createdAt: serverTimestamp()
      })
    } catch (e) {
      console.warn('Firestore feedback save failed:', e)
    }

    // Mark feedback as given today (in profile)
    await updateUserProfile({ lastFeedbackDate: toLocalDateKey() })
    setFeedbackSubmitted(true)
  }

  return (
    <div className="page-container">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{greeting}</h1>
        <p className="text-warm-muted">{t('dashboard.whatToday')}</p>
      </div>

      <PageInfoBox
        icon="👨‍🍳"
        text={t('pageInfo.dashboard')}
        dismissKey="dashboard"
      />

      {/* Sous-chef card */}
      <div className="card bg-gradient-to-br from-primary/5 via-white to-accent/10 mb-6 border border-primary/10">
        <div className="flex items-start gap-3">
          <ChefMascot mood="happy" size="sm" />
          <div className="flex-1">
            <p className="font-semibold text-sm text-primary mb-1">{t('dashboard.souschefSays')}</p>
            <p className="text-sm text-warm-text leading-relaxed">{tip}</p>
          </div>
        </div>
      </div>

      {/* Yesterday's meal + inline feedback */}
      {yesterdayMeal && (
        <div className="card bg-gradient-to-r from-orange-50 to-yellow-50 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{yesterdayMeal.emoji || '🍽️'}</span>
            <p className="text-sm text-warm-text">
              {t('dashboard.yesterdayAte', { meal: yesterdayMeal.recipeName })}
            </p>
          </div>

          {/* Inline feedback form */}
          {showFeedbackForm && (
            <div className="mt-3 pt-3 border-t border-orange-200/50">
              <p className="text-xs text-warm-muted mb-2">{t('feedback.rateYesterday', { meal: yesterdayMeal.recipeName })}</p>

              {/* Stars */}
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onMouseEnter={() => setFeedbackHovered(n)}
                    onMouseLeave={() => setFeedbackHovered(0)}
                    onClick={() => setFeedbackRating(n)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={24}
                      fill={n <= (feedbackHovered || feedbackRating) ? '#FFB74D' : 'none'}
                      stroke={n <= (feedbackHovered || feedbackRating) ? '#FFB74D' : '#D1D5DB'}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>

              {/* Comment + submit */}
              {feedbackRating > 0 && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 text-sm py-2 px-3 rounded-xl border border-gray-200 bg-white focus:border-primary focus:outline-none"
                    placeholder={t('feedback.commentPlaceholder')}
                    value={feedbackComment}
                    onChange={e => setFeedbackComment(e.target.value)}
                  />
                  <button
                    onClick={submitFeedback}
                    className="bg-primary text-white rounded-xl px-3 py-2 transition-all active:scale-95"
                  >
                    <Send size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Thank you message */}
          {feedbackSubmitted && (
            <div className="mt-3 pt-3 border-t border-orange-200/50 text-center">
              <p className="text-sm font-semibold text-green-600">🎉 {t('feedback.thankYou')}</p>
            </div>
          )}
        </div>
      )}

      {/* Fridge priority hint */}
      {!fridgeEmpty && (
        <div className="flex items-center gap-2 mb-4 px-1">
          <span className="text-sm">🧊</span>
          <p className="text-xs text-warm-muted">{t('dashboard.fridgeFirst')}</p>
        </div>
      )}

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

      {/* Lunchbox filter */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setLunchboxFilter(false)}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
            !lunchboxFilter
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 text-warm-muted hover:bg-gray-200'
          }`}
        >
          {t('dashboard.allRecipes')}
        </button>
        <button
          onClick={() => setLunchboxFilter(true)}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
            lunchboxFilter
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 text-warm-muted hover:bg-gray-200'
          }`}
        >
          🍱 {t('dashboard.lunchboxFilter')}
        </button>
      </div>

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
          suggested[0]?._noStrictMatch ? (
            <>
              {/* Go shopping card */}
              <div className="card text-center py-6 border-2 border-dashed border-orange-300 bg-orange-50/50">
                <div className="text-4xl mb-2">🛒</div>
                <h3 className="font-bold text-orange-700 mb-1">{t('dashboard.goShopping')}</h3>
                <p className="text-sm text-orange-600 mb-4 px-4">{t('dashboard.goShoppingSubtitle')}</p>
                <button
                  onClick={() => navigate('/fridge')}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <ShoppingCart size={16} /> {t('dashboard.updateFridge')}
                </button>
              </div>
              {/* Still show best-effort recipes below */}
              {suggested.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </>
          ) : (
            suggested.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))
          )
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
