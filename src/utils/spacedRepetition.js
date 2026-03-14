import { getExerciseKey, getExerciseData } from './storage';

/**
 * Generate all exercise pairs from selected numbers for a given operation.
 *
 * - multiply: a × b, a ∈ selected (2-9), b ∈ 2-9
 * - add:      a + b, a ∈ selected (1-9), b ∈ 1-9
 * - subtract: (s+b) − s = b, for s ∈ selected (1-9), b ∈ 1-9
 *             stored as { a: s+b, b: s, op: 'subtract' }
 */
export function generateExercises(selectedNumbers, operation = 'multiply') {
  const exercises = [];

  if (operation === 'multiply') {
    for (const a of selectedNumbers) {
      for (let b = 2; b <= 9; b++) {
        exercises.push({ a, b, op: 'multiply' });
      }
    }
  } else if (operation === 'add') {
    for (const a of selectedNumbers) {
      for (let b = 1; b <= 9; b++) {
        exercises.push({ a, b, op: 'add' });
      }
    }
  } else if (operation === 'subtract') {
    // For each selected number s, practice subtracting s from (s+1) to (s+9)
    for (const s of selectedNumbers) {
      for (let b = 1; b <= 9; b++) {
        exercises.push({ a: s + b, b: s, op: 'subtract' });
      }
    }
  }

  return exercises;
}

/**
 * Leitner-based weight: lower box = higher probability of selection.
 * Box 1: weight 16  (most frequent — struggling)
 * Box 2: weight 8
 * Box 3: weight 4
 * Box 4: weight 2
 * Box 5: weight 1  (least frequent — mastered)
 * 
 * Also boost exercises never seen before.
 */
function getWeight(exerciseData) {
  const boxWeights = { 1: 16, 2: 8, 3: 4, 4: 2, 5: 1 };
  let weight = boxWeights[exerciseData.box] || 16;

  // Boost if never seen
  if (!exerciseData.lastSeen) {
    weight *= 2;
  }

  // Slight recency penalty: recently seen ones are slightly less likely
  if (exerciseData.lastSeen) {
    const minutesAgo = (Date.now() - exerciseData.lastSeen) / 60000;
    if (minutesAgo < 1) {
      weight *= 0.3;
    } else if (minutesAgo < 5) {
      weight *= 0.6;
    }
  }

  return weight;
}

/**
 * Select next exercise using weighted random based on spaced repetition boxes.
 * Avoids repeating the last exercise shown.
 */
export function selectNextExercise(exercises, data, lastExercise = null) {
  if (exercises.length === 0) return null;

  let candidates = exercises;

  // Avoid immediate repetition
  if (lastExercise && exercises.length > 1) {
    const lastKey = getExerciseKey(lastExercise.a, lastExercise.b, lastExercise.op);
    candidates = exercises.filter(
      (e) => getExerciseKey(e.a, e.b, e.op) !== lastKey
    );
  }

  const weighted = candidates.map((ex) => {
    const exData = getExerciseData(data, ex.a, ex.b, ex.op);
    return { exercise: ex, weight: getWeight(exData) };
  });

  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of weighted) {
    random -= item.weight;
    if (random <= 0) {
      return item.exercise;
    }
  }

  return weighted[weighted.length - 1].exercise;
}

/**
 * Get mastery level for an exercise (0-100%).
 */
export function getMasteryLevel(exerciseData) {
  if (!exerciseData.lastSeen) return 0;
  // Mastery based on box level (20% per box)
  return (exerciseData.box / 5) * 100;
}

/**
 * Get overall mastery for selected exercises.
 */
export function getOverallMastery(exercises, data) {
  if (exercises.length === 0) return 0;

  // Deduplicate by key
  const seen = new Set();
  const unique = [];
  for (const ex of exercises) {
    const key = getExerciseKey(ex.a, ex.b, ex.op);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(ex);
    }
  }

  const total = unique.reduce((sum, ex) => {
    const exData = getExerciseData(data, ex.a, ex.b, ex.op);
    return sum + getMasteryLevel(exData);
  }, 0);

  return total / unique.length;
}

/**
 * Get a star rating 0-3 based on mastery.
 */
export function getStarRating(mastery) {
  if (mastery >= 90) return 3;
  if (mastery >= 60) return 2;
  if (mastery >= 30) return 1;
  return 0;
}
