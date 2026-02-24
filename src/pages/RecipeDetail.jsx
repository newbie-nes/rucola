import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import recipes from '../data/recipes'
import { ArrowLeft, Clock, Flame, CalendarPlus, Zap, MapPin, Star, Send } from 'lucide-react'
import { matchesKeyIngredient, ingredientsMatch } from '../utils/ingredientMatch'

const FOOD_EMOJIS = {
  pasta: '🍝', rice: '🍚', bread: '🍞', couscous: '🫓', quinoa: '🌾', potatoes: '🥔',
  farro: '🌾', orzo: '🌾', polenta: '🌽', bulgur: '🌾',
  tomatoes: '🍅', zucchini: '🥒', spinach: '🥬', peppers: '🫑', carrots: '🥕',
  broccoli: '🥦', lettuce: '🥗', onions: '🧅',
  eggplant: '🍆', mushrooms: '🍄', cauliflower: '🥦', avocado: '🥑', corn: '🌽',
  artichokes: '🌿', asparagus: '🌿',
  chicken: '🍗', beef: '🥩', salmon: '🐟', eggs: '🥚', tofu: '🧈',
  legumes: '🫘', tuna: '🐠', cheese: '🧀',
  shrimp: '🦐', ham: '🥓', turkey: '🍗', seitan: '🌾', tempeh: '🫘'
}

