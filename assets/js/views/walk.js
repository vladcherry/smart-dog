import * as store from '../state.js';
import { buildDay } from '../dayplan.js';
import { todayISO, ageWeeks, ageMonths, trainingMinutes, plural } from '../algo.js';
import { rate, stageInfo, skillById } from '../training.js';
import { RATINGS } from '../data/skills.js';
import { bind, esc, sheet, closeSheet, toast, icon } from '../ui.js';

const KCAL_PER_TREAT = 3;
let timer = null, started = 0, elapsed = 0, running = false;
let reps = {}, marks = { pee:0, poo:0, dog:0, fear:0 }, clicks = 0;

export default function walk(slot = 'am') {
  const s = store.get(), dog = s.dog, date = todayISO();
  const log = store.dayLog(date);
  const kg = store.lastWeight()?.kg || 5;
  const day = buildDay(dog, s.skills, date, kg, log.treatsKcal || 0);
  const ev = day.events.find(e => e.id === 'walk-' + slot) || day.events.find(e => e.type === 'walk');
  const months = ageMonths(dog.birth);
  reps = {}; marks = { pee:0, poo:0, dog:0, fear:0 }; clicks = 0;
  elapsed = 0; running = false;

  return {
    html: `<div class="screen" style="padding-top:20px">
      <div class="row-between" style="margin-bottom:20px">
        <button class="btn-ghost" data-act="exit">${icon('back', 20)} Выйти</button>
        <span class="chip">${esc(ev.title)}</span>
      </div>

      <div class="card card-lg" style="text-align:center">
        <div class="timer" id="timer">00:00</div>
        <div class="cap" style="margin-top:4px">Цель: ${ev.minutes} мин · тренировка ${ev.trainMin} мин</div>
        <div class="stage-bar" style="margin:16px 0"><i id="bar" style="width:0%"></i></div>
        <button class="btn" data-act="toggle" id="startBtn">Старт</button>
      </div>

      <div class="section-title"><h2>Тренировка</h2><span class="cap">${ev.trainMin} мин</span></div>
      <div class="stack">${ev.training.map(t => trainCard(t)).join('') ||
        '<div class="card"><div class="cap">Сегодня тренировка не запланирована — просто гуляйте.</div></div>'}</div>

      <button class="clicker" data-act="click" style="margin-top:20px" id="clicker">Кликер</button>
      <div class="cap" style="text-align:center;margin-top:6px" id="clickCount">Маркер звучит в момент правильного действия</div>

      <div class="section-title"><h2>Отметки</h2></div>
      <div class="walk-actions">
        <button data-act="mark" data-m="pee" data-count="0">💧 Пописал</button>
        <button data-act="mark" data-m="poo" data-count="0">💩 Покакал</button>
        <button data-act="mark" data-m="dog" data-count="0">🐕 Встретили собаку</button>
        <button data-act="mark" data-m="fear" data-count="0">😨 Испугался</button>
      </div>

      <button class="btn" style="margin-top:24px" data-act="finish">Завершить прогулку</button>
      <p class="cap" style="text-align:center;margin-top:12px">В конце спросим оценку по каждому навыку</p>
    </div>`,

    mount(root) {
      const tEl = root.querySelector('#timer'), bar = root.querySelector('#bar');
      const btn = root.querySelector('#startBtn');
      const paint = () => {
        const sec = Math.floor(elapsed / 1000);
        tEl.textContent = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
        bar.style.width = Math.min(100, sec / (ev.minutes * 60) * 100) + '%';
      };
      const tick = () => { if (running) { elapsed = Date.now() - started; paint(); } };
      timer = setInterval(tick, 500);

      bind(root, {
        toggle: () => {
          running = !running;
          if (running) { started = Date.now() - elapsed; btn.textContent = 'Пауза'; }
          else btn.textContent = 'Продолжить';
        },
        rep: el => {
          const id = el.dataset.id;
          const max = Number(el.dataset.max);
          reps[id] = Math.min(max, (reps[id] || 0) + 1);
          el.querySelector('b').textContent = `${reps[id]} / ${max}`;
          if (reps[id] >= max) el.classList.add('ev-done');
        },
        click: () => {
          clicks++;
          root.querySelector('#clickCount').textContent = `${clicks} ${plural(clicks, 'клик', 'клика', 'кликов')} за прогулку`;
          if (navigator.vibrate) navigator.vibrate(20);
          beep();
        },
        mark: el => { marks[el.dataset.m]++; el.dataset.count = marks[el.dataset.m]; },
        exit: () => { location.hash = '#/today'; },
        finish: () => {
          const minutes = Math.round(elapsed / 60000);
          if (minutes < 3 && ev.training.length) {
            sheet(`<h2>Прогулка слишком короткая</h2>
              <p class="cap" style="margin:8px 0 16px">Оценка запрашивается после прогулки длиннее 3 минут —
              иначе прогресс можно «прокликать», не выходя из дома.</p>
              <div class="btn-row"><button class="btn btn-sec" data-act="a">Вернуться</button>
              <button class="btn" data-act="b">Всё равно завершить</button></div>`, el => {
                el.querySelector('[data-act="a"]').onclick = closeSheet;
                el.querySelector('[data-act="b"]').onclick = () => { closeSheet(); finishWalk(ev, slot, minutes, true); };
              });
            return;
          }
          finishWalk(ev, slot, minutes, false);
        }
      });
      paint();
    },
    unmount() { clearInterval(timer); timer = null; running = false; }
  };
}

