import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { Plus, X, Trash2, Search } from 'lucide-react'

const POPULAR = {
  base: ['pasta', 'rice', 'bread', 'couscous', 'quinoa', 'potatoes'],
  vegetable: ['tomatoes', 'zucchini', 'spinach', 'peppers', 'carrots', 'broccoli', 'lettuce', 'onions'],
  protein: ['chicken', 'beef', 'salmon', 'eggs', 'tofu', 'legumes', 'tuna', 'cheese']
}

const FOOD_EMOJIS = {
  pasta: '🍝', rice: '🍚', bread: '🍞', couscous: '🫓', quinoa: '🌾', potatoes: '🥔',
  tomatoes: '🍅', zucchini: '🥒', spinach: '🥬', peppers: '🫑', carrots: '🥕',
  broccoli: '🥦', lettuce: '🥗', onions: '🧅',
  chicken: '🍗', beef: '🥩', salmon: '🐟', eggs: '🥚', tofu: '🧈',
  legumes: '🫘', tuna: '🐠', cheese: '🧀'
}

const CAT_EMOJIS = { base: '🍚', vegetable: '🥬', protein: '🥩' }
const CAT_COLORS = {
  base: { bg: 'bg-amber-50', border: 'border-amber-200', active: 'bg-amber-100 border-amber-400 text-amber-800' },
  vegetable: { bg: 'bg-green-50', border: 'border-green-200', active: 'bg-green-100 border-green-400 text-green-800' },
  protein: { bg: 'bg-red-50', border: 'border-red-200', active: 'bg-red-100 border-red-400 text-red-800' }
}

export default function Fridge() {
  const { t } = useTranslation()
  const { userProfile, updateUserProfile } = useAuth()
  const [customInput, setCustomInput] = useState('')
  const [activeCategory, setActiveCategory] = useState('base')
  const [searchQuery, setSearchQuery] = useState('')

  const fridge = userProfile?.fridge || { base: [], vegetable: [], protein: [] }

  function toggleIngredient(category, item) {
    const current = fridge[category] || []
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item]
    updateUserProfile({ fridge: { ...fridge, [category]: updated } })
  }

  function addCustom() {
    const item = customInput.trim().toLowerCase()
    if (!item) return
    const current = fridge[activeCategory] || []
    if (!current.includes(item)) {
      updateUserProfile({
        fridge: { ...fridge, [activeCategory]: [...current, item] }
      })
    }
    setCustomInput('')
  }

  function clearAll() {
    updateUserProfile({ fridge: { base: [], vegetable: [], protein: [] } })
  }

  const totalItems = (fridge.base?.length || 0) + (fridge.vegetable?.length || 0) + (fridge.protein?.length || 0)

  const filteredPopular = searchQuery
    ? POPULAR[activeCategory].filter(i => i.includes(searchQuery.toLowerCase()))
    : POPULAR[activeCategory]

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('fridge.title')} 🧊</h1>
          <p className="text-warm-muted text-sm">{t('fridge.subtitle')}</p>
        </div>
        {totalItems > 0 && (
          <button onClick={clearAll} className="text-danger text-sm flex items-center gap-1">
            <Trash2 size={14} /> {t('fridge.clearAll')}
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6">
        {(['base', 'vegetable', 'protein']).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-1 py-3 px-3 rounded-2xl text-center font-semibold text-sm transition-all border-2 ${
              activeCategory === cat
                ? CAT_COLORS[cat].active
                : `bg-white ${CAT_COLORS[cat].border}`
            }`}
          >
            <span className="text-lg block mb-0.5">{CAT_EMOJIS[cat]}</span>
            {t(`fridge.categories.${cat}`)}
            {(fridge[cat]?.length || 0) > 0 && (
              <span className="ml-1 text-xs opacity-70">({fridge[cat].length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-3 text-warm-muted" size={18} />
        <input
          type="text"
          className="input-field pl-11"
          placeholder={t('common.search')}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Popular ingredients */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filteredPopular.map(item => {
          const isActive = (fridge[activeCategory] || []).includes(item)
          return (
            <button
              key={item}
              onClick={() => toggleIngredient(activeCategory, item)}
              className={isActive ? 'chip-active' : 'chip-inactive'}
            >
              {isActive && <span className="text-xs">✓</span>}
              {FOOD_EMOJIS[item] && <span>{FOOD_EMOJIS[item]}</span>}
              {t(`fridge.items.${item}`, item)}
            </button>
          )
        })}
      </div>

      {/* Custom ingredient */}
      <div className="flex gap-2 mb-8">
        <input
          type="text"
          className="input-field flex-1"
          placeholder={t('fridge.customPlaceholder')}
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCustom()}
        />
        <button onClick={addCustom} className="btn-primary px-4">
          <Plus size={20} />
        </button>
      </div>

      {/* Current fridge summary */}
      {totalItems > 0 && (
        <div className="card">
          <h3 className="font-bold mb-3">{t('fridge.title')} ({totalItems})</h3>
          {(['base', 'vegetable', 'protein']).map(cat => (
            (fridge[cat]?.length || 0) > 0 && (
              <div key={cat} className="mb-3 last:mb-0">
                <p className="text-xs font-semibold text-warm-muted uppercase mb-1">
                  {CAT_EMOJIS[cat]} {t(`fridge.categories.${cat}`)}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {fridge[cat].map(item => (
                    <span key={item} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full text-sm">
                      {FOOD_EMOJIS[item] && <span>{FOOD_EMOJIS[item]}</span>}
                      {t(`fridge.items.${item}`, item)}
                      <button onClick={() => toggleIngredient(cat, item)} className="text-warm-muted hover:text-danger">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  )
}
