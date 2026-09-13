// Прогулка, которая идёт прямо сейчас.
// Живёт в хранилище, а не в памяти экрана: выход назад, переход на другую вкладку
// и даже перезагрузка страницы не должны останавливать таймер и терять счётчики.
import * as store from './state.js';
import { todayISO } from './algo.js';

export const KCAL_PER_TREAT = 3;

export function get() {
  const w = store.get().activeWalk;
  return w && w.date === todayISO() ? w : null;   // вчерашняя недоведённая прогулка не всплывает
}

export function start(slot) {
  store.update(s => {
    s.activeWalk = {
      date: todayISO(), slot,
      startedAt: Date.now(),   // момент последнего запуска
      accumulated: 0,          // намотано до текущего запуска
      adjust: 0,               // ручная правка времени кнопками ± 
      running: true, finished: false,
      reps: {}, marks: { pee:0, poo:0, dog:0, fear:0 }, clicks: 0
    };
  });
  return get();
}

/** Сколько времени прогулки прошло, с учётом пауз и ручной правки */
export function elapsedMs(w = get()) {
  if (!w) return 0;
  const live = w.running && w.startedAt ? Date.now() - w.startedAt : 0;
  return Math.max(0, w.accumulated + live + (w.adjust || 0));
}
export function elapsedMin(w = get()) { return Math.round(elapsedMs(w) / 60000); }

export function toggle() {
  store.update(s => {
    const w = s.activeWalk;
    if (!w || w.finished) return;
    if (w.running) { w.accumulated += Date.now() - w.startedAt; w.startedAt = null; w.running = false; }
    else { w.startedAt = Date.now(); w.running = true; }
  });
  return get();
}

/** Правка реального времени кнопками ± */
export function shiftMinutes(delta) {
  store.update(s => {
    const w = s.activeWalk;
    if (!w) return;
    const before = elapsedMs(w);
    const wanted = before + delta * 60000;
    w.adjust = (w.adjust || 0) + (Math.max(0, wanted) - before);
  });
  return get();
}

export function addRep(skillId, max) {
  store.update(s => {
    const w = s.activeWalk;
    if (!w) return;
    w.reps[skillId] = Math.min(max, (w.reps[skillId] || 0) + 1);
  });
  return get();
}
export function removeRep(skillId) {
  store.update(s => {
    const w = s.activeWalk;
    if (!w) return;
    w.reps[skillId] = Math.max(0, (w.reps[skillId] || 0) - 1);
  });
  return get();
}
export function repsOf(skillId) { return get()?.reps[skillId] || 0; }
export function totalReps(w = get()) {
  return w ? Object.values(w.reps).reduce((a, b) => a + b, 0) : 0;
}

export function addMark(kind) {
  store.update(s => { const w = s.activeWalk; if (w) w.marks[kind] = (w.marks[kind] || 0) + 1; });
  return get();
}
export function addClick() {
  store.update(s => { const w = s.activeWalk; if (w) w.clicks = (w.clicks || 0) + 1; });
  return get();
}

/** Останавливаем таймер, но прогулку не закрываем: время ещё можно поправить */
export function stop() {
  store.update(s => {
    const w = s.activeWalk;
    if (!w || w.finished) return;
    if (w.running) { w.accumulated += Date.now() - w.startedAt; w.startedAt = null; w.running = false; }
    w.finished = true;
  });
  return get();
}

/** Передумали заканчивать: снимаем стоп и снова считаем время */
export function resume() {
  store.update(s => {
    const w = s.activeWalk;
    if (!w) return;
    w.finished = false; w.running = true; w.startedAt = Date.now();
  });
  return get();
}

/** Записываем прогулку в историю дня и убираем активную сессию */
export function commit() {
  const w = get();
  if (!w) return null;
  const minutes = elapsedMin(w);
  const treats = totalReps(w) * KCAL_PER_TREAT;
  store.update(s => {
    const log = store.dayLog(w.date);
    log.done['walk-' + w.slot] = true;
    log.treatsKcal = (log.treatsKcal || 0) + treats;
    s.walks.push({ date: w.date, slot: w.slot, minutes, marks: { ...w.marks },
                   clicks: w.clicks, reps: { ...w.reps } });
    if (s.walks.length > 200) s.walks.shift();
    s.activeWalk = null;
  });
  return { ...w, minutes };
}

export function cancel() { store.update(s => { s.activeWalk = null; }); }

/** Системное уведомление о завершении прогулки */
export async function askNotifyPermission() {
  try {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    return (await Notification.requestPermission()) === 'granted';
  } catch { return false; }
}

export function notifyFinished(title, body) {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return false;
    new Notification(title, { body, icon: 'assets/icons/icon-192.png', tag: 'walk-finished' });
    if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
    return true;
  } catch { return false; }
}

export function formatTimer(ms) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}
