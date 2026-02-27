// Script per arricchire le 1000 ricette con dosi e tempi
// Legge recipes.js come testo, applica le mappature, riscrive il file

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { INGREDIENT_QUANTITIES, STEP_TIMINGS } from './ingredient-mappings.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const recipesPath = resolve(__dirname, '..', 'src', 'data', 'recipes.js')

// Stats
let stats = {
  totalRecipes: 0,
  ingredientsMapped: 0,
  ingredientsUnmapped: 0,
  stepsMapped: 0,
  stepsUnmapped: 0,
  unmappedIngredients: new Set(),
  unmappedSteps: new Set(),
}

function getQuantity(ingredientStr, lang) {
  const map = INGREDIENT_QUANTITIES[lang]
  // Exact match
  if (map[ingredientStr]) {
    stats.ingredientsMapped++
    return map[ingredientStr]
  }
  // Case-insensitive match
  const lower = ingredientStr.toLowerCase()
  for (const [key, val] of Object.entries(map)) {
    if (key.toLowerCase() === lower) {
      stats.ingredientsMapped++
      return val
    }
  }
  stats.ingredientsUnmapped++
  stats.unmappedIngredients.add(`[${lang}] ${ingredientStr}`)
  return "q.b."
}

function getStepTime(stepStr, lang) {
  const patterns = STEP_TIMINGS[lang]
  for (const { pattern, time } of patterns) {
    if (pattern.test(stepStr)) {
      stats.stepsMapped++
      return time
    }
  }
  stats.stepsUnmapped++
  stats.unmappedSteps.add(`[${lang}] ${stepStr.substring(0, 60)}...`)
  return null
}

// Read file
const content = readFileSync(recipesPath, 'utf8')
const lines = content.split('\n')

// State machine to track where we are in the file
let state = 'normal' // normal | inAllIngredients_it | inAllIngredients_en | inSteps_it | inSteps_en
let bracketDepth = 0
let result = []
let inRecipesArray = false
let pastRecipesArray = false

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  const trimmed = line.trim()

  // Track if we're past the recipes array (in helper functions)
  if (trimmed === '];' && inRecipesArray) {
    inRecipesArray = false
    pastRecipesArray = true
    result.push(line)
    continue
  }

  // Detect start of recipes array
  if (trimmed === 'const recipes = [') {
    inRecipesArray = true
    result.push(line)
    continue
  }

  // Don't transform anything outside recipes array
  if (!inRecipesArray) {
    // Fix getRecipesForUser to handle new object format
    if (pastRecipesArray) {
      // Line that maps ingredients to lowercase strings
      if (trimmed.includes('.map((i) => i.toLowerCase())')) {
        result.push(line.replace(
          /\.map\(\(i\) => i\.toLowerCase\(\)\)/g,
          '.map((i) => (typeof i === "string" ? i : i.name).toLowerCase())'
        ))
        continue
      }
      // Line that passes ingredient to ingredientsMatch
      if (trimmed.includes('ingredientsMatch(fridgeItem, ingredient)')) {
        result.push(line.replace(
          'ingredientsMatch(fridgeItem, ingredient)',
          'ingredientsMatch(fridgeItem, typeof ingredient === "string" ? ingredient : ingredient.name)'
        ))
        continue
      }
    }
    result.push(line)
    continue
  }

  // Count new recipe starts
  if (trimmed === '{' && state === 'normal') {
    // Could be start of a recipe object
  }
  if (trimmed.startsWith('id:')) {
    stats.totalRecipes++
  }

  // Detect state transitions
  if (state === 'normal') {
    if (trimmed === 'allIngredients: {') {
      result.push(line)
      state = 'waitingAllIngLang'
      continue
    }
    if (trimmed === 'steps: {') {
      result.push(line)
      state = 'waitingStepsLang'
      continue
    }
    result.push(line)
    continue
  }

  // Waiting for language key in allIngredients
  if (state === 'waitingAllIngLang') {
    if (trimmed === 'it: [') {
      result.push(line)
      state = 'inAllIngredients_it'
      continue
    }
    if (trimmed === 'en: [') {
      result.push(line)
      state = 'inAllIngredients_en'
      continue
    }
    if (trimmed === '},') {
      result.push(line)
      state = 'normal'
      continue
    }
    result.push(line)
    continue
  }

  // Waiting for language key in steps
  if (state === 'waitingStepsLang') {
    if (trimmed === 'it: [') {
      result.push(line)
      state = 'inSteps_it'
      continue
    }
    if (trimmed === 'en: [') {
      result.push(line)
      state = 'inSteps_en'
      continue
    }
    if (trimmed === '},') {
      result.push(line)
      state = 'normal'
      continue
    }
    result.push(line)
    continue
  }

  // Inside allIngredients.it or allIngredients.en
  if (state === 'inAllIngredients_it' || state === 'inAllIngredients_en') {
    const lang = state === 'inAllIngredients_it' ? 'it' : 'en'

    // Closing bracket - go back to waiting for next lang or closing
    if (trimmed === '],' || trimmed === ']') {
      result.push(line)
      state = 'waitingAllIngLang'
      continue
    }

    // Match a quoted string line like:   "pasta",  or  "petto di pollo",
    const strMatch = trimmed.match(/^"([^"]*)"(,?)$/)
    if (strMatch) {
      const ingredientStr = strMatch[1]
      const comma = strMatch[2]
      const quantity = getQuantity(ingredientStr, lang)
      const indent = line.match(/^(\s*)/)[1]
      result.push(`${indent}{ name: "${ingredientStr}", quantity: "${quantity}" }${comma}`)
      continue
    }

    result.push(line)
    continue
  }

  // Inside steps.it or steps.en
  if (state === 'inSteps_it' || state === 'inSteps_en') {
    const lang = state === 'inSteps_it' ? 'it' : 'en'

    // Closing bracket
    if (trimmed === '],' || trimmed === ']') {
      result.push(line)
      state = 'waitingStepsLang'
      continue
    }

    // Match a quoted string line
    const strMatch = trimmed.match(/^"([^"]*)"(,?)$/)
    if (strMatch) {
      const stepStr = strMatch[1]
      const comma = strMatch[2]
      const time = getStepTime(stepStr, lang)
      const indent = line.match(/^(\s*)/)[1]
      if (time) {
        result.push(`${indent}{ text: "${stepStr}", time: "${time}" }${comma}`)
      } else {
        result.push(`${indent}{ text: "${stepStr}", time: null }${comma}`)
      }
      stats.stepsMapped += time ? 0 : 0 // already counted in getStepTime
      continue
    }

    result.push(line)
    continue
  }
}

