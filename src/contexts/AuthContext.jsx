import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

// LocalStorage-based auth for demo/MVP
// Replace with Firebase when ready for production
function getUsers() {
  return JSON.parse(localStorage.getItem('rucola_users') || '{}')
}

function saveUsers(users) {
  localStorage.setItem('rucola_users', JSON.stringify(users))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('rucola_current_user')
    if (stored) {
      const parsed = JSON.parse(stored)
      setUser(parsed)
      const users = getUsers()
      setUserProfile(users[parsed.uid]?.profile || null)
    }
    setLoading(false)
  }, [])

  async function register(email, password, displayName) {
    const users = getUsers()
    if (users[email]) {
      throw { code: 'auth/email-already-in-use', message: 'Email already in use' }
    }
    const uid = 'user_' + Date.now()
    const newUser = { uid, email, displayName }
    const profile = {
      displayName,
      email,
      createdAt: new Date().toISOString(),
      onboardingComplete: false
    }
    users[email] = { password, user: newUser, profile }
    saveUsers(users)
    setUser(newUser)
    setUserProfile(profile)
    localStorage.setItem('rucola_current_user', JSON.stringify(newUser))
    return newUser
  }

  async function login(email, password) {
    const users = getUsers()
    const entry = users[email]
    if (!entry || entry.password !== password) {
      throw { code: 'auth/wrong-password', message: 'Invalid email or password' }
    }
    setUser(entry.user)
    setUserProfile(entry.profile)
    localStorage.setItem('rucola_current_user', JSON.stringify(entry.user))
    return entry.user
  }

  async function logout() {
    setUser(null)
    setUserProfile(null)
    localStorage.removeItem('rucola_current_user')
  }

  async function resetPassword(email) {
    // In demo mode, just simulate
    return true
  }

  async function updateUserProfile(data) {
    if (!user) return
    const updated = { ...userProfile, ...data }
    setUserProfile(updated)
    // Persist to users store
    const users = getUsers()
    const entry = Object.values(users).find(u => u.user.uid === user.uid)
    if (entry) {
      entry.profile = updated
      saveUsers(users)
    }
  }

  async function loadProfile() {
    return userProfile
  }

  const value = {
    user,
    userProfile,
    loading,
    register,
    login,
    logout,
    resetPassword,
    updateUserProfile,
    loadProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
