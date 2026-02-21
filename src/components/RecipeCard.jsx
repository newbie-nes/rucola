import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock, ChefHat, Flame } from 'lucide-react'

const difficultyColors = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700'
}

export default function RecipeCard({ recipe }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const lang = i18n.language?.startsWith('it') ? 'it' : 'en'

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

          <div className="flex gap-2 mt-2 text-xs text-warm-muted">
            <span>🍚 {recipe.base}</span>
            <span>🥬 {recipe.vegetable}</span>
            <span>🥩 {recipe.protein}</span>
          </div>
        </div>
      </div>
    </button>
  )
}
