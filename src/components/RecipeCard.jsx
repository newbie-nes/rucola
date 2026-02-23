import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock, ChefHat, Flame, ShoppingCart, CheckCircle, ChevronRight } from 'lucide-react'

const FOOD_EMOJIS = {
  pasta: '🍝', rice: '🍚', bread: '🍞', couscous: '🫓', quinoa: '🌾', potatoes: '🥔',
  tomatoes: '🍅', zucchini: '🥒', spinach: '🥬', peppers: '🫑', carrots: '🥕',
  broccoli: '🥦', lettuce: '🥗', onions: '🧅',
  chicken: '🍗', beef: '🥩', salmon: '🐟', eggs: '🥚', tofu: '🧈',
  legumes: '🫘', tuna: '🐠', cheese: '🧀'
}

const difficultyColors = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  hard: 'bg-red-100 text-red-700'
}

export default function RecipeCard({ recipe }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const lang = i18n.language?.startsWith('it') ? 'it' : 'en'

  const fridgeMatch = recipe._fridgeMatch
  const nutrition = recipe.nutrition

  return (
    <button
      onClick={() => navigate(`/recipe/${recipe.id}`)}
      className="card w-full text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="flex items-start gap-4">
        {/* Emoji with gradient bg */}
        <div className="w-16 h-16 bg-gradient-to-br from-primary/5 to-accent/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <span className="text-3xl">{recipe.emoji}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h3 className="font-bold text-warm-text truncate pr-2">{recipe.name[lang]}</h3>
            <ChevronRight size={16} className="text-warm-muted shrink-0 mt-1 group-hover:text-primary transition-colors" />
          </div>
          <p className="text-sm text-warm-muted line-clamp-2 mt-0.5">{recipe.description[lang]}</p>

          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="badge bg-primary/10 text-primary">
              <Clock size={11} className="mr-1" /> {recipe.prepTime}′
            </span>
            <span className={`badge ${difficultyColors[recipe.difficulty]}`}>
              <Flame size={11} className="mr-1" /> {t(`recipes.difficulty.${recipe.difficulty}`)}
            </span>
          </div>

          {/* Key ingredients with fridge status */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[
              { key: recipe.base, type: 'base' },
              { key: recipe.vegetable, type: 'vegetable' },
              { key: recipe.protein, type: 'protein' }
            ].map(({ key, type }) => {
              const inFridge = fridgeMatch?.inFridge?.includes(key)
              return (
                <span
                  key={type}
                  className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                    inFridge
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-orange-50 text-orange-600 border border-orange-200'
                  }`}
                >
                  {FOOD_EMOJIS[key] || '🍽️'} {t(`fridge.items.${key}`, key)}
                  {inFridge ? <CheckCircle size={10} /> : <ShoppingCart size={10} />}
                </span>
              )
            })}
          </div>

          {/* Missing items count */}
          {fridgeMatch?.missing?.length > 0 && (
            <p className="text-[10px] text-orange-500 mt-1 flex items-center gap-1">
              <ShoppingCart size={10} />
              {t(fridgeMatch.missing.length === 1 ? 'shopping.itemsNeeded' : 'shopping.itemsNeeded_plural', { count: fridgeMatch.missing.length })}
            </p>
          )}

          {/* Macronutrients */}
          {nutrition && (
            <div className="flex gap-3 mt-2 text-[10px] text-warm-muted">
              <span className="font-semibold text-primary">{nutrition.kcal} {t('recipes.kcal')}</span>
              <span>P {nutrition.protein}g</span>
              <span>C {nutrition.carbs}g</span>
              <span>F {nutrition.fat}g</span>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
