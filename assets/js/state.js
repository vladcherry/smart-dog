// Хранилище: всё живёт в localStorage, без сервера
const KEY = 'smartdog.v1';

const DEFAULT = {
  dog: null,          // профиль собаки
  weights: [],        // [{date, kg}]
  skills: {},         // прогресс навыков
  log: {},            // { '2026-09-12': { done:{}, skipped:{}, treatsKcal:0 } }
  walks: [],          // завершённые прогулки
  settings: { theme: 'auto' },
  bcsAskedAt: null
};

let data = load();
const subs = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    return Object.assign(structuredClone(DEFAULT), JSON.parse(raw));
  } catch { return structuredClone(DEFAULT); }
}

export function get() { return data; }
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
  subs.forEach(fn => fn(data));
}
export function update(fn) { fn(data); save(); }
export function subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }
export function reset() { data = structuredClone(DEFAULT); save(); }

export function dayLog(date) {
  if (!data.log[date]) data.log[date] = { done:{}, skipped:{}, treatsKcal:0 };
  return data.log[date];
}
export function isDone(date, id) { return !!data.log[date]?.done?.[id]; }
export function toggleDone(date, id) {
  const l = dayLog(date);
  if (l.done[id]) delete l.done[id]; else { l.done[id] = true; delete l.skipped[id]; }
  save();
}
export function lastWeight() { return data.weights.length ? data.weights[data.weights.length - 1] : null; }
export function addWeight(date, kg) {
  data.weights = data.weights.filter(w => w.date !== date);
  data.weights.push({ date, kg });
  data.weights.sort((a, b) => a.date.localeCompare(b.date));
  save();
}
/** Серия дней подряд, где выполнены оба выгула */
export function streakDays(today) {
  let n = 0;
  let d = new Date(today + 'T12:00:00');
  for (let i = 0; i < 400; i++) {
    const iso = d.toISOString().slice(0, 10);
    const l = data.log[iso];
    const ok = l && l.done['walk-am'] && l.done['walk-pm'];
    if (!ok) { if (i === 0) { d.setDate(d.getDate() - 1); continue; } break; }
    n++; d.setDate(d.getDate() - 1);
  }
  return n;
}
