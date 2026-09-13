// Общий интерфейс идущей прогулки: одинаково работает на экране прогулки
// и в большой карточке на «Сегодня». Всё состояние живёт в walksession.js,
// поэтому выход назад, переключение вкладки и перезагрузка ничего не прерывают.
import * as store from './state.js';
import * as ws from './walksession.js';
import { esc, sheet, closeSheet, toast } from './ui.js';
import { t, tn } from './i18n/index.js';
import { skillName, skillCriterion, stageInfoText, ratingLabel } from './i18n/content.js';
import { RATINGS } from './data/skills.js';
import { rate } from './training.js';
import { ageWeeks } from './algo.js';
import { rerender } from './render.js';

export function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = 2200; o.type = 'square';
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.06);
    setTimeout(() => ctx.close(), 200);
  } catch {}
}

function buzz(ms) { if (navigator.vibrate) navigator.vibrate(ms); }

/* ---------- Кусочки разметки ---------- */

/** Таймер. Когда прогулка остановлена, рядом появляются ± для правки реального времени. */
export function timerHtml(w) {
  const fix = !w || w.finished;
  const btn = (d, label) => `<button class="tmr-btn" data-act="shift" data-d="${d}"
    aria-label="${label}">${d > 0 ? '+' : '−'}</button>`;
  return `<div class="tmr">
    ${fix ? btn(-1, t('Минус минута')) : ''}
    <div class="timer" data-timer>${ws.formatTimer(ws.elapsedMs(w))}</div>
    ${fix ? btn(1, t('Плюс минута')) : ''}
  </div>`;
}

/** Счётчик повторов стоит рядом с кнопкой «Отметить повтор», а не в шапке карточки. */
export function repLineHtml(item, w) {
  const id = item.skill.id, max = item.reps, done = w?.reps?.[id] || 0;
  const full = done >= max;
  return `<div class="rep-line" id="repline-${id}">
    <button class="rep-btn" data-act="repminus" data-id="${id}"
      aria-label="${t('Убрать повтор')}" ${done ? '' : 'disabled'}>−</button>
    <div class="rep-count">
      <b class="num" data-rep="${id}">${t('{done} из {total}', { done, total:max })}</b>
      <span class="cap">${t('сделано')}</span>
    </div>
    <button class="btn btn-sm grow" data-act="rep" data-id="${id}" data-max="${max}"
      data-repadd="${id}" ${full ? 'disabled' : ''}>${full ? t('Норма выполнена') : t('Отметить повтор')}</button>
  </div>`;
}

/** Большая карточка на «Сегодня»: прогулка идёт, экран можно было покинуть. */
export function liveCardHtml(ev, w) {
  const fin = w.finished;
  const items = ev?.training || [];
  return `<div class="card card-lg walk-live">
    <div class="row-between" style="margin-bottom:4px">
      <span class="over">${fin ? t('Прогулка завершена') : (w.running ? t('Прогулка идёт') : t('Прогулка на паузе'))}</span>
      <span class="chip">${esc(ev ? ev.title : t('Прогулка'))}</span>
    </div>
    ${timerHtml(w)}
    <div class="stage-bar" style="margin:14px 0 8px"><i data-bar style="width:0%"></i></div>
    <div class="cap" style="text-align:center">${fin
      ? t('Таймер остановлен. Если реальное время другое — поправьте кнопками ± и сохраните.')
      : t('Цель: {min} мин · {reps} за прогулку', { min:ev ? ev.minutes : 0,
          reps: tn('повтор|повтора|повторов', items.reduce((a, x) => a + x.reps, 0)) })}</div>
    ${!fin ? `<div style="text-align:center;margin-top:6px">
      <button class="btn-ghost" data-act="toggle" data-toggle></button></div>` : ''}
    ${items.length ? `<div class="stack" style="margin-top:14px">${items.map(item => `
      <div class="live-skill">
        <div style="font-weight:600;margin-bottom:8px">${esc(skillName(item.skill.id))}</div>
        ${repLineHtml(item, w)}
      </div>`).join('')}</div>` : ''}
    ${!fin ? `<button class="clicker clicker-sm" data-act="click" style="margin-top:14px">${t('Кликер')}</button>
      <div class="cap" style="text-align:center;margin-top:6px" data-clicks></div>` : ''}
    <div class="btn-row" style="margin-top:16px">
      ${fin
        ? `<button class="btn btn-sec" data-act="resume">${t('Продолжить прогулку')}</button>
           <button class="btn" data-act="save">${t('Сохранить и оценить')}</button>`
        : `<button class="btn btn-sec" data-act="open">${t('Открыть прогулку')}</button>
           <button class="btn" data-act="finish">${t('Завершить')}</button>`}
    </div>
  </div>`;
}

/* ---------- Живая отрисовка ---------- */

