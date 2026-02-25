import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { Plus, X, Trash2, Search, Save, Check } from 'lucide-react'
import { autoCategorize } from '../utils/autoCategorize'
import PageInfoBox from '../components/PageInfoBox'

const POPULAR = {
  base: ['pasta', 'rice', 'bread', 'couscous', 'quinoa', 'potatoes'],
  vegetable: ['tomatoes', 'zucchini', 'spinach', 'peppers', 'carrots', 'broccoli', 'lettuce', 'onions'],
  protein: ['chicken', 'beef', 'salmon', 'eggs', 'tofu', 'legumes', 'tuna', 'cheese'],
  spice: ['basil', 'parsley', 'rosemary', 'oregano', 'cumin', 'paprika', 'chili', 'ginger', 'curry', 'mint', 'thyme', 'soy_sauce', 'lemon', 'sesame_oil']
}

const FOOD_EMOJIS = {
  pasta: '🍝', rice: '🍚', bread: '🍞', couscous: '🫓', quinoa: '🌾', potatoes: '🥔',
  tomatoes: '🍅', zucchini: '🥒', spinach: '🥬', peppers: '🫑', carrots: '🥕',
  broccoli: '🥦', lettuce: '🥗', onions: '🧅',
  chicken: '🍗', beef: '🥩', salmon: '🐟', eggs: '🥚', tofu: '🧈',
  legumes: '🫘', tuna: '🐠', cheese: '🧀',
  basil: '🌿', parsley: '🌿', rosemary: '🌿', oregano: '🌿', cumin: '🫙',
  paprika: '🌶️', chili: '🌶️', ginger: '🫚', curry: '🍛', mint: '🍃',
  thyme: '🌿', soy_sauce: '🥢', lemon: '🍋', sesame_oil: '🫗'
}

const CATEGORIES = ['base', 'vegetable', 'protein', 'spice', 'altro']
const CAT_EMOJIS = { base: '🍚', vegetable: '🥬', protein: '🥩', spice: '🌿', altro: '📦' }
const CAT_COLORS = {
  base: { bg: 'bg-amber-50', border: 'border-amber-200', active: 'bg-amber-100 border-amber-400 text-amber-800' },
  vegetable: { bg: 'bg-green-50', border: 'border-green-200', active: 'bg-green-100 border-green-400 text-green-800' },
  protein: { bg: 'bg-red-50', border: 'border-red-200', active: 'bg-red-100 border-red-400 text-red-800' },
  spice: { bg: 'bg-purple-50', border: 'border-purple-200', active: 'bg-purple-100 border-purple-400 text-purple-800' },
  altro: { bg: 'bg-gray-50', border: 'border-gray-200', active: 'bg-gray-200 border-gray-400 text-gray-800' }
}

