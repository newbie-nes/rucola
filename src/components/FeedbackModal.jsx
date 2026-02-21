import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Star } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function FeedbackModal({ onClose }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const lastMeal = localStorage.getItem('rucola_last_meal') || '?'
  const lastMealName = localStorage.getItem('rucola_last_meal_name') || lastMeal

  async function handleSubmit() {
    if (rating === 0) return
    // Save feedback to localStorage
    const feedbacks = JSON.parse(localStorage.getItem('rucola_feedbacks') || '[]')
    feedbacks.push({ mealId: lastMeal, mealName: lastMealName, rating, comment, createdAt: new Date().toISOString() })
    localStorage.setItem('rucola_feedbacks', JSON.stringify(feedbacks))
    localStorage.setItem('rucola_last_feedback', new Date().toDateString())
    setSubmitted(true)
    setTimeout(onClose, 1500)
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
        <div className="card w-full max-w-sm text-center py-8 animate-in">
          <div className="text-5xl mb-3">🎉</div>
          <p className="text-lg font-bold">{t('feedback.thankYou')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
      <div className="card w-full max-w-sm animate-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{t('feedback.title')}</h3>
          <button onClick={onClose} className="text-warm-muted"><X size={20} /></button>
        </div>

        <p className="text-warm-muted mb-4">{t('feedback.rateYesterday', { meal: lastMealName })}</p>

        {/* Stars */}
        <div className="flex justify-center gap-2 mb-5">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(n)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={36}
                fill={n <= (hovered || rating) ? '#FFB74D' : 'none'}
                stroke={n <= (hovered || rating) ? '#FFB74D' : '#D1D5DB'}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>

        {/* Comment */}
        <textarea
          className="input-field resize-none h-20 mb-4"
          placeholder={t('feedback.commentPlaceholder')}
          value={comment}
          onChange={e => setComment(e.target.value)}
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-warm-muted font-medium">
            {t('feedback.skip')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0}
            className="btn-primary flex-1"
          >
            {t('feedback.submit')}
          </button>
        </div>
      </div>
    </div>
  )
}
