import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { Mail, ArrowLeft } from 'lucide-react'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError(t('auth.userNotFound'))
      } else if (err.code === 'auth/invalid-email') {
        setError(t('auth.invalidEmail'))
      } else if (err.code === 'auth/too-many-requests') {
        setError(t('auth.tooManyRequests'))
      } else {
        setError(t('errors.generic'))
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col justify-center px-6">
      <div className="max-w-sm mx-auto w-full">
        <Link to="/login" className="inline-flex items-center gap-1 text-primary mb-6">
          <ArrowLeft size={18} /> {t('common.back')}
        </Link>

        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔑</div>
          <h1 className="text-2xl font-bold">{t('auth.resetPassword')}</h1>
        </div>

        {sent ? (
          <div className="card text-center">
            <div className="text-4xl mb-3">📧</div>
            <p className="text-warm-muted">{t('auth.resetSent')}</p>
            <Link to="/login" className="btn-primary inline-block mt-4">{t('auth.login')}</Link>
          </div>
        ) : (
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
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? '...' : t('auth.resetPassword')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