function trainCard(t) {
  const st = stageInfo(t.stage);
  return `<div class="card" data-act="rep" data-id="${t.skill.id}" data-max="${t.reps}" style="cursor:pointer">
    <div class="row-between">
      <div class="grow">
        <div style="font-weight:600">${esc(t.skill.name)}
          ${t.review ? '<span class="badge">проверка</span>' : ''}</div>
        <div class="cap">${st.label} · нажимайте карточку за каждый повтор</div>
      </div>
      <b class="num" style="font-size:18px">0 / ${t.reps}</b>
    </div>
    <div class="ev-train" style="margin-top:10px">
      ${t.skill.steps.map((s, i) => `${i + 1}. ${esc(s)}`).join('<br>')}
    </div>
  </div>`;
}

function beep() {
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

/* ---------- Завершение и оценки ---------- */
function finishWalk(ev, slot, minutes, skipRating) {
  const date = todayISO();
  const totalReps = Object.values(reps).reduce((a, b) => a + b, 0);
  store.update(s => {
    const log = store.dayLog(date);
    log.done['walk-' + slot] = true;
    log.treatsKcal = (log.treatsKcal || 0) + totalReps * KCAL_PER_TREAT;
    s.walks.push({ date, slot, minutes, marks:{ ...marks }, clicks, reps:{ ...reps } });
    if (s.walks.length > 200) s.walks.shift();
  });
  if (skipRating || !ev.training.length) { location.hash = '#/today'; return; }
  askRating(ev.training.map(t => t.skill.id), 0, []);
}

function askRating(ids, i, events) {
  if (i >= ids.length) return showResult(events);
  const sk = skillById(ids[i]);
  const p = store.get().skills[sk.id];
  sheet(`
    <div class="over">Оценка ${i + 1} из ${ids.length}</div>
    <h2 style="margin:4px 0 6px">Как прошло с «${esc(sk.name)}»?</h2>
    <p class="cap" style="margin-bottom:16px">Отлично — это ${esc(sk.criterion).toLowerCase()}.</p>
    <div class="rate-row">
      ${RATINGS.map(r => `<button class="rate" data-act="r" data-v="${r.v}" style="--rc:${r.color}">
        <b>${r.v}</b><span>${r.label}</span></button>`).join('')}
    </div>
    <div class="row" style="margin-top:16px;gap:8px">
      <div class="dots">${[0,1,2,3,4].map(k => `<i class="dot ${k < p.streak ? 'dot-on' : ''}"></i>`).join('')}</div>
      <span class="cap grow">Серия пятёрок: ${p.streak} из 5</span>
    </div>
    <button class="btn btn-sec" style="margin-top:16px" data-act="skip">Пропустили этот навык</button>
  `, el => {
    el.querySelectorAll('[data-act="r"]').forEach(b => b.addEventListener('click', () => {
      const v = Number(b.dataset.v);
      let evs = [];
      store.update(s => { evs = rate(s.skills, sk.id, v, ageWeeks(s.dog.birth)); });
      closeSheet();
      setTimeout(() => askRating(ids, i + 1, [...events, ...evs]), 120);
    }));
    el.querySelector('[data-act="skip"]').addEventListener('click', () => {
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
      <h2 style="text-align:center">Открыта новая команда</h2>
      <p style="text-align:center;margin:8px 0 16px">
        ${unlocked.map(e => `<b>${esc(skillById(e.id).name)}</b>`).join(', ')}</p>`;
  } else if (up.length) {
    html += `<div class="pop" style="text-align:center;font-size:44px">⭐</div><h2 style="text-align:center">Пять пятёрок подряд</h2>`;
  } else {
    html += `<h2>Прогулка засчитана</h2>`;
  }
  html += '<div class="stack" style="margin-top:12px">';
  for (const e of up) {
    const st = stageInfo(e.stage);
    html += `<div class="banner banner-ok"><div><b>${esc(skillById(e.id).name)} → ${st.label}</b>
      Повторов на сессию теперь ${st.reps}, частота: ${st.freq}.</div></div>`;
  }
  for (const e of unlocked) {
    const s = skillById(e.id);
    html += `<div class="banner banner-info"><div><b>Новый навык: ${esc(s.name)}</b>
      ${esc(s.criterion)}</div></div>`;
  }
  for (const e of rem) {
    html += `<div class="banner"><div><b>${esc(skillById(e.id).name)}: упрощаем задачу</b>
      Две низкие оценки подряд — возвращаемся на шаг назад и снижаем сложность. Это часть плана, а не провал.</div></div>`;
  }
  if (!up.length && !unlocked.length && !rem.length) {
    const best = streaks.sort((a, b) => b.n - a.n)[0];
    html += best
      ? `<div class="banner banner-ok"><div><b>${esc(skillById(best.id).name)}: ${best.n} из 5</b>
         Ещё ${5 - best.n} ${plural(5 - best.n, 'пятёрка', 'пятёрки', 'пятёрок')} — и навык перейдёт на следующую стадию.</div></div>`
      : `<div class="banner banner-info"><div><b>Результат сохранён</b>
         Прогресс двигают только оценки «отлично», но и обычная прогулка — это работа.</div></div>`;
  }
  html += '</div><button class="btn" style="margin-top:20px" data-act="ok">Вернуться к дню</button>';
  sheet(html, el => el.querySelector('[data-act="ok"]').addEventListener('click', () => {
    closeSheet(); location.hash = '#/today'; location.reload();
  }));
}
