// Utility per gestire sia il formato vecchio (stringhe) che nuovo (oggetti) delle ricette

export function getIngredientName(ingredient) {
  return typeof ingredient === 'string' ? ingredient : ingredient.name
}

export function getIngredientQuantity(ingredient) {
  return typeof ingredient === 'string' ? null : (ingredient.quantity || null)
}

export function getStepText(step) {
  return typeof step === 'string' ? step : step.text
}

export function getStepTime(step) {
  return typeof step === 'string' ? null : (step.time || null)
}
