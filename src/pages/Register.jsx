import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'

export default function Register() {
  const { t } = useTranslation()
  const { register, loginWithGoogle } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [gdprConsent, setGdprConsent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirmPw) {
      return setError(t('auth.passwordMismatch'))
    }
    if (password.length < 6) {
      return setError(t('auth.weakPassword'))
    }
    if (!gdprConsent) {
      return setError(t('auth.gdprRequired'))
    }
    setLoading(true)
    try {
      const gdprConsentedAt = new Date().toISOString()
      await register(email, password, name, gdprConsentedAt)
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError(t('auth.emailInUse'))
      } else {
        setError(err.message)
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col justify-center px-6">
      <div className="max-w-sm mx-auto w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🥗</div>
          <h1 className="text-3xl font-bold text-primary">Rucola</h1>
          <p className="text-warm-muted mt-2">{t('auth.registerSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-danger/10 text-danger text-sm p-3 rounded-xl">{error}</div>
          )}

          <div className="relative">
            <User className="absolute left-4 top-3.5 text-warm-muted" size={18} />
            <input
              type="text"
              className="input-field pl-11"
              placeholder={t('auth.name')}
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-warm-muted" size={18} />
            <input
              type="email"
              className="input-field pl-11"
              placeholder={t('auth.email')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-warm-muted" size={18} />
            <input
              type={showPw ? 'text' : 'password'}
              className="input-field pl-11 pr-11"
              placeholder={t('auth.password')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-4 top-3.5 text-warm-muted"
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-warm-muted" size={18} />
            <input
              type={showPw ? 'text' : 'password'}
              className="input-field pl-11"
              placeholder={t('auth.confirmPassword')}
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              required
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer px-1">
            <input
              type="checkbox"
              checked={gdprConsent}
              onChange={e => setGdprConsent(e.target.checked)}
              className="mt-1 w-4 h-4 accent-primary shrink-0"
            />
            <span className="text-sm text-warm-text">
              {t('auth.gdprConsent')}{' '}
              <Link to="/privacy" className="text-primary font-semibold underline" target="_blank">
                {t('auth.privacyPolicy')}
              </Link>
            </span>
          </label>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? '...' : t('auth.register')}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-warm-muted">{t('auth.orContinueWith')}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button
          onClick={async () => {
            setError('')
            setLoading(true)
            try { await loginWithGoogle() } catch (err) { setError(err.message) }
            setLoading(false)
          }}
          className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-2xl border-2 border-gray-200 bg-white font-semibold text-warm-text hover:bg-gray-50 active:scale-[0.97] transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>

        <p className="text-center text-warm-muted text-sm mt-6">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-primary font-semibold">{t('auth.login')}</Link>
        </p>
      </div>
    </div>
  )
}