// Pantry staples assumed always available — matched as whole words to avoid
// false positives like "pepe" matching "peperoni" or "pepper" matching "peppers"
const PANTRY_KEYWORDS = [
  'sale', 'salt', 'olio d\'oliva', 'olio di oliva', 'olive oil', 'olio evo', 'olio',
  'pepe nero', 'black pepper', 'pepe', 'acqua', 'water', 'aglio', 'garlic', 'zucchero', 'sugar'
]
function isPantryItem(text) {
  const lower = text.toLowerCase()
  // Match longest keywords first, require word boundaries
  const sorted = [...PANTRY_KEYWORDS].sort((a, b) => b.length - a.length)
  return sorted.some(kw => {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(^|\\s)${escaped}(\\s|,|$)`, 'i').test(lower)
  })
}

const HERO_GRADIENTS = {
  easy: 'from-emerald-400 via-green-500 to-teal-600',
  medium: 'from-amber-400 via-orange-500 to-yellow-600',
  hard: 'from-rose-400 via-red-500 to-pink-600'
}

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { user, userProfile, saveMeal } = useAuth()
  const lang = i18n.language?.startsWith('it') ? 'it' : 'en'

  const [fbRating, setFbRating] = useState(0)
  const [fbHovered, setFbHovered] = useState(0)
  const [fbComment, setFbComment] = useState('')
  const [fbSubmitted, setFbSubmitted] = useState(false)

  const recipe = recipes.find(r => r.id === Number(id))
  if (!recipe) {
    return (
      <div className="page-container text-center pt-20">
        <div className="text-5xl mb-4">😕</div>
        <p>{t('common.noResults')}</p>
        <button onClick={() => navigate(-1)} className="btn-primary mt-4">{t('common.back')}</button>
      </div>
    )
  }

  // Fridge match on key ingredients (base/vegetable/protein)
  const fridge = userProfile?.fridge || { base: [], vegetable: [], protein: [], spice: [], altro: [] }
  const fridgeItems = [...(fridge.base || []), ...(fridge.vegetable || []), ...(fridge.protein || []), ...(fridge.spice || []), ...(fridge.altro || [])]
  const normalizedFridge = fridgeItems.map(item => item.toLowerCase())

  const keyIngredients = [
    { type: 'base', key: recipe.base },
    { type: 'vegetable', key: recipe.vegetable },
    { type: 'protein', key: recipe.protein }
  ]

  const inFridge = []
  const missing = []
  keyIngredients.forEach(({ key }) => {
    if (normalizedFridge.some(fi => matchesKeyIngredient(fi, key))) {
      inFridge.push(key)
    } else {
      missing.push(key)
    }
  })

  // Build alias map: for each key ingredient, collect all names to match against
  // e.g. "chicken" → ["chicken", "pollo"] so "petto di pollo" will match
  const keyAliases = keyIngredients.map(({ type, key }) => {
    const aliases = [key.toLowerCase()]
    // Add localized name from translations
    const localizedName = t(`fridge.items.${key}`, { defaultValue: '' })
    if (localizedName) aliases.push(localizedName.toLowerCase())
    // Add english name too if we're in Italian
    if (lang === 'it') {
      const enName = key.toLowerCase()
      if (!aliases.includes(enName)) aliases.push(enName)
    }
    return { type, key, aliases, status: inFridge.includes(key) ? 'inFridge' : 'missing' }
  })

  // Build alias map for ALL fridge items (not just key ingredients) to handle spices + extras
  const allFridgeAliases = fridgeItems.map(item => {
    const aliases = [item.toLowerCase()]
    const localizedName = t(`fridge.items.${item}`, { defaultValue: '' })
    if (localizedName && !aliases.includes(localizedName.toLowerCase())) {
      aliases.push(localizedName.toLowerCase())
    }
    return aliases
  })

  function getIngredientStatus(ingredientText) {
    const lower = ingredientText.toLowerCase()
    // Check pantry staples first (word-boundary match to avoid "pepe" → "peperoni")
    if (isPantryItem(ingredientText)) return 'pantry'
    // Check against key ingredient aliases (base/vegetable/protein)
    for (const { aliases, status } of keyAliases) {
      if (aliases.some(alias => lower.includes(alias))) return status
    }
    // Check against ALL fridge items with aliases (catches spices like basil→basilico)
    if (allFridgeAliases.some(aliases => aliases.some(alias => lower.includes(alias)))) return 'inFridge'
    // Fuzzy match against fridge items using ingredientMatch utility
    if (fridgeItems.some(fi => ingredientsMatch(fi, ingredientText))) return 'inFridge'
    return 'missing'
  }

  // Classify all ingredients, keeping original order
  const classifiedIngredients = recipe.allIngredients[lang].map(ing => ({
    text: ing,
    status: getIngredientStatus(ing)
  }))

  // Collect ALL missing ingredients (not just key ones) for shopping card
  const allMissingIngredients = classifiedIngredients.filter(ing => ing.status === 'missing')

  function addToCalendar() {
    const today = new Date().toISOString().split('T')[0]
    const hour = new Date().getHours()
    const mealType = hour >= 19 ? 'dinner' : 'lunch'

    saveMeal(today, {
      recipeId: recipe.id,
      recipeName: recipe.name[lang],
      emoji: recipe.emoji,
      type: mealType
    })
    navigate('/')
  }

  async function submitRecipeFeedback() {
    if (fbRating === 0) return
    try {
      await addDoc(collection(db, 'feedbacks'), {
        userId: user?.uid || 'unknown',
        userName: user?.displayName || 'Unknown',
        userEmail: user?.email || '',
        mealId: String(recipe.id),
        mealName: recipe.name[lang],
        rating: fbRating,
        comment: fbComment,
        createdAt: serverTimestamp()
      })
    } catch (e) {
      console.warn('Firestore feedback save failed:', e)
    }
    setFbSubmitted(true)
  }

  const heroGradient = HERO_GRADIENTS[recipe.difficulty] || HERO_GRADIENTS.easy

  return (
    <div className="min-h-screen bg-warm-bg">

      {/* ========== HERO ========== */}
      <div className={`relative bg-gradient-to-br ${heroGradient} px-4 pt-4 pb-16 overflow-hidden`}>
        <div className="absolute top-[-40px] right-[-40px] w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute bottom-[-20px] left-[-30px] w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute top-[30%] left-[10%] w-20 h-20 bg-white/5 rounded-full" />

        <div className="relative z-10 flex items-start justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-white/90 font-medium bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm"
          >
            <ArrowLeft size={16} /> {t('common.back')}
          </button>
          <div className="w-16 h-16 bg-white rounded-full shadow-lg flex flex-col items-center justify-center">
            <span className="text-xl font-black text-warm-text leading-none">{recipe.prepTime}</span>
            <span className="text-[9px] font-semibold text-warm-muted uppercase tracking-wide">min</span>
          </div>
        </div>

        <div className="relative z-10 text-center">
          <div className="text-[100px] leading-none mb-3" style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.15))' }}>
            {recipe.emoji}
          </div>
          <h1 className="text-2xl font-extrabold text-white drop-shadow-md">{recipe.name[lang]}</h1>
          <p className="text-white/80 text-sm mt-1 max-w-xs mx-auto">{recipe.description[lang]}</p>
          <div className="flex justify-center gap-3 mt-4 flex-wrap">
            <span className="inline-flex items-center gap-1 bg-white/25 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
              <Flame size={12} /> {t(`recipes.difficulty.${recipe.difficulty}`)}
            </span>
            <span className="inline-flex items-center gap-1 bg-white/25 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
              1 {t('recipes.portions')}
            </span>
            {recipe.tags?.includes('lunchbox') && (
              <span className="inline-flex items-center gap-1 bg-white/25 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
                🍱 {t('dashboard.lunchboxFilter')}
              </span>
            )}
            {recipe.tags?.includes('highProtein') && (
              <span className="inline-flex items-center gap-1 bg-white/25 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
                💪 {t('tags.highProtein')}
              </span>
            )}
            {recipe.tags?.includes('light') && (
              <span className="inline-flex items-center gap-1 bg-white/25 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
                🥗 {t('tags.light')}
              </span>
            )}
            {recipe.tags?.includes('comfort') && (
              <span className="inline-flex items-center gap-1 bg-white/25 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
                🫕 {t('tags.comfort')}
              </span>
            )}
            {recipe.tags?.includes('mediterranean') && (
              <span className="inline-flex items-center gap-1 bg-white/25 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
                🫒 {t('tags.mediterranean')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ========== BODY ========== */}
      <div className="px-4 -mt-8 max-w-lg mx-auto pb-8 relative z-10">

        {/* Balance indicator */}
        <div className="card mb-4 flex items-center gap-2 flex-wrap">
          {keyIngredients.map(({ type, key }) => {
            const isIn = inFridge.includes(key)
            return (
              <span
                key={type}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
                  isIn
                    ? 'bg-green-50 text-green-700 border-green-300'
                    : 'bg-orange-50 text-orange-600 border-orange-300'
                }`}
              >
                {FOOD_EMOJIS[key] || '🍽️'} {t(`recipes.${type}`)}
                <span className={`font-bold text-sm ${isIn ? 'text-green-600' : 'text-orange-500'}`}>
                  {isIn ? '✓' : '✗'}
                </span>
              </span>
            )
          })}
          {missing.length === 0 && (
            <span className="ml-auto text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
              ✓ {t('shopping.inFridge')}
            </span>
          )}
        </div>

        {/* Macronutrients */}
        {recipe.nutrition && (
          <div className="card mb-4">
            <h2 className="section-title mb-3 flex items-center gap-2">
              <Zap size={16} className="text-orange-500" /> {t('recipes.nutrition')}
            </h2>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-orange-50 rounded-xl p-2">
                <p className="text-lg font-bold text-orange-600">{recipe.nutrition.kcal}</p>
                <p className="text-[10px] text-orange-400">{t('recipes.kcal')}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-2">
                <p className="text-lg font-bold text-red-500">{recipe.nutrition.protein}g</p>
                <p className="text-[10px] text-red-400">{t('recipes.proteinG')}</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-2">
                <p className="text-lg font-bold text-amber-600">{recipe.nutrition.carbs}g</p>
                <p className="text-[10px] text-amber-400">{t('recipes.carbsG')}</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-2">
                <p className="text-lg font-bold text-yellow-600">{recipe.nutrition.fat}g</p>
                <p className="text-[10px] text-yellow-400">{t('recipes.fatG')}</p>
              </div>
            </div>
          </div>
        )}

        {/* ========== INGREDIENTS (original order, with ✓/✗) ========== */}
        <div className="card mb-4">
          <h2 className="section-title mb-4">{t('recipes.ingredients')}</h2>
          <div className="space-y-2">
            {classifiedIngredients.map((ing, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border ${
                  ing.status === 'inFridge'
                    ? 'bg-green-50 border-green-200'
                    : ing.status === 'missing'
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                {/* ✓ / ✗ / dot */}
                {ing.status === 'inFridge' && (
                  <span className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold shrink-0">✓</span>
                )}
                {ing.status === 'missing' && (
                  <span className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold shrink-0">✗</span>
                )}
                {ing.status === 'pantry' && (
                  <span className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                  </span>
                )}

                {/* Ingredient text */}
                <span className={`text-sm flex-1 ${
                  ing.status === 'missing' ? 'text-orange-800 font-semibold' :
                  ing.status === 'inFridge' ? 'text-green-800' : 'text-warm-muted'
                }`}>
                  {ing.text}
                </span>

                {/* Status label */}
                {ing.status === 'inFridge' && (
                  <span className="text-[11px] font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{t('shopping.inFridge')}</span>
                )}
                {ing.status === 'missing' && (
                  <span className="text-[11px] font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">{t('shopping.toBuy')}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ========== SHOPPING CARD ========== */}
        {allMissingIngredients.length > 0 && (
          <div className="card mb-4 border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
            <h2 className="section-title mb-3 flex items-center gap-2 text-orange-700">
              <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">✗</span>
              {t('shopping.missingTitle')}
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {allMissingIngredients.map((ing, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 font-semibold"
                >
                  🛒 {ing.text}
                </span>
              ))}
            </div>
            <a
              href="https://www.google.com/maps/search/supermarket/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-2xl transition-all active:scale-[0.97]"
            >
              <MapPin size={18} /> {t('shopping.findSupermarket')}
            </a>
            <p className="text-[10px] text-orange-400 text-center mt-2">{t('shopping.mapsHint')}</p>
          </div>
        )}

        {/* ========== STEPS (TIMELINE) ========== */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">{t('recipes.steps')}</h2>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              <Clock size={12} /> {recipe.prepTime} min
            </span>
          </div>

          <div className="relative">
            <div className="absolute left-[18px] top-5 bottom-5 w-0.5 bg-gradient-to-b from-primary/30 via-primary/20 to-primary/5 rounded-full" />
            <div className="space-y-1">
              {recipe.steps[lang].map((step, i) => (
                <div key={i} className="relative flex gap-4 py-3">
                  <div className="relative z-10 w-9 h-9 bg-gradient-to-br from-primary to-primary-dark text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-md">
                    {i + 1}
                  </div>
                  <div className="flex-1 bg-warm-bg rounded-2xl px-4 py-3 border border-gray-100">
                    <p className="text-sm text-warm-text leading-relaxed">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========== ADD TO CALENDAR ========== */}
        <button onClick={addToCalendar} className="btn-primary w-full flex items-center justify-center gap-2 mb-6">
          <CalendarPlus size={20} /> {t('dashboard.addToCalendar')}
        </button>

        {/* ========== FEEDBACK ========== */}
        <div className="card">
          <h2 className="section-title mb-3">{lang === 'it' ? 'Com\'era questa ricetta?' : 'How was this recipe?'}</h2>
          {fbSubmitted ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">🎉</div>
              <p className="text-sm font-semibold text-green-600">{t('feedback.thankYou')}</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onMouseEnter={() => setFbHovered(n)}
                    onMouseLeave={() => setFbHovered(0)}
                    onClick={() => setFbRating(n)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      fill={n <= (fbHovered || fbRating) ? '#FFB74D' : 'none'}
                      stroke={n <= (fbHovered || fbRating) ? '#FFB74D' : '#D1D5DB'}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>
              {fbRating > 0 && (
                <>
                  <textarea
                    className="input-field resize-none h-16 mb-3 text-sm"
                    placeholder={t('feedback.commentPlaceholder')}
                    value={fbComment}
                    onChange={e => setFbComment(e.target.value)}
                  />
                  <button
                    onClick={submitRecipeFeedback}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Send size={16} /> {t('feedback.submit')}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
