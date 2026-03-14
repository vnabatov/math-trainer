const STORAGE_KEY = 'math-trainer-data';

const defaultData = {
  selectedOperation: 'multiply',
  selections: {
    multiply: [2, 3, 4, 5],
    add: [1, 2, 3, 4, 5],
    subtract: [1, 2, 3, 4, 5],
  },
  // Keep legacy field for backward compat
  selectedNumbers: [2, 3, 4, 5],
  exercises: {},
  sessions: [],
};

export const OPERATIONS = {
  multiply: { label: 'Multiplication', symbol: '×', numbers: [2, 3, 4, 5, 6, 7, 8, 9] },
  add: { label: 'Addition', symbol: '+', numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  subtract: { label: 'Subtraction', symbol: '−', numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
};

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const merged = { ...defaultData, ...parsed };
      // Migrate old format: if no selections object, create from selectedNumbers
      if (!parsed.selections) {
        merged.selections = {
          multiply: parsed.selectedNumbers || defaultData.selections.multiply,
          add: defaultData.selections.add,
          subtract: defaultData.selections.subtract,
        };
      }
      if (!parsed.selectedOperation) {
        merged.selectedOperation = 'multiply';
      }
      return merged;
    }
  } catch (e) {
    console.error('Failed to load data from localStorage:', e);
  }
  return { ...defaultData, selections: { ...defaultData.selections } };
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data to localStorage:', e);
  }
}

export function getExerciseKey(a, b, op = 'multiply') {
  if (op === 'multiply') {
    return `mul:${Math.min(a, b)}x${Math.max(a, b)}`;
  }
  if (op === 'add') {
    return `add:${Math.min(a, b)}+${Math.max(a, b)}`;
  }
  // subtract: NOT symmetric
  return `sub:${a}-${b}`;
}

export function getExerciseData(data, a, b, op = 'multiply') {
  const key = getExerciseKey(a, b, op);
  return data.exercises[key] || createExercise(a, b, op);
}

export function createExercise(a, b, op = 'multiply') {
  return {
    a,
    b,
    op,
    box: 1,
    correctCount: 0,
    wrongCount: 0,
    streak: 0,
    lastSeen: null,
  };
}

export function getAnswer(exercise) {
  const { a, b, op } = exercise;
  if (op === 'add') return a + b;
  if (op === 'subtract') return a - b;
  return a * b; // multiply
}

export function getSymbol(op) {
  return OPERATIONS[op]?.symbol || '×';
}

export function updateExercise(data, a, b, correct, op = 'multiply') {
  const key = getExerciseKey(a, b, op);
  const existing = data.exercises[key] || createExercise(a, b, op);

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

export function saveSelections(data, operation, numbers) {
  return {
    ...data,
    selectedOperation: operation,
    selections: {
      ...data.selections,
      [operation]: numbers,
    },
    // Keep legacy field in sync
    selectedNumbers: operation === 'multiply' ? numbers : data.selectedNumbers,
  };
}

export function resetStats() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to reset stats:', e);
  }
}
