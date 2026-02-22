import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import {
  Globe, Bell, Calendar, User, UtensilsCrossed, LogOut, ChevronRight, Trash2, Shield, MessageCircle, Send, Star
} from 'lucide-react'

export default function Settings() {
  const { t, i18n } = useTranslation()
  const { user, userProfile, logout, deleteAccount } = useAuth()
  const navigate = useNavigate()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [appRating, setAppRating] = useState(0)
  const [appHovered, setAppHovered] = useState(0)
  const [appComment, setAppComment] = useState('')
  const [appFbSubmitted, setAppFbSubmitted] = useState(false)
  const lang = i18n.language?.startsWith('it') ? 'it' : 'en'

  async function submitAppFeedback() {
    if (appRating === 0 && !appComment.trim()) return
    try {
      await addDoc(collection(db, 'feedbacks'), {
        type: 'app_feedback',
        userId: user?.uid || 'unknown',
        userName: user?.displayName || 'Unknown',
        userEmail: user?.email || '',
        mealId: 'app',
        mealName: lang === 'it' ? 'Feedback App' : 'App Feedback',
        rating: appRating,
        comment: appComment,
        createdAt: serverTimestamp()
      })
    } catch (e) {
      console.warn('Firestore app feedback save failed:', e)
    }
    setAppFbSubmitted(true)
  }

  function toggleLanguage() {
    const newLang = i18n.language?.startsWith('it') ? 'en' : 'it'
    i18n.changeLanguage(newLang)
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  async function handleDeleteAccount() {
    await deleteAccount()
    navigate('/login')
  }

  const dietLabel = userProfile?.diet
    ? t(`onboarding.diet.${userProfile.diet}`)
    : '-'

  return (
    <div className="page-container">
      <h1 className="text-2xl font-bold mb-6">{t('settings.title')} ⚙️</h1>

      {/* Profile card */}
      <div className="card mb-6 flex items-center gap-4">
        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
          <span className="text-2xl">👤</span>
        </div>
        <div>
          <p className="font-bold text-lg">{user?.displayName || 'User'}</p>
          <p className="text-sm text-warm-muted">{user?.email}</p>
          <p className="text-xs text-warm-muted mt-0.5">🍽️ {dietLabel}</p>
        </div>
      </div>

      {/* Settings list */}
      <div className="space-y-2">
        <SettingRow
          icon={<Globe size={20} />}
          label={t('settings.language')}
          value={i18n.language?.startsWith('it') ? '🇮🇹 Italiano' : '🇬🇧 English'}
          onClick={toggleLanguage}
        />

        <SettingRow
          icon={<Bell size={20} />}
          label={t('settings.notifications')}
          value={t('settings.notConnected')}
          onClick={() => {}}
        />

        <SettingRow
          icon={<Calendar size={20} />}
          label={t('settings.googleCalendar')}
          value={t('settings.notConnected')}
          onClick={() => {}}
        />

        <SettingRow
          icon={<UtensilsCrossed size={20} />}
          label={t('settings.dietPreferences')}
          value={dietLabel}
          onClick={() => navigate('/onboarding')}
        />

        <SettingRow
          icon={<User size={20} />}
          label={t('settings.editProfile')}
          onClick={() => {}}
        />
      </div>

      {/* Privacy Policy link */}
      <Link
        to="/privacy"
        className="w-full mt-6 card flex items-center gap-3 text-left py-4"
      >
        <div className="text-primary"><Shield size={20} /></div>
        <div className="flex-1">
          <p className="font-medium">{t('settings.privacyPolicy')}</p>
        </div>
        <ChevronRight size={18} className="text-warm-muted" />
      </Link>

      {/* App Feedback */}
      <button
        onClick={() => setShowFeedback(!showFeedback)}
        className="w-full mt-2 card flex items-center gap-3 text-left py-4"
      >
        <div className="text-primary"><MessageCircle size={20} /></div>
        <div className="flex-1">
          <p className="font-medium">{lang === 'it' ? 'Lascia un feedback' : 'Leave feedback'}</p>
          <p className="text-sm text-warm-muted">{lang === 'it' ? 'Aiutaci a migliorare Rucola' : 'Help us improve Rucola'}</p>
        </div>
        <ChevronRight size={18} className={`text-warm-muted transition-transform ${showFeedback ? 'rotate-90' : ''}`} />
      </button>

      {showFeedback && (
        <div className="card mt-2">
          {appFbSubmitted ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">🎉</div>
              <p className="text-sm font-semibold text-green-600">{t('feedback.thankYou')}</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-warm-muted mb-3">
                {lang === 'it' ? 'Come ti trovi con l\'app? Suggerimenti, bug, idee?' : 'How\'s the app? Suggestions, bugs, ideas?'}
              </p>
              <div className="flex justify-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onMouseEnter={() => setAppHovered(n)}
                    onMouseLeave={() => setAppHovered(0)}
                    onClick={() => setAppRating(n)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={28}
                      fill={n <= (appHovered || appRating) ? '#FFB74D' : 'none'}
                      stroke={n <= (appHovered || appRating) ? '#FFB74D' : '#D1D5DB'}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>
              <textarea
                className="input-field resize-none h-20 mb-3 text-sm"
                placeholder={lang === 'it' ? 'Scrivi qui il tuo feedback...' : 'Write your feedback here...'}
                value={appComment}
                onChange={e => setAppComment(e.target.value)}
              />
              <button
                onClick={submitAppFeedback}
                disabled={appRating === 0 && !appComment.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Send size={16} /> {t('feedback.submit')}
              </button>
            </>
          )}
        </div>
      )}

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full mt-6 py-3 flex items-center justify-center gap-2 text-danger font-semibold"
      >
        <LogOut size={20} />
        {t('settings.logout')}
      </button>

      {/* Delete account */}
      <button
        onClick={() => setShowDeleteConfirm(true)}
        className="w-full mt-2 py-3 flex items-center justify-center gap-2 text-red-400 text-sm"
      >
        <Trash2 size={16} />
        {t('settings.deleteAccount')}
      </button>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-red-600 mb-3">{t('settings.deleteAccount')}</h3>
            <p className="text-sm text-warm-text mb-6">{t('settings.deleteConfirm')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 font-medium text-warm-text"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium"
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-warm-muted mt-4">Rucola v1.0.0</p>
    </div>
  )
}

function SettingRow({ icon, label, value, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full card flex items-center gap-3 text-left py-4"
    >
      <div className="text-primary">{icon}</div>
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        {value && <p className="text-sm text-warm-muted">{value}</p>}
      </div>
      <ChevronRight size={18} className="text-warm-muted" />
    </button>
  )
}