export function paint(root, ev) {
  const w = ws.get();
  const ms = ws.elapsedMs(w);
  root.querySelectorAll('[data-timer]').forEach(el => el.textContent = ws.formatTimer(ms));
  const goal = (ev?.minutes || 30) * 60000;
  root.querySelectorAll('[data-bar]').forEach(el => el.style.width = Math.min(100, ms / goal * 100) + '%');
  root.querySelectorAll('[data-toggle]').forEach(el => {
    el.textContent = !w ? t('Старт') : (w.running ? t('Пауза') : t('Продолжить'));
  });
  root.querySelectorAll('[data-clicks]').forEach(el => {
    el.textContent = w && w.clicks
      ? t('{clicks} за прогулку', { clicks: tn('клик|клика|кликов', w.clicks) })
      : t('Нажмите в ту секунду, когда собака сделала правильно — и сразу дайте лакомство. Не пользуетесь кликером — просто не трогайте кнопку.');
  });
  paintReps(root, ev);
}

export function paintReps(root, ev) {
  const w = ws.get();
  for (const item of ev?.training || []) {
    const id = item.skill.id, max = item.reps, done = w?.reps?.[id] || 0;
    root.querySelectorAll(`[data-rep="${id}"]`).forEach(el =>
      el.textContent = t('{done} из {total}', { done, total:max }));
    root.querySelectorAll(`[data-repadd="${id}"]`).forEach(el => {
      el.disabled = done >= max;
      el.textContent = done >= max ? t('Норма выполнена') : t('Отметить повтор');
    });
    root.querySelectorAll(`[data-act="repminus"][data-id="${id}"]`).forEach(el => el.disabled = !done);
    root.querySelectorAll('#card-' + id).forEach(el => el.classList.toggle('ev-done', done >= max));
  }
}

/* ---------- Действия ---------- */

/** Набор обработчиков, общий для экрана прогулки и карточки на «Сегодня» */
export function walkActs(root, ev, slot) {
  const ensure = () => ws.get() || startWalk(slot);
  return {
    toggle: () => { ws.get() ? ws.toggle() : startWalk(slot); paint(root, ev); },
    shift: el => { ws.shiftMinutes(Number(el.dataset.d)); paint(root, ev); buzz(10); },
    rep: el => {
      ensure();
      ws.addRep(el.dataset.id, Number(el.dataset.max));
      paintReps(root, ev); buzz(10);
    },
    repminus: el => { ws.removeRep(el.dataset.id); paintReps(root, ev); },
    click: () => { ensure(); ws.addClick(); paint(root, ev); buzz(20); beep(); },
    finish: () => confirmFinish(ev),
    resume: () => { ws.resume(); rerender(); },
    save: () => saveWalk(ev),
    open: () => { location.hash = '#/walk/' + (ws.get()?.slot || slot); }
  };
}

/** Запуск прогулки — здесь же просим разрешение на уведомление: это жест пользователя */
export function startWalk(slot) {
  const w = ws.start(slot);
  ws.askNotifyPermission();
  return w;
}

function confirmFinish(ev) {
  const w = ws.get();
  if (!w) return;
  const minutes = ws.elapsedMin(w);
  if (minutes < 3 && (ev?.training?.length)) {
    sheet(`<h2>${t('Прогулка слишком короткая')}</h2>
      <p class="cap" style="margin:8px 0 16px">${t('Оценка запрашивается после прогулки длиннее 3 минут — иначе прогресс можно «прокликать», не выходя из дома.')}</p>
      <div class="btn-row"><button class="btn btn-sec" data-i="a">${t('Вернуться')}</button>
      <button class="btn" data-i="b">${t('Всё равно завершить')}</button></div>`, el => {
        el.querySelector('[data-i="a"]').onclick = closeSheet;
        el.querySelector('[data-i="b"]').onclick = () => { closeSheet(); finishWalk(ev); };
      });
    return;
  }
  finishWalk(ev);
}

/** Останавливаем таймер, шлём системное уведомление, но прогулку ещё можно поправить */
export function finishWalk(ev) {
  const w = ws.stop();
  if (!w) return;
  const minutes = ws.elapsedMin(w);
  const body = t('{min} мин · {reps}. Проверьте время и поставьте оценки.', {
    min: minutes, reps: tn('повтор|повтора|повторов', ws.totalReps(w)) });
  const sent = ws.notifyFinished(t('Прогулка завершена'), body);
  rerender();
  if (!sent) toast(t('Прогулка завершена'));
}

/** Сохраняем в историю дня и спрашиваем оценки */
export function saveWalk(ev) {
  const w = ws.get();
  if (!w) { go(); return; }
  if (!w.finished) ws.stop();
  ws.commit();
  const ids = (ev?.training || []).map(i => i.skill.id).filter(id => store.get().skills[id]);
  if (!ids.length) { toast(t('Прогулка сохранена')); go(); return; }
  askRating(ids, 0, []);
}