export default function Fridge() {
  const { t } = useTranslation()
  const { userProfile, updateUserProfile } = useAuth()
  const [smartInput, setSmartInput] = useState('')
  const [activeCategory, setActiveCategory] = useState('base')
  const [searchQuery, setSearchQuery] = useState('')
  const [savedToast, setSavedToast] = useState(false)
  const [newItems, setNewItems] = useState([])

  // Local fridge state - only persisted on explicit Save
  const [localFridge, setLocalFridge] = useState(
    userProfile?.fridge || { base: [], vegetable: [], protein: [], spice: [], altro: [] }
  )
  const [saveError, setSaveError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const fridge = localFridge

  // Sync local state when userProfile loads/changes from Firestore
  const initialFridgeRef = useRef(null)
  useEffect(() => {
    if (userProfile?.fridge) {
      if (!initialFridgeRef.current) {
        initialFridgeRef.current = JSON.parse(JSON.stringify(userProfile.fridge))
        setLocalFridge(userProfile.fridge)
      }
    }
  }, [userProfile?.fridge])

  // Calculate new items since page load
  function getNewItems() {
    if (!initialFridgeRef.current) return []
    const items = []
    CATEGORIES.forEach(cat => {
      const initial = initialFridgeRef.current[cat] || []
      const current = fridge[cat] || []
      current.forEach(item => {
        if (!initial.includes(item)) items.push({ category: cat, item })
      })
    })
    return items
  }

  async function handleSaveFridge() {
    setSaving(true)
    setSaveError(null)
    try {
      await updateUserProfile({ fridge: localFridge })
      const added = getNewItems()
      setNewItems(added)
      setSavedToast(true)
      initialFridgeRef.current = JSON.parse(JSON.stringify(localFridge))
      setTimeout(() => setSavedToast(false), 3000)
    } catch (e) {
      setSaveError(t('errors.fridgeSaveFailed'))
      setTimeout(() => setSaveError(null), 4000)
    } finally {
      setSaving(false)
    }
  }

  function toggleIngredient(category, item) {
    const current = fridge[category] || []
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item]
    setLocalFridge(prev => ({ ...prev, [category]: updated }))
  }

  function addSmart() {
    const item = smartInput.trim().toLowerCase()
    if (!item) return
    const category = autoCategorize(item)
    const current = fridge[category] || []
    if (!current.includes(item)) {
      setLocalFridge(prev => ({ ...prev, [category]: [...current, item] }))
    }
    setSmartInput('')
  }

  async function clearAll() {
    const emptyFridge = { base: [], vegetable: [], protein: [], spice: [], altro: [] }
    setLocalFridge(emptyFridge)
    try {
      await updateUserProfile({ fridge: emptyFridge })
    } catch (e) {
      setSaveError(t('errors.fridgeSaveFailed'))
      setTimeout(() => setSaveError(null), 4000)
    }
  }

  const totalItems = CATEGORIES.reduce((sum, cat) => sum + (fridge[cat]?.length || 0), 0)

  const filteredPopular = POPULAR[activeCategory]
    ? (searchQuery
        ? POPULAR[activeCategory].filter(i => {
            const localName = t(`fridge.items.${i}`, i).toLowerCase()
            const q = searchQuery.toLowerCase()
            return i.includes(q) || localName.includes(q)
          })
        : POPULAR[activeCategory])
    : []

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('fridge.title')} 🧊</h1>
          <p className="text-warm-muted text-sm">{t('fridge.subtitle')}</p>
        </div>
        {totalItems > 0 && (
          <button onClick={() => setShowClearConfirm(true)} className="text-danger text-sm flex items-center gap-1">
            <Trash2 size={14} /> {t('fridge.clearAll')}
          </button>
        )}
      </div>

      <PageInfoBox
        icon="🧊"
        text={t('pageInfo.fridge')}
        dismissKey="fridge"
      />

      {/* Smart input — primary method */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          className="input-field flex-1 text-base"
          placeholder={t('fridge.smartPlaceholder')}
          value={smartInput}
          onChange={e => setSmartInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addSmart()}
        />
        <button onClick={addSmart} className="btn-primary px-4">
          <Plus size={20} />
        </button>
      </div>

      {/* Category tabs */}
      <div className="grid grid-cols-5 gap-1.5 mb-6">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`py-3 px-1 rounded-2xl text-center font-semibold text-xs transition-all border-2 ${
              activeCategory === cat
                ? CAT_COLORS[cat].active
                : `bg-white ${CAT_COLORS[cat].border}`
            }`}
          >
            <span className="text-lg block mb-0.5">{CAT_EMOJIS[cat]}</span>
            {t(`fridge.categories.${cat}`)}
            {(fridge[cat]?.length || 0) > 0 && (
              <span className="ml-1 text-[10px] opacity-70">({fridge[cat].length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Search (only for categories with presets) */}
      {POPULAR[activeCategory] && (
        <>
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
        </>
      )}

      {/* Save fridge button */}
      {totalItems > 0 && (
        <button
          onClick={handleSaveFridge}
          disabled={saving}
          className="w-full mb-4 btn-primary flex items-center justify-center gap-2"
        >
          <Save size={18} /> {saving ? '...' : t('fridge.saveFridge')}
        </button>
      )}

      {/* Error toast */}
      {saveError && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-fade-in">
          {saveError}
        </div>
      )}

      {/* Save confirmation toast */}
      {savedToast && (
        <div className="mb-4 card border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
              <Check size={18} />
            </span>
            <p className="font-semibold text-green-700">{t('fridge.savedSuccess')}</p>
          </div>
          {newItems.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-green-600 font-semibold mb-1">{t('fridge.newlyAdded')}</p>
              <div className="flex flex-wrap gap-1.5">
                {newItems.map(({ category, item }, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    {FOOD_EMOJIS[item] && <span>{FOOD_EMOJIS[item]}</span>}
                    {t(`fridge.items.${item}`, item)}
                  </span>
                ))}
              </div>
            </div>
          )}
          {newItems.length === 0 && (
            <p className="text-xs text-green-500">{t('fridge.noNewItems')}</p>
          )}
        </div>
      )}

      {/* Current fridge summary */}
      {totalItems > 0 && (
        <div className="card">
          <h3 className="font-bold mb-3">{t('fridge.title')} ({totalItems})</h3>
          {CATEGORIES.map(cat => (
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

      {/* Clear all confirmation modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowClearConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">🗑️ {t('fridge.clearAllTitle', 'Svuota frigo?')}</h3>
            <p className="text-warm-muted text-sm mb-4">
              {t('fridge.clearAllConfirm', 'Tutti gli ingredienti verranno rimossi. Questa azione non può essere annullata.')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-gray-100 text-warm-dark font-semibold"
              >
                {t('common.cancel', 'Annulla')}
              </button>
              <button
                onClick={() => { setShowClearConfirm(false); clearAll() }}
                className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white font-semibold"
              >
                {t('fridge.clearAll')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
