import { createContext, useContext, useState, useEffect } from 'react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

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

async function seedAdminAccount() {
  const users = getUsers()
  const adminEmail = 'alberghinaernesto@gmail.com'
  const uid = 'admin_ernesto'
  const now = new Date().toISOString()

  if (users[adminEmail]) {
    // Account exists → force correct password and uid
    users[adminEmail].password = 'rucola2026'
    users[adminEmail].user.uid = uid
    saveUsers(users)
    return
  }

  // Account doesn't exist → create from scratch
  users[adminEmail] = {
    password: 'rucola2026',
    user: { uid, email: adminEmail, displayName: 'Ernesto' },
    profile: {
      displayName: 'Ernesto',
      email: adminEmail,
      createdAt: now,
      gdprConsentedAt: now,
      onboardingComplete: false
    }
  }
  saveUsers(users)

  // Also save to Firestore
  try {
    await setDoc(doc(db, 'users', uid), {
      displayName: 'Ernesto',
      email: adminEmail,
      createdAt: serverTimestamp(),
      gdprConsentedAt: now
    })
  } catch (e) {
    console.warn('Firestore admin seed failed (offline?):', e)
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Seed admin account so it exists on every browser/device
    seedAdminAccount()

    const stored = localStorage.getItem('rucola_current_user')
    if (stored) {
      const parsed = JSON.parse(stored)
      setUser(parsed)
      const users = getUsers()
      setUserProfile(users[parsed.uid]?.profile || null)
    }
    setLoading(false)
  }, [])

  async function register(email, password, displayName, gdprConsentedAt) {
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
      gdprConsentedAt: gdprConsentedAt || new Date().toISOString(),
      onboardingComplete: false
    }
    users[email] = { password, user: newUser, profile }
    saveUsers(users)
    setUser(newUser)
    setUserProfile(profile)
    localStorage.setItem('rucola_current_user', JSON.stringify(newUser))

    // Save user to Firestore
    try {
      await setDoc(doc(db, 'users', uid), {
        displayName,
        email,
        createdAt: serverTimestamp(),
        gdprConsentedAt: gdprConsentedAt || new Date().toISOString()
      })
    } catch (e) {
      console.warn('Firestore user save failed (offline?):', e)
    }

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

  async function deleteAccount() {
    if (!user) return
    // Remove user from rucola_users
    const users = getUsers()
    const emailKey = Object.keys(users).find(k => users[k].user?.uid === user.uid)
    if (emailKey) {
      delete users[emailKey]
      saveUsers(users)
    }
    // Clean up all user data
    localStorage.removeItem('rucola_current_user')
    localStorage.removeItem('rucola_feedbacks')
    localStorage.removeItem('rucola_meal_history')
    localStorage.removeItem('rucola_last_meal')
    localStorage.removeItem('rucola_last_meal_name')
    localStorage.removeItem('rucola_last_feedback')
    // Reset state
    setUser(null)
    setUserProfile(null)
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
    deleteAccount,
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
