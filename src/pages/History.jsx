import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import PageInfoBox from '../components/PageInfoBox'

const DAYS_IT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS_IT = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function History() {
  const { t, i18n } = useTranslation()
  const { userProfile } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)

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

  const today = new Date()
  const isToday = (day) => {
    return day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
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
            const meal = meals[dateKey(day)]
            const selected = selectedDay === day
            return (
              <button
                key={i}
                onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all ${
                  selected ? 'bg-primary text-white' :
                  isToday(day) ? 'bg-primary/10 text-primary font-bold' :
                  meal ? 'bg-secondary/10' : 'hover:bg-gray-50'
                }`}
              >
                <span>{day}</span>
                {meal && <span className="text-xs leading-none mt-0.5">{meal.emoji || '🍽️'}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="card">
          <h3 className="font-bold mb-2">
            {selectedDay} {monthNames[currentMonth.getMonth()]}
          </h3>
          {meals[dateKey(selectedDay)] ? (
            <div className="flex items-center gap-3">
              <span className="text-3xl">{meals[dateKey(selectedDay)].emoji || '🍽️'}</span>
              <div>
                <p className="font-semibold">{meals[dateKey(selectedDay)].recipeName}</p>
                <p className="text-sm text-warm-muted">
                  {meals[dateKey(selectedDay)].type === 'dinner' ? t('history.dinner') : t('history.lunch')}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-warm-muted">{t('history.noMeals')}</p>
          )}
        </div>
      )}
    </div>
  )
}
