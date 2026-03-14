const STORAGE_KEY = 'math-trainer-data';

const defaultData = {
  selectedNumbers: [2, 3, 4, 5],
  exercises: {},
  sessions: [],
};

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultData, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load data from localStorage:', e);
  }
  return { ...defaultData };
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data to localStorage:', e);
  }
}

export function getExerciseKey(a, b) {
  return `${Math.min(a, b)}x${Math.max(a, b)}`;
}

export function getExerciseData(data, a, b) {
  const key = getExerciseKey(a, b);
  return data.exercises[key] || createExercise(a, b);
}

export function createExercise(a, b) {
  return {
    a: Math.min(a, b),
    b: Math.max(a, b),
    box: 1,
    correctCount: 0,
    wrongCount: 0,
    streak: 0,
    lastSeen: null,
  };
}

export function updateExercise(data, a, b, correct) {
  const key = getExerciseKey(a, b);
  const existing = data.exercises[key] || createExercise(a, b);

  const updated = { ...existing, lastSeen: Date.now() };

  if (correct) {
    updated.correctCount += 1;
    updated.streak += 1;
    updated.box = Math.min(5, updated.box + 1);
  } else {
    updated.wrongCount += 1;
    updated.streak = 0;
    updated.box = 1;
  }

  return {
    ...data,
    exercises: {
      ...data.exercises,
      [key]: updated,
    },
  };
}

export function addSession(data, session) {
  return {
    ...data,
    sessions: [...data.sessions, session],
  };
}

export function saveSelectedNumbers(data, numbers) {
  return {
    ...data,
    selectedNumbers: numbers,
  };
}

export function resetStats() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to reset stats:', e);
  }
}
