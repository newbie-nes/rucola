import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import PageInfoBox from '../components/PageInfoBox'

const DAYS_IT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS_IT = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function MealRow({ meal, label, onDelete, onClickRecipe }) {
  if (!meal) return null
  return (
    <div className="flex items-center gap-3 py-2">
      <button
        onClick={onClickRecipe}
        className="flex items-center gap-3 flex-1 text-left"
      >
        <span className="text-3xl">{meal.emoji || '🍽️'}</span>
        <div className="flex-1">
          <p className="font-semibold">{meal.recipeName}</p>
          <p className="text-sm text-warm-muted">{label}</p>
        </div>
      </button>
      {onDelete && (
        <button
          onClick={onDelete}
          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  )
}

export default function History() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { userProfile, deleteMeal, migrateMealEntry } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { dateKey, mealType }

  const lang = i18n.language?.startsWith('it') ? 'it' : 'en'
  const dayNames = lang === 'it' ? DAYS_IT : DAYS_EN
  const monthNames = lang === 'it' ? MONTHS_IT : MONTHS_EN

  const meals = userProfile?.mealHistory || {}

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    // Monday-based week
    let startDow = firstDay.getDay() - 1
    if (startDow < 0) startDow = 6

    const days = []
    for (let i = 0; i < startDow; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d)
    return days
  }, [currentMonth])

  function dateKey(day) {
    const y = currentMonth.getFullYear()
    const m = String(currentMonth.getMonth() + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  function getMigratedEntry(day) {
    const raw = meals[dateKey(day)]
    if (!raw) return null
    return migrateMealEntry(raw)
  }

  const today = new Date()
  const isToday = (day) => {
    return day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
  }

  function handleDeleteRequest(dk, mealType) {
    setDeleteConfirm({ dateKey: dk, mealType })
  }

  async function confirmDelete() {
    if (!deleteConfirm) return
    try {
      await deleteMeal(deleteConfirm.dateKey, deleteConfirm.mealType)
    } catch (e) {
      console.error('Delete meal failed:', e)
    }
    setDeleteConfirm(null)
  }

  return (
    <div className="page-container">
      <h1 className="text-2xl font-bold mb-1">{t('history.title')} 📅</h1>
      <p className="text-warm-muted text-sm mb-4">{t('history.subtitle')}</p>

      <PageInfoBox
        icon="📅"
        text={t('pageInfo.history')}
        dismissKey="history"
      />

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
          <ChevronLeft className="text-warm-muted" />
        </button>
        <h2 className="font-bold text-lg">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
          <ChevronRight className="text-warm-muted" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="card mb-6">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-warm-muted py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            if (!day) return <div key={i} />
            const entry = getMigratedEntry(day)
            const hasLunch = !!entry?.lunch
            const hasDinner = !!entry?.dinner
            const hasMeal = hasLunch || hasDinner
            const selected = selectedDay === day
            return (
              <button
                key={i}
                onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all ${
                  selected ? 'bg-primary text-white' :
                  isToday(day) ? 'bg-primary/10 text-primary font-bold' :
                  hasMeal ? 'bg-secondary/10' : 'hover:bg-gray-50'
                }`}
              >
                <span>{day}</span>
                {hasMeal && (
                  <span className="text-xs leading-none mt-0.5">
                    {hasLunch && (entry.lunch.emoji || '🍽️')}
                    {hasLunch && hasDinner && ' '}
                    {hasDinner && (entry.dinner.emoji || '🌙')}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay && (() => {
        const dk = dateKey(selectedDay)
        const entry = getMigratedEntry(selectedDay)
        const hasAny = entry?.lunch || entry?.dinner
        return (
          <div className="card">
            <h3 className="font-bold mb-2">
              {selectedDay} {monthNames[currentMonth.getMonth()]}
            </h3>
            {hasAny ? (
              <div className="space-y-1">
                <MealRow
                  meal={entry.lunch}
                  label={t('history.lunch')}
                  onDelete={() => handleDeleteRequest(dk, 'lunch')}
                  onClickRecipe={() => entry.lunch?.recipeId && navigate(`/recipe/${entry.lunch.recipeId}`)}
                />
                <MealRow
                  meal={entry.dinner}
                  label={t('history.dinner')}
                  onDelete={() => handleDeleteRequest(dk, 'dinner')}
                  onClickRecipe={() => entry.dinner?.recipeId && navigate(`/recipe/${entry.dinner.recipeId}`)}
                />
              </div>
            ) : (
              <p className="text-warm-muted">{t('history.noMeals')}</p>
            )}
          </div>
        )
      })()}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-red-600 mb-2">{t('history.removeConfirmTitle')}</h3>
            <p className="text-sm text-warm-text mb-6">{t('history.removeConfirmText')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 font-medium text-warm-text"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium"
              >
                {t('history.removeMeal')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
