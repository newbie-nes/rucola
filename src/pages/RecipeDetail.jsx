import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import recipes from '../data/recipes'
import { ArrowLeft, Clock, Flame, Users, Check, CalendarPlus, Zap } from 'lucide-react'

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const lang = i18n.language?.startsWith('it') ? 'it' : 'en'

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

  async function addToCalendar() {
    const today = new Date().toISOString().split('T')[0]
    const hour = new Date().getHours()
    const mealType = hour >= 19 ? 'dinner' : 'lunch'

    // Save to localStorage for feedback check
    localStorage.setItem('rucola_last_meal', String(recipe.id))
    localStorage.setItem('rucola_last_meal_name', recipe.name[lang])

    // Save to local history
    const history = JSON.parse(localStorage.getItem('rucola_meal_history') || '{}')
    history[today] = {
      recipeId: recipe.id,
      recipeName: recipe.name[lang],
      emoji: recipe.emoji,
      type: mealType
    }
    localStorage.setItem('rucola_meal_history', JSON.stringify(history))

    navigate('/')
  }

  return (
    <div className="min-h-screen bg-warm-bg">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 to-accent/20 px-4 pt-4 pb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary font-medium mb-4">
          <ArrowLeft size={18} /> {t('common.back')}
        </button>
        <div className="text-center">
          <div className="text-6xl mb-3">{recipe.emoji}</div>
          <h1 className="text-2xl font-bold">{recipe.name[lang]}</h1>
          <p className="text-warm-muted mt-1">{recipe.description[lang]}</p>
        </div>
        <div className="flex justify-center gap-4 mt-4">
          <span className="badge bg-white shadow-sm">
            <Clock size={14} className="mr-1" /> {recipe.prepTime} min
          </span>
          <span className="badge bg-white shadow-sm">
            <Flame size={14} className="mr-1" /> {t(`recipes.difficulty.${recipe.difficulty}`)}
          </span>
          <span className="badge bg-white shadow-sm">
            <Users size={14} className="mr-1" /> {recipe.portions} {t('recipes.portions')}
          </span>
        </div>
      </div>

      <div className="px-4 -mt-4 max-w-lg mx-auto pb-8">
        {/* Balance indicator */}
        <div className="card mb-4 flex items-center gap-3">
          <div className="flex gap-2">
            <span className="badge bg-amber-100 text-amber-700">🍚 {t('recipes.base')}</span>
            <span className="badge bg-green-100 text-green-700">🥬 {t('recipes.vegetable')}</span>
            <span className="badge bg-red-100 text-red-700">🥩 {t('recipes.protein')}</span>
          </div>
          <Check className="text-secondary ml-auto" size={20} />
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

        {/* Ingredients */}
        <div className="card mb-4">
          <h2 className="section-title mb-3">{t('recipes.ingredients')}</h2>
          <ul className="space-y-2">
            {recipe.allIngredients[lang].map((ing, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                {ing}
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div className="card mb-6">
          <h2 className="section-title mb-3">{t('recipes.steps')}</h2>
          <ol className="space-y-4">
            {recipe.steps[lang].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-7 h-7 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm text-warm-text pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Add to calendar button */}
        <button onClick={addToCalendar} className="btn-primary w-full flex items-center justify-center gap-2">
          <CalendarPlus size={20} /> {t('dashboard.addToCalendar')}
        </button>
      </div>
    </div>
  )
}