function go() { const first = location.hash !== '#/today'; location.hash = '#/today'; if (!first) rerender(); }

/* ---------- Оценки и итог ---------- */

function askRating(ids, i, events) {
  if (i >= ids.length) return showResult(events);
  const id = ids[i];
  const p = store.get().skills[id];
  sheet(`
    <div class="over">${t('Оценка {n} из {total}', { n:i + 1, total:ids.length })}</div>
    <h2 style="margin:4px 0 6px">${t('Как прошло с «{name}»?', { name:esc(skillName(id)) })}</h2>
    <p class="cap" style="margin-bottom:16px">${t('Отлично — это {criterion}.',
      { criterion: esc(skillCriterion(id)).toLowerCase() })}</p>
    <div class="rate-row">
      ${RATINGS.map(r => `<button class="rate" data-i="r" data-v="${r.v}" style="--rc:${r.color}">
        <b>${r.v}</b><span>${esc(ratingLabel(r.v))}</span></button>`).join('')}
    </div>
    <div class="row" style="margin-top:16px;gap:8px">
      <div class="dots">${[0,1,2,3,4].map(k => `<i class="dot ${k < p.streak ? 'dot-on' : ''}"></i>`).join('')}</div>
      <span class="cap grow">${t('Серия пятёрок: {n} из 5', { n:p.streak })}</span>
    </div>
    <button class="btn btn-sec" style="margin-top:16px" data-i="skip">${t('Пропустили этот навык')}</button>
  `, el => {
    el.querySelectorAll('[data-i="r"]').forEach(b => b.addEventListener('click', () => {
      const v = Number(b.dataset.v);
      let evs = [];
      store.update(st => { evs = rate(st.skills, id, v, ageWeeks(st.dog.birth)); });
      closeSheet();
      setTimeout(() => askRating(ids, i + 1, [...events, ...evs]), 120);
    }));
    el.querySelector('[data-i="skip"]').addEventListener('click', () => {
      closeSheet();
      setTimeout(() => askRating(ids, i + 1, events), 120);
    });
  });
}

function showResult(events) {
  const up = events.filter(e => e.type === 'stage-up');
  const unlocked = events.filter(e => e.type === 'unlocked');
  const rem = events.filter(e => e.type === 'remediation' || e.type === 'demote');
  const streaks = events.filter(e => e.type === 'streak');
  let html = '';
  if (unlocked.length) {
    html += `<div class="pop" style="text-align:center;font-size:44px">🎉</div>
      <h2 style="text-align:center">${t('Открыта новая команда')}</h2>
      <p style="text-align:center;margin:8px 0 16px">
        ${unlocked.map(e => `<b>${esc(skillName(e.id))}</b>`).join(', ')}</p>`;
  } else if (up.length) {
    html += `<div class="pop" style="text-align:center;font-size:44px">⭐</div>
      <h2 style="text-align:center">${t('Пять пятёрок подряд')}</h2>`;
  } else {
    html += `<h2>${t('Прогулка засчитана')}</h2>`;
  }
  html += '<div class="stack" style="margin-top:12px">';
  for (const e of up) {
    const st = stageInfoText(e.stage);
    html += `<div class="banner banner-ok"><div><b>${esc(skillName(e.id))} → ${esc(st.label)}</b>
      ${t('Повторов на сессию теперь {reps}, частота: {freq}.', { reps:st.reps, freq:esc(st.freq) })}</div></div>`;
  }
  for (const e of unlocked) {
    html += `<div class="banner banner-info"><div><b>${t('Новый навык: {name}', { name:esc(skillName(e.id)) })}</b>
      ${esc(skillCriterion(e.id))}</div></div>`;
  }
  for (const e of rem) {
    html += `<div class="banner"><div><b>${t('{name}: упрощаем задачу', { name:esc(skillName(e.id)) })}</b>
      ${t('Две низкие оценки подряд — возвращаемся на шаг назад и снижаем сложность. Это часть плана, а не провал.')}</div></div>`;
  }
  if (!up.length && !unlocked.length && !rem.length) {
    const best = streaks.sort((a, b) => b.n - a.n)[0];
    html += best
      ? `<div class="banner banner-ok"><div><b>${t('{name}: {n} из 5', { name:esc(skillName(best.id)), n:best.n })}</b>
         ${t('Ещё {left} — и навык перейдёт на следующую стадию.',
           { left: tn('пятёрка|пятёрки|пятёрок', 5 - best.n) })}</div></div>`
      : `<div class="banner banner-info"><div><b>${t('Результат сохранён')}</b>
         ${t('Прогресс двигают только оценки «отлично», но и обычная прогулка — это работа.')}</div></div>`;
  }
  html += `</div><button class="btn" style="margin-top:20px" data-i="ok">${t('Вернуться к дню')}</button>`;
  sheet(html, el => el.querySelector('[data-i="ok"]').addEventListener('click', () => {
    closeSheet(); go();
  }));
}
