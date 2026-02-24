// Ingredient matching utilities for fuzzy fridge↔recipe matching

// Synonyms: specific → generic key used in recipes
// Maps Italian/colloquial names to the canonical recipe ingredient keys
export const SYNONYMS = {
  // Proteins
  'tonno in scatola': 'tuna',
  'tonno sott\'olio': 'tuna',
  'tonno al naturale': 'tuna',
  'scatoletta di tonno': 'tuna',
  'petto di pollo': 'chicken',
  'coscia di pollo': 'chicken',
  'pollo': 'chicken',
  'fesa di tacchino': 'chicken',
  'tacchino': 'chicken',
  'macinato': 'beef',
  'manzo macinato': 'beef',
  'vitello': 'beef',
  'bistecca': 'beef',
  'carne macinata': 'beef',
  'polpette': 'beef',
  'salmone affumicato': 'salmon',
  'filetto di salmone': 'salmon',
  'mozzarella': 'cheese',
  'parmigiano': 'cheese',
  'grana': 'cheese',
  'pecorino': 'cheese',
  'ricotta': 'cheese',
  'scamorza': 'cheese',
  'provola': 'cheese',
  'gorgonzola': 'cheese',
  'fontina': 'cheese',
  'stracchino': 'cheese',
  'crescenza': 'cheese',
  'formaggio': 'cheese',
  'feta': 'cheese',
  'uova': 'eggs',
  'uovo': 'eggs',
  'ceci': 'legumes',
  'lenticchie': 'legumes',
  'fagioli': 'legumes',
  'fagioli borlotti': 'legumes',
  'fagioli cannellini': 'legumes',
  'fagioli neri': 'legumes',
  'fave': 'legumes',
  'piselli': 'legumes',
  'edamame': 'legumes',
  'chickpeas': 'legumes',
  'lentils': 'legumes',
  'beans': 'legumes',
  'black beans': 'legumes',
  'kidney beans': 'legumes',
  'white beans': 'legumes',
  'gamberi': 'shrimp',
  'gamberetti': 'shrimp',
  'gamberoni': 'shrimp',
  'prosciutto cotto': 'ham',
  'prosciutto crudo': 'ham',
  'prosciutto': 'ham',
  'pancetta': 'ham',
  'speck': 'ham',

  // Bases
  'spaghetti': 'pasta',
  'penne': 'pasta',
  'fusilli': 'pasta',
  'rigatoni': 'pasta',
  'farfalle': 'pasta',
  'linguine': 'pasta',
  'tagliatelle': 'pasta',
  'orecchiette': 'pasta',
  'maccheroni': 'pasta',
  'riso basmati': 'rice',
  'riso integrale': 'rice',
  'riso arborio': 'rice',
  'riso carnaroli': 'rice',
  'pane integrale': 'bread',
  'pane di segale': 'bread',
  'piadina': 'bread',
  'tortilla': 'bread',
  'wrap': 'bread',
  'patate dolci': 'potatoes',

  // Vegetables
  'pomodori': 'tomatoes',
  'pomodoro': 'tomatoes',
  'pomodorini': 'tomatoes',
  'pomodori secchi': 'tomatoes',
  'passata di pomodoro': 'tomatoes',
  'pelati': 'tomatoes',
  'salsa di pomodoro': 'tomatoes',
  'zucchine': 'zucchini',
  'zucchina': 'zucchini',
  'spinaci': 'spinach',
  'peperoni': 'peppers',
  'peperone': 'peppers',
  'peperoni rossi': 'peppers',
  'peperoni verdi': 'peppers',
  'carote': 'carrots',
  'carota': 'carrots',
  'cipolla': 'onions',
  'cipolle': 'onions',
  'cipollotto': 'onions',
  'scalogno': 'onions',
  'lattuga': 'lettuce',
  'insalata': 'lettuce',
  'rucola': 'lettuce',
  'radicchio': 'lettuce',
  'cavolo': 'broccoli',
  'cavolfiore': 'broccoli',
  'broccoletti': 'broccoli',
  'melanzane': 'eggplant',
  'melanzana': 'eggplant',
  'funghi': 'mushrooms',
  'champignon': 'mushrooms',
  'avocado': 'avocado',
  'patata': 'potatoes',
  'patate': 'potatoes',
  'broccolo': 'broccoli',
  'peperone rosso': 'peppers',
  'peperone giallo': 'peppers',
  'peperone verde': 'peppers',
  'peperoni rossi': 'peppers',
  'cipolla rossa': 'onions',
  'cipolla bianca': 'onions',
  'cipolla dorata': 'onions',
  'aglio': 'garlic',
  'sedano': 'celery',
  'piselli': 'peas',

  // Spices
  'basilico': 'basil',
  'prezzemolo': 'parsley',
  'rosmarino': 'rosemary',
  'origano': 'oregano',
  'cumino': 'cumin',
  'zenzero': 'ginger',
  'menta': 'mint',
  'timo': 'thyme',
  'salsa di soia': 'soy_sauce',
  'limone': 'lemon',
  'olio di sesamo': 'sesame_oil',
  'peperoncino': 'chili',
}

