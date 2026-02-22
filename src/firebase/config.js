import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBhcXght_qCEH57zpybrmaglEdDbfNozqs",
  authDomain: "rucola-34b39.firebaseapp.com",
  projectId: "rucola-34b39",
  storageBucket: "rucola-34b39.firebasestorage.app",
  messagingSenderId: "819928353252",
  appId: "1:819928353252:web:c859dedabfb706054f5ff1",
  measurementId: "G-9VQ0V55L8L"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
