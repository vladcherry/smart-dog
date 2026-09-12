// Структура годового плана. Темы недель и цели — в словарях assets/js/i18n/<язык>.js
export const PHASES = [
    {
      "id": 1,
      "from": 1,
      "to": 9
    },
    {
      "id": 2,
      "from": 10,
      "to": 18
    },
    {
      "id": 3,
      "from": 19,
      "to": 31
    },
    {
      "id": 4,
      "from": 32,
      "to": 43
    },
    {
      "id": 5,
      "from": 44,
      "to": 52
    }
  ];

// n — неделя плана, age — возраст в неделях, new — навыки, которые открываются
export const WEEKS = [
    {
      "n": 1,
      "age": 8,
      "new": [
        "name",
        "place"
      ]
    },
    {
      "n": 2,
      "age": 9,
      "new": [
        "sit"
      ]
    },
    {
      "n": 3,
      "age": 10,
      "new": [
        "target"
      ]
    },
    {
      "n": 4,
      "age": 11,
      "new": [
        "down"
      ]
    },
    {
      "n": 5,
      "age": 12,
      "new": [
        "come"
      ]
    },
    {
      "n": 6,
      "age": 13,
      "new": [
        "handling"
      ]
    },
    {
      "n": 7,
      "age": 14,
      "new": [
        "wait"
      ]
    },
    {
      "n": 8,
      "age": 15,
      "new": [
        "leaveit",
        "give"
      ]
    },
    {
      "n": 9,
      "age": 16,
      "new": []
    },
    {
      "n": 10,
      "age": 17,
      "new": [
        "loose"
      ]
    },
    {
      "n": 11,
      "age": 18,
      "new": [
        "comedist"
      ]
    },
    {
      "n": 12,
      "age": 19,
      "new": []
    },
    {
      "n": 13,
      "age": 20,
      "new": [
        "fetch"
      ]
    },
    {
      "n": 14,
      "age": 21,
      "new": []
    },
    {
      "n": 15,
      "age": 22,
      "new": [
        "placedist"
      ]
    },
    {
      "n": 16,
      "age": 23,
      "new": [
        "door"
      ]
    },
    {
      "n": 17,
      "age": 24,
      "new": [
        "stand"
      ]
    },
    {
      "n": 18,
      "age": 25,
      "new": []
    },
    {
      "n": 19,
      "age": 26,
      "new": []
    },
    {
      "n": 20,
      "age": 27,
      "new": [
        "emergency"
      ]
    },
    {
      "n": 21,
      "age": 28,
      "new": [
        "turn"
      ]
    },
    {
      "n": 22,
      "age": 29,
      "new": [
        "search"
      ]
    },
    {
      "n": 23,
      "age": 30,
      "new": [
        "settle"
      ]
    },
    {
      "n": 24,
      "age": 31,
      "new": []
    },
    {
      "n": 25,
      "age": 32,
      "new": []
    },
    {
      "n": 26,
      "age": 33,
      "new": []
    },
    {
      "n": 27,
      "age": 34,
      "new": [
        "lookat"
      ]
    },
    {
      "n": 28,
      "age": 35,
      "new": []
    },
    {
      "n": 29,
      "age": 36,
      "new": []
    },
    {
      "n": 30,
      "age": 37,
      "new": []
    },
    {
      "n": 31,
      "age": 38,
      "new": []
    },
    {
      "n": 32,
      "age": 39,
      "new": [
        "downdist"
      ]
    },
    {
      "n": 33,
      "age": 40,
      "new": []
    },
    {
      "n": 34,
      "age": 41,
      "new": []
    },
    {
      "n": 35,
      "age": 42,
      "new": [
        "tricks"
      ]
    },
    {
      "n": 36,
      "age": 43,
      "new": []
    },
    {
      "n": 37,
      "age": 44,
      "new": []
    },
    {
      "n": 38,
      "age": 45,
      "new": []
    },
    {
      "n": 39,
      "age": 46,
      "new": [
        "bell"
      ]
    },
    {
      "n": 40,
      "age": 47,
      "new": []
    },
    {
      "n": 41,
      "age": 48,
      "new": []
    },
    {
      "n": 42,
      "age": 49,
      "new": []
    },
    {
      "n": 43,
      "age": 50,
      "new": []
    },
    {
      "n": 44,
      "age": 51,
      "new": []
    },
    {
      "n": 45,
      "age": 52,
      "new": []
    },
    {
      "n": 46,
      "age": 53,
      "new": []
    },
    {
      "n": 47,
      "age": 54,
      "new": []
    },
    {
      "n": 48,
      "age": 55,
      "new": []
    },
    {
      "n": 49,
      "age": 56,
      "new": []
    },
    {
      "n": 50,
      "age": 57,
      "new": []
    },
    {
      "n": 51,
      "age": 58,
      "new": []
    },
    {
      "n": 52,
      "age": 59,
      "new": []
    }
  ];

export function phaseOf(weekNo) {
  return PHASES.find(p => weekNo >= p.from && weekNo <= p.to) || PHASES[PHASES.length - 1];
}

/** Программа рассчитана с 8 недель (появление дома) до 59 недель (~14 месяцев) */
export const PLAN_START_WEEKS = 8, PLAN_END_WEEKS = 59;
export function planFinished(ageWeeks) { return ageWeeks > PLAN_END_WEEKS; }

export function weekByAge(ageWeeks) {
  if (ageWeeks <= 8) return WEEKS[0];
  const w = WEEKS.find(x => x.age === Math.round(ageWeeks));
  return w || (ageWeeks > 59 ? WEEKS[51] : WEEKS[Math.max(0, Math.round(ageWeeks) - 8)]);
}
