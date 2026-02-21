import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'

export default function Register() {
  const { t } = useTranslation()
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
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
    setLoading(true)
    try {
      await register(email, password, name)
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

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? '...' : t('auth.register')}
          </button>
        </form>

        <p className="text-center text-warm-muted text-sm mt-6">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-primary font-semibold">{t('auth.login')}</Link>
        </p>
      </div>
    </div>
  )
}
