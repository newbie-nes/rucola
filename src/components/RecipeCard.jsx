import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock, ChefHat, Flame, ShoppingCart, CheckCircle } from 'lucide-react'

const FOOD_EMOJIS = {
  pasta: '🍝', rice: '🍚', bread: '🍞', couscous: '🫓', quinoa: '🌾', potatoes: '🥔',
  tomatoes: '🍅', zucchini: '🥒', spinach: '🥬', peppers: '🫑', carrots: '🥕',
  broccoli: '🥦', lettuce: '🥗', onions: '🧅',
  chicken: '🍗', beef: '🥩', salmon: '🐟', eggs: '🥚', tofu: '🧈',
  legumes: '🫘', tuna: '🐠', cheese: '🧀'
}

const difficultyColors = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
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
      onClick={() => {
        navigate(`/recipe/${recipe.id}`)
      }}
      className="card w-full text-left hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl shrink-0">{recipe.emoji}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-warm-text truncate">{recipe.name[lang]}</h3>
          <p className="text-sm text-warm-muted line-clamp-2 mt-0.5">{recipe.description[lang]}</p>

          <div className="flex flex-wrap gap-2 mt-3">
            <span className="badge bg-primary/10 text-primary">
              <Clock size={12} className="mr-1" /> {recipe.prepTime} min
            </span>
            <span className={`badge ${difficultyColors[recipe.difficulty]}`}>
              <Flame size={12} className="mr-1" /> {t(`recipes.difficulty.${recipe.difficulty}`)}
            </span>
            <span className="badge bg-secondary/10 text-secondary">
              <ChefHat size={12} className="mr-1" /> {t('recipes.balanced')}
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
                  {inFridge
                    ? <CheckCircle size={10} />
                    : <ShoppingCart size={10} />
                  }
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
              <span className="font-semibold text-orange-500">{nutrition.kcal} {t('recipes.kcal')}</span>
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
