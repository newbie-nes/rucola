import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  Globe, Bell, Calendar, User, UtensilsCrossed, LogOut, ChevronRight
} from 'lucide-react'

export default function Settings() {
  const { t, i18n } = useTranslation()
  const { user, userProfile, logout } = useAuth()
  const navigate = useNavigate()

  function toggleLanguage() {
    const newLang = i18n.language?.startsWith('it') ? 'en' : 'it'
    i18n.changeLanguage(newLang)
  }

  async function handleLogout() {
    await logout()
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

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full mt-8 py-3 flex items-center justify-center gap-2 text-danger font-semibold"
      >
        <LogOut size={20} />
        {t('settings.logout')}
      </button>

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
