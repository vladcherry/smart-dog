// Структура учебника. Тексты статей — в словарях assets/js/i18n/<язык>.js
export const CATEGORY_IDS = ["base","life","behav"];

export const ARTICLES = [
    {
      "id": "a1",
      "icon": "👀",
      "cat": "base",
      "phase": 1,
      "min": 5,
      "skills": [
        "name"
      ]
    },
    {
      "id": "a2",
      "icon": "🪑",
      "cat": "base",
      "phase": 1,
      "min": 6,
      "skills": [
        "sit",
        "down",
        "wait",
        "stand",
        "downdist",
        "tricks",
        "target"
      ]
    },
    {
      "id": "a3",
      "icon": "🏃",
      "cat": "base",
      "phase": 1,
      "min": 8,
      "skills": [
        "come",
        "comedist",
        "emergency"
      ]
    },
    {
      "id": "a4",
      "icon": "🛏️",
      "cat": "base",
      "phase": 1,
      "min": 5,
      "skills": [
        "place",
        "placedist",
        "settle",
        "bell"
      ]
    },
    {
      "id": "a5",
      "icon": "🚫",
      "cat": "base",
      "phase": 2,
      "min": 6,
      "skills": [
        "leaveit",
        "give",
        "fetch",
        "door"
      ]
    },
    {
      "id": "a6",
      "icon": "🦮",
      "cat": "base",
      "phase": 2,
      "min": 7,
      "skills": [
        "loose",
        "turn"
      ]
    },
    {
      "id": "a7",
      "icon": "🏠",
      "cat": "life",
      "phase": 1,
      "min": 6,
      "skills": []
    },
    {
      "id": "a8",
      "icon": "🚪",
      "cat": "life",
      "phase": 2,
      "min": 6,
      "skills": [
        "handling"
      ]
    },
    {
      "id": "a9",
      "icon": "⚖️",
      "cat": "life",
      "phase": 1,
      "min": 7,
      "skills": []
    },
    {
      "id": "a10",
      "icon": "🌪️",
      "cat": "behav",
      "phase": 3,
      "min": 6,
      "skills": [
        "lookat",
        "turn",
        "search",
        "emergency"
      ]
    }
  ];

export function articleById(id) { return ARTICLES.find(a => a.id === id); }
export function articlesForSkill(skillId) { return ARTICLES.filter(a => a.skills.includes(skillId)); }
