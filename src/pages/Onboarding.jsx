import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, ArrowRight, Check, Calendar } from 'lucide-react'

const STEPS = ['diet', 'allergies', 'preferences', 'meals', 'calendar']

const DIETS = ['omnivore', 'vegetarian', 'vegan']
const ALLERGIES = ['gluten', 'lactose', 'nuts', 'shellfish', 'eggs', 'soy']
const PREFERENCES = ['noSpicy', 'noRawFish', 'largePortion', 'smallPortion', 'quick', 'budgetFriendly']
const DIET_EMOJIS = { omnivore: '🥩', vegetarian: '🥚', vegan: '🌱' }
const ALLERGY_EMOJIS = { gluten: '🌾', lactose: '🥛', nuts: '🥜', shellfish: '🦐', eggs: '🥚', soy: '🫘' }
const PREF_EMOJIS = { noSpicy: '🌶️', noRawFish: '🐟', largePortion: '🍽️', smallPortion: '🥗', quick: '⏱️', budgetFriendly: '💰' }

export default function Onboarding() {
  const { t } = useTranslation()
  const { user, updateUserProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [diet, setDiet] = useState('')
  const [allergies, setAllergies] = useState([])
  const [preferences, setPreferences] = useState([])
  const [mealsPerWeek, setMealsPerWeek] = useState(5)
  const [loading, setLoading] = useState(false)

  function toggleItem(arr, setArr, item) {
    setArr(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])
  }

  async function handleComplete() {
    setLoading(true)
    await updateUserProfile({
      diet,
      allergies,
      preferences,
      mealsPerWeek,
      onboardingComplete: true,
      fridge: { base: [], vegetable: [], protein: [] }
    })
    navigate('/')
  }

  function canProceed() {
    if (step === 0) return !!diet
    return true
  }

  return (
    <div className="min-h-screen bg-warm-bg px-6 py-8">
      <div className="max-w-sm mx-auto">
        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Step 0: Diet */}
        {step === 0 && (
          <div className="animate-in">
            <h2 className="text-2xl font-bold mb-2">{t('onboarding.dietTitle')}</h2>
            <p className="text-warm-muted mb-6">{t('onboarding.dietSubtitle')}</p>
            <div className="space-y-3">
              {DIETS.map(d => (
                <button
                  key={d}
                  onClick={() => setDiet(d)}
                  className={`w-full p-4 rounded-2xl text-left flex items-center gap-4 transition-all ${
                    diet === d
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-white border-2 border-gray-100'
                  }`}
                >
                  <span className="text-3xl">{DIET_EMOJIS[d]}</span>
                  <span className="font-semibold text-lg">{t(`onboarding.diet.${d}`)}</span>
                  {diet === d && <Check className="ml-auto text-primary" size={22} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Allergies */}
        {step === 1 && (
          <div className="animate-in">
            <h2 className="text-2xl font-bold mb-2">{t('onboarding.allergiesTitle')}</h2>
            <p className="text-warm-muted mb-6">{t('onboarding.allergiesSubtitle')}</p>
            <div className="flex flex-wrap gap-3">
              {ALLERGIES.map(a => (
                <button
                  key={a}
                  onClick={() => toggleItem(allergies, setAllergies, a)}
                  className={allergies.includes(a) ? 'chip-active' : 'chip-inactive'}
                >
                  <span>{ALLERGY_EMOJIS[a]}</span>
                  {t(`onboarding.allergy.${a}`)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Preferences */}
        {step === 2 && (
          <div className="animate-in">
            <h2 className="text-2xl font-bold mb-2">{t('onboarding.preferencesTitle')}</h2>
            <p className="text-warm-muted mb-6">{t('onboarding.preferencesSubtitle')}</p>
            <div className="flex flex-wrap gap-3">
              {PREFERENCES.map(p => (
                <button
                  key={p}
                  onClick={() => toggleItem(preferences, setPreferences, p)}
                  className={preferences.includes(p) ? 'chip-active' : 'chip-inactive'}
                >
                  <span>{PREF_EMOJIS[p]}</span>
                  {t(`onboarding.pref.${p}`)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Meals per week */}
        {step === 3 && (
          <div className="animate-in">
            <h2 className="text-2xl font-bold mb-2">{t('onboarding.mealsTitle')}</h2>
            <p className="text-warm-muted mb-6">{t('onboarding.mealsSubtitle')}</p>
            <div className="card text-center">
              <div className="text-5xl font-bold text-primary mb-2">{mealsPerWeek}</div>
              <p className="text-warm-muted mb-6">{t('onboarding.mealsPerWeek')}</p>
              <input
                type="range"
                min="1"
                max="7"
                value={mealsPerWeek}
                onChange={e => setMealsPerWeek(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-sm text-warm-muted mt-2">
                <span>1</span>
                <span>7</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Calendar */}
        {step === 4 && (
          <div className="animate-in">
            <h2 className="text-2xl font-bold mb-2">{t('onboarding.calendarTitle')}</h2>
            <p className="text-warm-muted mb-6">{t('onboarding.calendarSubtitle')}</p>
            <div className="space-y-3">
              <button className="btn-outline w-full flex items-center justify-center gap-2">
                <Calendar size={20} />
                {t('onboarding.calendarConnect')}
              </button>
              <button
                onClick={handleComplete}
                className="w-full text-warm-muted text-sm py-2"
              >
                {t('onboarding.calendarSkip')}
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-10">
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1 text-warm-muted font-medium">
              <ArrowLeft size={18} /> {t('common.back')}
            </button>
          ) : <div />}

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="btn-primary flex items-center gap-1"
            >
              {t('common.next')} <ArrowRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={loading}
              className="btn-secondary flex items-center gap-1"
            >
              {loading ? '...' : t('onboarding.complete')} <Check size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
