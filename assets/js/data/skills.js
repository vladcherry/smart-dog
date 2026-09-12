// Структура навыков. Весь текст — в словарях assets/js/i18n/<язык>.js
export const SKILLS = [
    {
      "id": "name",
      "minWeeks": 8,
      "prereq": [],
      "article": "a1"
    },
    {
      "id": "place",
      "minWeeks": 8,
      "prereq": [],
      "article": "a4"
    },
    {
      "id": "sit",
      "minWeeks": 9,
      "prereq": [
        "name"
      ],
      "article": "a2"
    },
    {
      "id": "target",
      "minWeeks": 10,
      "prereq": [
        "name"
      ],
      "article": "a2"
    },
    {
      "id": "down",
      "minWeeks": 11,
      "prereq": [
        "sit"
      ],
      "article": "a2"
    },
    {
      "id": "come",
      "minWeeks": 12,
      "prereq": [
        "name",
        "target"
      ],
      "article": "a3"
    },
    {
      "id": "handling",
      "minWeeks": 13,
      "prereq": [],
      "article": "a8"
    },
    {
      "id": "wait",
      "minWeeks": 14,
      "prereq": [
        "sit"
      ],
      "article": "a2"
    },
    {
      "id": "leaveit",
      "minWeeks": 15,
      "prereq": [
        "wait"
      ],
      "article": "a5"
    },
    {
      "id": "give",
      "minWeeks": 15,
      "prereq": [
        "leaveit"
      ],
      "article": "a5"
    },
    {
      "id": "loose",
      "minWeeks": 17,
      "prereq": [
        "name",
        "target"
      ],
      "article": "a6"
    },
    {
      "id": "comedist",
      "minWeeks": 18,
      "prereq": [
        "come"
      ],
      "article": "a3"
    },
    {
      "id": "placedist",
      "minWeeks": 22,
      "prereq": [
        "place",
        "wait"
      ],
      "article": "a4"
    },
    {
      "id": "door",
      "minWeeks": 23,
      "prereq": [
        "wait"
      ],
      "article": "a5"
    },
    {
      "id": "stand",
      "minWeeks": 24,
      "prereq": [
        "wait"
      ],
      "article": "a2"
    },
    {
      "id": "fetch",
      "minWeeks": 20,
      "prereq": [
        "give"
      ],
      "article": "a5"
    },
    {
      "id": "emergency",
      "minWeeks": 27,
      "prereq": [
        "comedist"
      ],
      "article": "a3"
    },
    {
      "id": "turn",
      "minWeeks": 28,
      "prereq": [
        "loose"
      ],
      "article": "a10"
    },
    {
      "id": "search",
      "minWeeks": 29,
      "prereq": [],
      "article": "a10"
    },
    {
      "id": "settle",
      "minWeeks": 30,
      "prereq": [
        "down",
        "wait"
      ],
      "article": "a4"
    },
    {
      "id": "lookat",
      "minWeeks": 34,
      "prereq": [
        "name"
      ],
      "article": "a10"
    },
    {
      "id": "downdist",
      "minWeeks": 39,
      "prereq": [
        "down"
      ],
      "article": "a2"
    },
    {
      "id": "tricks",
      "minWeeks": 42,
      "prereq": [
        "target"
      ],
      "article": "a2"
    },
    {
      "id": "bell",
      "minWeeks": 46,
      "prereq": [
        "placedist"
      ],
      "article": "a4"
    }
  ];

// Стадии: сколько повторов за сессию и как часто. Подписи берутся из словаря.
export const STAGES = [
    {
      "id": "NEW",
      "reps": 0,
      "color": "var(--stone-400)"
    },
    {
      "id": "LEARNING",
      "reps": 8,
      "color": "var(--train)"
    },
    {
      "id": "PRACTICE",
      "reps": 5,
      "color": "var(--moss-500)"
    },
    {
      "id": "MAINTENANCE",
      "reps": 3,
      "color": "var(--moss-600)"
    },
    {
      "id": "MASTERED",
      "reps": 2,
      "color": "var(--gold)"
    }
  ];

export const RATINGS = [
    {
      "v": 1,
      "color": "#B9B2A6"
    },
    {
      "v": 2,
      "color": "#E0B884"
    },
    {
      "v": 3,
      "color": "#F2C15A"
    },
    {
      "v": 4,
      "color": "#F2921B"
    },
    {
      "v": 5,
      "color": "#4C8B59"
    }
  ];

// Интервалы повторения для стадии MASTERED (дни)
export const REVIEW_INTERVALS = [1,3,7,14,30];
