import { createContext, useContext, useState, useEffect } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  deleteUser,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

const AuthContext = createContext()
const googleProvider = new GoogleAuthProvider()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        // Load profile from Firestore
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (snap.exists()) {
            setUserProfile(snap.data())
          } else {
            // User exists in Auth but not in Firestore (edge case)
            setUserProfile(null)
          }
        } catch (e) {
          console.warn('Failed to load profile from Firestore:', e)
          setUserProfile(null)
        }
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  async function register(email, password, displayName, gdprConsentedAt) {
    // Create user in Firebase Auth
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const firebaseUser = cred.user

    // Set display name
    await updateProfile(firebaseUser, { displayName })

    // Create profile in Firestore (serverTimestamp for Firestore, ISO string for local state)
    const now = new Date().toISOString()
    const firestoreProfile = {
      displayName,
      email,
      createdAt: serverTimestamp(),
      gdprConsentedAt: gdprConsentedAt || now,
      onboardingComplete: false,
      mealHistory: {}
    }
    await setDoc(doc(db, 'users', firebaseUser.uid), firestoreProfile)

    const localProfile = {
      displayName,
      email,
      createdAt: now,
      gdprConsentedAt: gdprConsentedAt || now,
      onboardingComplete: false,
      mealHistory: {}
    }
    setUserProfile(localProfile)
    return firebaseUser
  }

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    // Profile will be loaded by onAuthStateChanged listener
    return cred.user
  }

  async function loginWithGoogle() {
    const cred = await signInWithPopup(auth, googleProvider)
    const firebaseUser = cred.user

    // Check if profile exists in Firestore, if not create it
    const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
    if (!snap.exists()) {
      const now = new Date().toISOString()
      const firestoreProfile = {
        displayName: firebaseUser.displayName || '',
        email: firebaseUser.email,
        createdAt: serverTimestamp(),
        gdprConsentedAt: now,
        onboardingComplete: false,
        mealHistory: {}
      }
      await setDoc(doc(db, 'users', firebaseUser.uid), firestoreProfile)

      const localProfile = {
        displayName: firebaseUser.displayName || '',
        email: firebaseUser.email,
        createdAt: now,
        gdprConsentedAt: now,
        onboardingComplete: false,
        mealHistory: {}
      }
      setUserProfile(localProfile)
    }
    // Otherwise onAuthStateChanged will load the profile

    return firebaseUser
  }

  async function logout() {
    await signOut(auth)
    // State cleared by onAuthStateChanged listener
  }

  async function deleteAccount() {
    if (!user) return
    const uid = user.uid
    // Delete Firestore profile
    try {
      await deleteDoc(doc(db, 'users', uid))
    } catch (e) {
      console.warn('Failed to delete Firestore profile:', e)
    }
    // Delete Firebase Auth account
    await deleteUser(user)
    // State cleared by onAuthStateChanged listener
  }

  async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email)
  }

  async function updateUserProfile(data) {
    if (!user) throw new Error('No authenticated user')
    const previous = userProfile
    const updated = { ...userProfile, ...data }
    setUserProfile(updated)
    // Save to Firestore
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...updated,
        updatedAt: serverTimestamp()
      }, { merge: true })
    } catch (e) {
      console.error('Firestore profile sync failed:', e)
      setUserProfile(previous)
      throw e
    }
  }

  /**
   * Migrate old meal entry format to new { lunch, dinner } format.
   * Old: { recipeId, recipeName, emoji, type } directly under dateKey
   * New: { lunch: { recipeId, recipeName, emoji }, dinner: { ... } }
   */
  function migrateMealEntry(entry) {
    if (!entry) return null
    // Already new format (has lunch or dinner key)
    if (entry.lunch || entry.dinner) return entry
    // Old format — migrate based on type field
    const mealType = entry.type === 'dinner' ? 'dinner' : 'lunch'
    const { type, ...mealData } = entry
    return { [mealType]: mealData }
  }

  // Save a meal to Firestore with mealType separation (lunch/dinner)
  async function saveMeal(dateKey, mealType, mealData) {
    if (!user) throw new Error('No authenticated user')
    const previousHistory = userProfile?.mealHistory || {}
    const existingEntry = migrateMealEntry(previousHistory[dateKey]) || {}
    const updatedEntry = { ...existingEntry, [mealType]: mealData }
    const updatedHistory = { ...previousHistory, [dateKey]: updatedEntry }
    setUserProfile(prev => ({ ...prev, mealHistory: updatedHistory }))
    try {
      await setDoc(doc(db, 'users', user.uid), {
        mealHistory: updatedHistory,
        updatedAt: serverTimestamp()
      }, { merge: true })
    } catch (e) {
      console.error('Firestore meal save failed:', e)
      setUserProfile(prev => ({ ...prev, mealHistory: previousHistory }))
      throw e
    }
  }

  // Delete a meal from a specific date and type (optimistic update + rollback)
  async function deleteMeal(dateKey, mealType) {
    if (!user) throw new Error('No authenticated user')
    const previousHistory = userProfile?.mealHistory || {}
    const existingEntry = migrateMealEntry(previousHistory[dateKey]) || {}
    const updatedEntry = { ...existingEntry }
    delete updatedEntry[mealType]

    const updatedHistory = { ...previousHistory }
    // If both slots are empty, remove the date key entirely
    if (!updatedEntry.lunch && !updatedEntry.dinner) {
      delete updatedHistory[dateKey]
    } else {
      updatedHistory[dateKey] = updatedEntry
    }

    setUserProfile(prev => ({ ...prev, mealHistory: updatedHistory }))
    try {
      await setDoc(doc(db, 'users', user.uid), {
        mealHistory: updatedHistory,
        updatedAt: serverTimestamp()
      }, { merge: true })
    } catch (e) {
      console.error('Firestore meal delete failed:', e)
      setUserProfile(prev => ({ ...prev, mealHistory: previousHistory }))
      throw e
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    register,
    login,
    loginWithGoogle,
    logout,
    deleteAccount,
    resetPassword,
    updateUserProfile,
    saveMeal,
    deleteMeal,
    migrateMealEntry
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