// Write back
writeFileSync(recipesPath, result.join('\n'), 'utf8')

// Report
const totalIngredients = stats.ingredientsMapped + stats.ingredientsUnmapped
const totalSteps = stats.stepsMapped + stats.stepsUnmapped
const ingPct = totalIngredients > 0 ? ((stats.ingredientsMapped / totalIngredients) * 100).toFixed(1) : 0
const stepPct = totalSteps > 0 ? ((stats.stepsMapped / totalSteps) * 100).toFixed(1) : 0

console.log('\n\x1b[1m\x1b[32m=== ENRICHMENT COMPLETE ===\x1b[0m\n')
console.log(`Ricette processate: \x1b[1m${stats.totalRecipes}\x1b[0m`)
console.log(`\nIngredienti:`)
console.log(`  Mappati: \x1b[32m${stats.ingredientsMapped}\x1b[0m / ${totalIngredients} (${ingPct}%)`)
console.log(`  Non mappati: \x1b[33m${stats.ingredientsUnmapped}\x1b[0m (usato "q.b.")`)
console.log(`\nStep:`)
console.log(`  Con tempo: \x1b[32m${stats.stepsMapped}\x1b[0m / ${totalSteps} (${stepPct}%)`)
console.log(`  Senza tempo: \x1b[33m${stats.stepsUnmapped}\x1b[0m (usato null)`)

if (stats.unmappedIngredients.size > 0) {
  console.log(`\n\x1b[33mIngredienti non mappati:\x1b[0m`)
  for (const ing of [...stats.unmappedIngredients].sort()) {
    console.log(`  - ${ing}`)
  }
}

if (stats.unmappedSteps.size > 0 && stats.unmappedSteps.size <= 20) {
  console.log(`\n\x1b[33mStep senza tempo (primi 20):\x1b[0m`)
  let count = 0
  for (const step of stats.unmappedSteps) {
    if (count++ >= 20) break
    console.log(`  - ${step}`)
  }
}

console.log(`\n\x1b[2mFile aggiornato: src/data/recipes.js\x1b[0m\n`)
