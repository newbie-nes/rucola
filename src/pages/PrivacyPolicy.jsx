import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-warm-bg px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-primary font-medium mb-6">
          <ArrowLeft size={18} />
          Torna all'app
        </Link>

        <h1 className="text-3xl font-bold text-primary mb-2">Privacy Policy</h1>
        <p className="text-warm-muted text-sm mb-8">Ultimo aggiornamento: 22 febbraio 2026</p>

        <div className="prose prose-sm space-y-6 text-warm-text">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Titolare del trattamento</h2>
            <p>
              Il titolare del trattamento dei dati personali è <strong>Ernesto Alberghina</strong>.
            </p>
            <p>
              Per qualsiasi richiesta relativa ai tuoi dati personali, puoi contattarmi all'indirizzo email:{' '}
              <a href="mailto:ernesto.alberghina@gmail.com" className="text-primary underline">
                ernesto.alberghina@gmail.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Dati raccolti</h2>
            <p>Rucola raccoglie e tratta i seguenti dati personali:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Dati di registrazione:</strong> nome, indirizzo email, password (conservata in forma criptata)</li>
              <li><strong>Preferenze alimentari:</strong> dieta, allergie, intolleranze, preferenze di porzione</li>
              <li><strong>Contenuto del frigo:</strong> ingredienti inseriti dall'utente</li>
              <li><strong>Storico pasti:</strong> ricette selezionate e preparate</li>
              <li><strong>Feedback:</strong> valutazioni e commenti sulle ricette</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Base giuridica</h2>
            <p>
              Il trattamento dei tuoi dati personali si basa sul <strong>consenso</strong> (art. 6, par. 1, lett. a del
              Regolamento UE 2016/679 — GDPR). Il consenso viene raccolto al momento della registrazione e può essere
              revocato in qualsiasi momento eliminando il tuo account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Dove sono conservati i dati</h2>
            <p>I tuoi dati sono conservati in due luoghi:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Browser (localStorage):</strong> i dati principali dell'app sono memorizzati localmente nel tuo dispositivo per garantire un'esperienza offline</li>
              <li><strong>Google Cloud Firestore:</strong> i feedback e i dati di registrazione sono salvati anche su Firestore (server nell'Unione Europea) per consentire il miglioramento del servizio</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Durata del trattamento</h2>
            <p>
              I tuoi dati personali sono conservati fino a quando non decidi di eliminare il tuo account. Una volta
              eliminato l'account, tutti i dati locali vengono rimossi immediatamente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. I tuoi diritti</h2>
            <p>In conformità con il GDPR, hai diritto a:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Accesso:</strong> richiedere una copia dei tuoi dati personali</li>
              <li><strong>Rettifica:</strong> correggere dati inesatti o incompleti</li>
              <li><strong>Cancellazione:</strong> eliminare i tuoi dati personali ("diritto all'oblio")</li>
              <li><strong>Portabilità:</strong> ricevere i tuoi dati in un formato strutturato e leggibile</li>
              <li><strong>Revoca del consenso:</strong> revocare il consenso in qualsiasi momento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Come esercitare i tuoi diritti</h2>
            <p>Puoi esercitare i tuoi diritti in due modi:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Utilizzando il pulsante <strong>"Elimina account"</strong> nella pagina Impostazioni dell'app</li>
              <li>Inviando un'email a{' '}
                <a href="mailto:ernesto.alberghina@gmail.com" className="text-primary underline">
                  ernesto.alberghina@gmail.com
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">8. Modifiche alla privacy policy</h2>
            <p>
              Questa privacy policy può essere aggiornata periodicamente. In caso di modifiche significative,
              ne verrai informato tramite l'app.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-warm-muted">Rucola — Il tuo sous-chef personale</p>
        </div>
      </div>
    </div>
  )
}
