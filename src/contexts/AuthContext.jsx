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

    // Create profile in Firestore
    const profile = {
      displayName,
      email,
      createdAt: serverTimestamp(),
      gdprConsentedAt: gdprConsentedAt || new Date().toISOString(),
      onboardingComplete: false,
      mealHistory: {}
    }
    await setDoc(doc(db, 'users', firebaseUser.uid), profile)

    setUserProfile(profile)
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
      const profile = {
        displayName: firebaseUser.displayName || '',
        email: firebaseUser.email,
        createdAt: serverTimestamp(),
        gdprConsentedAt: new Date().toISOString(),
        onboardingComplete: false,
        mealHistory: {}
      }
      await setDoc(doc(db, 'users', firebaseUser.uid), profile)
      setUserProfile(profile)
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

  // Save a meal to Firestore (replaces localStorage meal history)
  async function saveMeal(dateKey, mealData) {
    if (!user) throw new Error('No authenticated user')
    const previousHistory = userProfile?.mealHistory || {}
    const updatedHistory = { ...previousHistory, [dateKey]: mealData }
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
    saveMeal
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
