import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const keyPath = resolve(__dirname, '..', 'serviceAccountKey.json')

// Colors
const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'
const DIM = '\x1b[2m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const CYAN = '\x1b[36m'
const RED = '\x1b[31m'

// Load service account
let serviceAccount
try {
  serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'))
} catch {
  console.error(`${RED}serviceAccountKey.json non trovato!${RESET}`)
  console.error(`\nScaricalo da Firebase Console:`)
  console.error(`  1. Vai su https://console.firebase.google.com/project/rucola-34b39/settings/serviceaccounts/adminsdk`)
  console.error(`  2. Clicca "Generate New Private Key"`)
  console.error(`  3. Salva il file come: ${CYAN}rucola/serviceAccountKey.json${RESET}`)
  process.exit(1)
}

// Init Firebase Admin
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

function formatDate(timestamp) {
  if (!timestamp) return '-'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function stars(rating) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

function daysAgo(timestamp) {
  if (!timestamp) return Infinity
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
}

async function main() {
  console.log(`\n${BOLD}${GREEN}=== RUCOLA ADMIN CHECK ===${RESET}\n`)

  // --- USERS ---
  const usersSnap = await db.collection('users').get()
  const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  const recentUsers = users
    .filter(u => daysAgo(u.createdAt) <= 7)
    .sort((a, b) => (b.createdAt?._seconds || 0) - (a.createdAt?._seconds || 0))

  console.log(`${BOLD}${CYAN}UTENTI${RESET}  ${DIM}(totale: ${users.length})${RESET}`)
  if (recentUsers.length > 0) {
    console.log(`${GREEN}  Nuovi ultimi 7 giorni: ${recentUsers.length}${RESET}`)
    for (const u of recentUsers) {
      console.log(`    ${BOLD}${u.displayName || 'Senza nome'}${RESET} ${DIM}(${u.email})${RESET}`)
      console.log(`    ${DIM}Registrato: ${formatDate(u.createdAt)}${RESET}`)
      console.log(`    ${DIM}Dieta: ${u.diet || '-'} | Onboarding: ${u.onboardingComplete ? 'completato' : 'no'}${RESET}`)
      console.log()
    }
  } else {
    console.log(`  ${DIM}Nessun nuovo utente negli ultimi 7 giorni${RESET}`)
  }

  // --- FEEDBACKS ---
  const feedbacksSnap = await db.collection('feedbacks').orderBy('createdAt', 'desc').limit(10).get()
  const feedbacks = feedbacksSnap.docs.map(d => ({ id: d.id, ...d.data() }))

  console.log(`\n${BOLD}${YELLOW}FEEDBACK${RESET}  ${DIM}(ultimi 10)${RESET}`)
  if (feedbacks.length === 0) {
    console.log(`  ${DIM}Nessun feedback${RESET}`)
  } else {
    for (const fb of feedbacks) {
      const isAppFeedback = fb.type === 'app_feedback'
      const tag = isAppFeedback ? `${RED}[APP]${RESET}` : ''
      console.log(`  ${BOLD}${fb.userName || 'Anonimo'}${RESET} ${DIM}(${fb.userEmail})${RESET} ${tag}`)
      if (!isAppFeedback) {
        console.log(`    Ricetta: ${fb.mealName || fb.mealId || '-'}`)
      }
      console.log(`    ${YELLOW}${stars(fb.rating)}${RESET} ${fb.rating}/5`)
      if (fb.comment) {
        console.log(`    ${DIM}"${fb.comment}"${RESET}`)
      }
      console.log(`    ${DIM}${formatDate(fb.createdAt)}${RESET}`)
      console.log()
    }
  }

  console.log(`${DIM}---${RESET}`)
  console.log(`${DIM}Portale admin web: https://rucola-bn6.pages.dev/admin${RESET}\n`)
}

main().catch(err => {
  console.error(`${RED}Errore:${RESET}`, err.message)
  process.exit(1)
})
