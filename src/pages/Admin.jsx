import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'
import { Users, MessageSquare, Star, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Admin() {
  const [users, setUsers] = useState([])
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('feedbacks')

  useEffect(() => {
    async function loadData() {
      try {
        // Load users from Firestore
        const usersSnap = await getDocs(collection(db, 'users'))
        const usersData = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        setUsers(usersData)

        // Load feedbacks from Firestore (ordered by createdAt desc)
        const feedbacksQuery = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'))
        const feedbacksSnap = await getDocs(feedbacksQuery)
        const feedbacksData = feedbacksSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        setFeedbacks(feedbacksData)
      } catch (e) {
        console.error('Error loading admin data:', e)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  function formatDate(timestamp) {
    if (!timestamp) return '-'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">🥗</div>
          <p className="text-warm-muted">Caricamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-warm-bg px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-primary font-medium mb-4">
          <ArrowLeft size={18} />
          Torna all'app
        </Link>

        <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-warm-muted text-sm mb-6">
          {users.length} utenti registrati &middot; {feedbacks.length} feedback ricevuti
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('feedbacks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              tab === 'feedbacks'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-warm-muted hover:bg-gray-200'
            }`}
          >
            <MessageSquare size={16} />
            Feedback ({feedbacks.length})
          </button>
          <button
            onClick={() => setTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              tab === 'users'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-warm-muted hover:bg-gray-200'
            }`}
          >
            <Users size={16} />
            Utenti ({users.length})
          </button>
        </div>

        {/* Feedbacks tab */}
        {tab === 'feedbacks' && (
          <div className="space-y-3">
            {feedbacks.length === 0 ? (
              <div className="card text-center py-8">
                <div className="text-4xl mb-3">📝</div>
                <p className="text-warm-muted">Nessun feedback ancora</p>
              </div>
            ) : (
              feedbacks.map(fb => (
                <div key={fb.id} className="card">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{fb.userName || 'Anonimo'}</p>
                      <p className="text-xs text-warm-muted">{fb.userEmail}</p>
                    </div>
                    <p className="text-xs text-warm-muted">{formatDate(fb.createdAt)}</p>
                  </div>
                  <p className="text-sm text-warm-text mb-2">
                    Ricetta: <span className="font-medium">{fb.mealName || fb.mealId}</span>
                  </p>
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star
                        key={n}
                        size={16}
                        fill={n <= fb.rating ? '#FFB74D' : 'none'}
                        stroke={n <= fb.rating ? '#FFB74D' : '#D1D5DB'}
                        strokeWidth={1.5}
                      />
                    ))}
                    <span className="text-sm text-warm-muted ml-1">{fb.rating}/5</span>
                  </div>
                  {fb.comment && (
                    <p className="text-sm text-warm-text mt-2 italic">"{fb.comment}"</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Users tab */}
        {tab === 'users' && (
          <div className="space-y-3">
            {users.length === 0 ? (
              <div className="card text-center py-8">
                <div className="text-4xl mb-3">👥</div>
                <p className="text-warm-muted">Nessun utente registrato</p>
              </div>
            ) : (
              users.map(u => (
                <div key={u.id} className="card flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-lg">👤</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{u.displayName || 'Senza nome'}</p>
                    <p className="text-xs text-warm-muted truncate">{u.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-warm-muted">{formatDate(u.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