// Words to strip when normalizing ingredient text for matching
export const QUALIFIER_WORDS = [
  'in scatola', 'sott\'olio', 'sott\'aceto', 'al naturale',
  'fresco', 'fresca', 'freschi', 'fresche',
  'surgelato', 'surgelata', 'surgelati', 'surgelate',
  'secco', 'secca', 'secchi', 'secche',
  'biologico', 'biologica', 'bio',
  'integrale', 'integrali',
  'affumicato', 'affumicata',
  'macinato', 'macinata',
  'tritato', 'tritata', 'tritati',
  'grattugiato', 'grattugiata',
  'a cubetti', 'a fette', 'a rondelle', 'a listarelle', 'a pezzetti',
  'canned', 'frozen', 'fresh', 'dried', 'organic', 'smoked',
  'diced', 'sliced', 'chopped', 'grated', 'minced',
  'di', 'del', 'della', 'delle', 'dei', 'degli',
]

/**
 * Normalize an ingredient text by removing quantities, units, and qualifiers
 */
export function normalizeIngredient(text) {
  let normalized = text.toLowerCase().trim()
  // Remove quantities: numbers, fractions, decimals
  normalized = normalized.replace(/[\d½¼¾⅓⅔.,]+\s*/g, '')
  // Remove units of measurement (IT + EN)
  normalized = normalized.replace(/\b(g|gr|kg|ml|l|cl|dl|cucchiai[oa]?|cucchiaino|cucchiaini|tazzina|tazza|fett[ae]|spicchi[o]?|pizzico|q\.?\s?b\.?|tbsp|tsp|cups?|oz|lb|pieces?|slices?|cloves?|pinch|handful)\b/gi, '')
  // Remove qualifier words (longest first to avoid partial removal)
  const sorted = [...QUALIFIER_WORDS].sort((a, b) => b.length - a.length)
  for (const q of sorted) {
    normalized = normalized.replace(new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'), '')
  }
  return normalized.replace(/\s+/g, ' ').trim()
}

/**
 * Check if a fridge item matches a key ingredient (base/vegetable/protein)
 * Uses synonym lookup + substring matching
 */
export function matchesKeyIngredient(fridgeItem, keyIngredient) {
  const fi = fridgeItem.toLowerCase().trim()
  const key = keyIngredient.toLowerCase().trim()

  // Direct match
  if (fi === key) return true
  if (fi.includes(key) || key.includes(fi)) return true

  // Normalize fridge item and check
  const normalizedFi = normalizeIngredient(fi)
  if (normalizedFi === key || normalizedFi.includes(key) || key.includes(normalizedFi)) return true

  // Check synonyms: does the fridge item map to the same canonical key?
  const fiSynonym = SYNONYMS[fi] || SYNONYMS[normalizedFi]
  if (fiSynonym && fiSynonym === key) return true

  // Check if any synonym of the fridge item substring-matches
  for (const [term, canonical] of Object.entries(SYNONYMS)) {
    if (canonical === key && (fi.includes(term) || term.includes(fi) || normalizedFi.includes(term) || term.includes(normalizedFi))) {
      return true
    }
  }

  return false
}

/**
 * Check if a fridge item matches an ingredient text from a recipe
 * Bidirectional fuzzy matching with synonyms
 */
export function ingredientsMatch(fridgeItem, recipeIngredientText) {
  const fi = fridgeItem.toLowerCase().trim()
  const ri = recipeIngredientText.toLowerCase().trim()

  // Direct substring match
  if (fi.includes(ri) || ri.includes(fi)) return true

  // Normalize both
  const normalizedFi = normalizeIngredient(fi)
  const normalizedRi = normalizeIngredient(ri)
  if (normalizedFi && normalizedRi && (normalizedFi.includes(normalizedRi) || normalizedRi.includes(normalizedFi))) return true

  // Synonym-based: resolve both to canonical keys and compare
  const fiCanonical = SYNONYMS[fi] || SYNONYMS[normalizedFi] || fi
  const riCanonical = SYNONYMS[ri] || SYNONYMS[normalizedRi] || ri

  if (fiCanonical === riCanonical) return true

  // Check if fridge item's canonical matches inside recipe text or vice versa
  if (ri.includes(fiCanonical) || fiCanonical.includes(normalizedRi)) return true
  if (fi.includes(riCanonical) || riCanonical.includes(normalizedFi)) return true

  // Word-level synonym matching: split both into words, resolve each via SYNONYMS
  const fiWords = normalizedFi.split(/\s+/).filter(w => w.length > 2)
  const riWords = normalizedRi.split(/\s+/).filter(w => w.length > 2)
  for (const fw of fiWords) {
    const fwCanonical = SYNONYMS[fw] || fw
    for (const rw of riWords) {
      const rwCanonical = SYNONYMS[rw] || rw
      if (fwCanonical === rwCanonical && fwCanonical.length > 2) return true
    }
  }

  return false
}
