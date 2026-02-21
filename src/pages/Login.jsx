import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col justify-center px-6">
      <div className="max-w-sm mx-auto w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🥗</div>
          <h1 className="text-3xl font-bold text-primary">Rucola</h1>
          <p className="text-warm-muted mt-2">{t('auth.loginSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-danger/10 text-danger text-sm p-3 rounded-xl">{error}</div>
          )}

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

          <Link to="/forgot-password" className="block text-sm text-primary text-right">
            {t('auth.forgotPassword')}
          </Link>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? '...' : t('auth.login')}
          </button>
        </form>

        <p className="text-center text-warm-muted text-sm mt-6">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-primary font-semibold">{t('auth.register')}</Link>
        </p>
      </div>
    </div>
  )
}
