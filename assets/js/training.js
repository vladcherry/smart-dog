// Прогрессия навыков: docs/04-profile-and-algorithms.md §4.5–4.6
import { SKILLS, STAGES, REVIEW_INTERVALS } from './data/skills.js';
import { ageWeeks, todayISO, DAY } from './algo.js';

export const NEW = 0, LEARNING = 1, PRACTICE = 2, MAINTENANCE = 3, MASTERED = 4;
export const MAX_LEARNING = 2;   // одновременно учим не больше двух новых команд
export const MAX_POOL = 5;       // всего в работе: изучаем + отрабатываем

export function skillById(id) { return SKILLS.find(s => s.id === id); }
export function blank() { return { stage:NEW, streak:0, fiveDays:[], ratings:[], lowRun:0, nextReview:null }; }

export function initSkills(known = []) {
  const out = {};
  for (const s of SKILLS) out[s.id] = blank();
  for (const id of known) if (out[id]) { out[id].stage = PRACTICE; out[id].seeded = true; }
  return out;
}

export function activeSkills(skills) {
  return SKILLS.filter(s => { const p = skills[s.id]; return p && (p.stage === LEARNING || p.stage === PRACTICE); });
}

export function learningSkills(skills) {
  return SKILLS.filter(s => skills[s.id]?.stage === LEARNING);
}

function hasFreeSlot(skills) {
  return learningSkills(skills).length < MAX_LEARNING && activeSkills(skills).length < MAX_POOL;
}

export function eligible(skills, weeks) {
  return SKILLS.filter(s => {
    const p = skills[s.id];
    if (!p || p.stage !== NEW) return false;
    if (weeks < s.minWeeks) return false;
    return s.prereq.every(id => (skills[id]?.stage ?? NEW) >= PRACTICE);
  });
}

/** Заполняет свободные слоты следующими навыками очереди. Возвращает id разблокированных. */
export function unlockNext(skills, weeks) {
  const unlocked = [];
  let guard = 0;
  while (hasFreeSlot(skills) && guard++ < 10) {
    const next = eligible(skills, weeks)[0];
    if (!next) break;
    skills[next.id].stage = LEARNING;
    skills[next.id].since = todayISO();
    unlocked.push(next.id);
  }
  return unlocked;
}

/** Навыки на поддержке, у которых подошёл интервал повторения */
export function dueReviews(skills, today = todayISO()) {
  return SKILLS.filter(s => {
    const p = skills[s.id];
    return p && p.stage >= MAINTENANCE && (!p.nextReview || p.nextReview <= today);
  });
}

/**
 * Состав тренировочного блока для прогулки.
 * Утро — новый материал, вечер — закрепление и отвлечения.
 */
export function sessionSkills(skills, slot, today = todayISO()) {
  const act = activeSkills(skills);
  const learning = act.filter(s => skills[s.id].stage === LEARNING);
  const practice = act.filter(s => skills[s.id].stage === PRACTICE);
  const picked = [];
  const order = slot === 'am' ? [...learning, ...practice] : [...practice, ...learning];
  for (const s of order) {
    if (picked.length >= 2) break;
    picked.push(s);
  }
  const due = dueReviews(skills, today)[0];
  if (due && picked.length < 3) picked.push(due);
  return picked.map(s => ({
    skill: s,
    stage: skills[s.id].stage,
    reps: STAGES[skills[s.id].stage].reps,
    review: skills[s.id].stage >= MAINTENANCE
  }));
}

/**
 * Оценка 1–5 после прогулки. Возвращает список событий для экрана результата.
 * Правило пяти пятёрок: 5 оценок «5» подряд, полученных минимум в 3 разных днях.
 */
export function rate(skills, id, rating, weeks, today = todayISO()) {
  const p = skills[id];
  if (!p || p.stage === NEW) return [];   // навык ещё не в работе — оценивать нечего
  const events = [];
  p.ratings.push({ d: today, r: rating });
  if (p.ratings.length > 60) p.ratings.shift();

  if (rating === 5) {
    p.streak += 1;
    if (!p.fiveDays.includes(today)) p.fiveDays.push(today);
    p.lowRun = 0;
  } else if (rating === 4) {
    p.lowRun = 0;                       // прогресс стоит, отката нет
  } else {
    p.streak = 0; p.fiveDays = [];
    p.lowRun = rating <= 2 ? p.lowRun + 1 : 0;
  }

  // Понижение стадии
  if (p.lowRun >= 2 && p.stage > LEARNING) {
    p.stage -= 1; p.streak = 0; p.fiveDays = []; p.lowRun = 0; p.nextReview = null;
    events.push({ type:'remediation', id });
  } else if (p.stage === MASTERED && rating <= 3) {
    p.stage = MAINTENANCE; p.nextReview = today;
    events.push({ type:'demote', id });
  }

  // Повышение стадии
  if (p.streak >= 5 && p.fiveDays.length >= 3 && p.stage < MASTERED) {
    p.stage += 1; p.streak = 0; p.fiveDays = [];
    if (p.stage >= MAINTENANCE) p.nextReview = shiftDays(today, REVIEW_INTERVALS[0]);
    events.push({ type:'stage-up', id, stage:p.stage });
    for (const u of unlockNext(skills, weeks)) events.push({ type:'unlocked', id:u });
  } else if (rating === 5) {
    events.push({ type:'streak', id, n:p.streak });
  }

  // Следующий интервал повторения
  if (p.stage >= MAINTENANCE && rating >= 4) {
    const step = Math.min((p.reviewStep || 0) + (rating === 5 ? 1 : 0), REVIEW_INTERVALS.length - 1);
    p.reviewStep = step;
    p.nextReview = shiftDays(today, REVIEW_INTERVALS[step]);
  }
  return events;
}

export function shiftDays(iso, days) {
  return new Date(new Date(iso + 'T12:00:00').getTime() + days * DAY).toISOString().slice(0, 10);
}

export function stageInfo(stage) { return STAGES[stage]; }

export function progressSummary(skills) {
  const c = { NEW:0, LEARNING:0, PRACTICE:0, MAINTENANCE:0, MASTERED:0 };
  for (const s of SKILLS) c[STAGES[skills[s.id]?.stage ?? 0].id] += 1;
  return c;
}

export function nextUnlockHint(skills, weeks) {
  const next = eligible(skills, weeks)[0];
  if (next) return { skill:next, reason:'ready' };
  const waiting = SKILLS.find(s => (skills[s.id]?.stage ?? NEW) === NEW && weeks < s.minWeeks);
  if (waiting) return { skill:waiting, reason:'age', weeks:waiting.minWeeks };
  const blocked = SKILLS.find(s => (skills[s.id]?.stage ?? NEW) === NEW);
  return blocked ? { skill:blocked, reason:'prereq' } : null;
}
