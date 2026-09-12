import * as store from '../state.js';
import { buildDay } from '../dayplan.js';
import { todayISO, ageWeeks, ageMonths, trainingMinutes } from '../algo.js';
import { rate, skillById } from '../training.js';
import { RATINGS } from '../data/skills.js';
import { bind, esc, sheet, closeSheet, toast, icon } from '../ui.js';
import { t, tn } from '../i18n/index.js';
import { skillName, skillWhat, skillGear, skillCriterion, skillSteps,
         stageInfoText, ratingLabel, article } from '../i18n/content.js';

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
        <button class="btn-ghost" data-act="exit">${icon('back', 20)} ${t('Выйти')}</button>
        <span class="chip">${esc(ev.title)}</span>
      </div>

      <div class="card card-lg" style="text-align:center">
        <div class="timer" id="timer">00:00</div>
        <div class="cap" style="margin-top:4px">${t('Цель: {min} мин · тренировка {train} мин',
          { min:ev.minutes, train:ev.trainMin })}</div>
        <div class="stage-bar" style="margin:16px 0"><i id="bar" style="width:0%"></i></div>
        <button class="btn" data-act="toggle" id="startBtn">${t('Старт')}</button>
      </div>

      <div class="section-title"><h2>${t('Тренировка')}</h2>
        <span class="cap">${t('{n} мин', { n:ev.trainMin })}</span></div>
      <div class="stack">${ev.training.map(item => trainCard(item)).join('') ||
        `<div class="card"><div class="cap">${t('Сегодня тренировка не запланирована — просто гуляйте.')}</div></div>`}</div>

      <div class="section-title" style="margin-bottom:8px"><h2>${t('Маркер')}</h2>
        <button class="btn-ghost" data-act="whatclick" style="min-height:32px">${t('Зачем это?')}</button></div>
      <button class="clicker" data-act="click" id="clicker">${t('Кликер')}</button>
      <div class="cap" style="text-align:center;margin-top:8px" id="clickCount">
        ${t('Нажмите в ту секунду, когда собака сделала правильно — и сразу дайте лакомство. Не пользуетесь кликером — просто не трогайте кнопку.')}</div>

      <div class="section-title"><h2>${t('Отметки')}</h2></div>
      <div class="walk-actions">
        <button data-act="mark" data-m="pee" data-count="0">💧 ${t('Пописал')}</button>
        <button data-act="mark" data-m="poo" data-count="0">💩 ${t('Покакал')}</button>
        <button data-act="mark" data-m="dog" data-count="0">🐕 ${t('Встретили собаку')}</button>
        <button data-act="mark" data-m="fear" data-count="0">😨 ${t('Испугался')}</button>
      </div>

      <button class="btn" style="margin-top:24px" data-act="finish">${t('Завершить прогулку')}</button>
      <p class="cap" style="text-align:center;margin-top:12px">${t('В конце спросим оценку по каждому навыку')}</p>
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
          if (running) { started = Date.now() - elapsed; btn.textContent = t('Пауза'); }
          else btn.textContent = t('Продолжить');
        },
        rep: el => {
          const id = el.dataset.id, max = Number(el.dataset.max);
          reps[id] = Math.min(max, (reps[id] || 0) + 1);
          const out = root.querySelector('#rep-' + id);
          if (out) out.textContent = t('{done} из {total}', { done:reps[id], total:max });
          if (reps[id] >= max) {
            root.querySelector('#card-' + id)?.classList.add('ev-done');
            el.textContent = t('Норма выполнена');
            el.disabled = true;
          }
          if (navigator.vibrate) navigator.vibrate(10);
        },
        how: el => howSheet(el.dataset.id),
        whatclick: () => clickerSheet(),
        click: () => {
          clicks++;
          root.querySelector('#clickCount').textContent =
            t('{clicks} за прогулку', { clicks: tn('клик|клика|кликов', clicks) });
          if (navigator.vibrate) navigator.vibrate(20);
          beep();
        },
        mark: el => { marks[el.dataset.m]++; el.dataset.count = marks[el.dataset.m]; },
        exit: () => { location.hash = '#/today'; },
        finish: () => {
          const minutes = Math.round(elapsed / 60000);
          if (minutes < 3 && ev.training.length) {
            sheet(`<h2>${t('Прогулка слишком короткая')}</h2>
              <p class="cap" style="margin:8px 0 16px">${t('Оценка запрашивается после прогулки длиннее 3 минут — иначе прогресс можно «прокликать», не выходя из дома.')}</p>
              <div class="btn-row"><button class="btn btn-sec" data-act="a">${t('Вернуться')}</button>
              <button class="btn" data-act="b">${t('Всё равно завершить')}</button></div>`, el => {
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

function trainCard(item) {
  const st = stageInfoText(item.stage);
  const id = item.skill.id;
  return `<div class="card" id="card-${id}">
    <div class="row-between">
      <div class="grow">
        <div style="font-weight:600">${esc(skillName(id))}
          ${item.review ? `<span class="badge">${t('проверка')}</span>` : ''}</div>
        <div class="cap">${st.label} · ${t('сделайте {reps} за прогулку и отмечайте каждый кнопкой ниже',
          { reps: tn('повтор|повтора|повторов', item.reps) })}</div>
      </div>
      <div style="text-align:right;flex:none">
        <b class="num" style="font-size:18px" id="rep-${id}">${t('{done} из {total}', { done:0, total:item.reps })}</b>
        <div class="cap" style="font-size:11px;line-height:14px">${t('сделано')}</div>
      </div>
    </div>
    <div class="cap" style="margin-top:10px;color:var(--text)">${esc(skillWhat(id))}</div>
    <div class="cap" style="margin-top:6px">${t('Понадобится: {gear}', { gear:esc(skillGear(id)) })}</div>
    <ol class="steps">${skillSteps(id).map(x => `<li>${esc(x)}</li>`).join('')}</ol>
    <div class="btn-row" style="margin-top:12px">
      <button class="btn btn-sec btn-sm" data-act="how" data-id="${id}">${t('Разобрать подробно')}</button>
      <button class="btn btn-sm" data-act="rep" data-id="${id}" data-max="${item.reps}">${t('Отметить повтор')}</button>
    </div>
  </div>`;
}

function howSheet(id) {
  const sk = skillById(id);
  const art = article(sk.article);
  sheet(`
    <div class="over">${esc(art ? art.title : t('Как учить'))}</div>
    <h2 style="margin:4px 0 12px">${esc(skillName(id))}</h2>
    <p>${esc(skillWhat(id))}</p>
    <div class="cap" style="margin-bottom:12px">${t('Понадобится: {gear}', { gear:esc(skillGear(id)) })}</div>
    <div class="banner banner-ok" style="margin-bottom:16px"><div>
      <b>${t('Оценка «отлично» — это')}</b>${esc(skillCriterion(id))}</div></div>
    ${art ? `<div class="over" style="margin-bottom:8px">${t('Полный протокол')}</div>
      <div class="stack">${art.steps.map((x, i) => `<div class="step">
        <b>${t('Шаг {n}. {title}', { n:i + 1, title:esc(x.t) })}</b><div>${esc(x.d)}</div>
        <div class="cap" style="margin-top:6px">${t('Дальше, когда: {c}', { c:esc(x.c) })}</div></div>`).join('')}</div>
      <div class="over" style="margin:20px 0 8px">${t('Частые ошибки')}</div>
      <ul style="padding-left:20px;margin:0">${art.mistakes.map(m => `<li style="margin-bottom:8px">${esc(m)}</li>`).join('')}</ul>` : ''}
    <button class="btn" style="margin-top:20px" data-i="ok">${t('Вернуться к прогулке')}</button>
  `, el => { el.querySelector('[data-i="ok"]').onclick = closeSheet; });
}

function clickerSheet() {
  sheet(`
    <h2>${t('Зачем кликер')}</h2>
    <p style="margin-top:12px">${t('Собака не понимает, за что именно ей дали лакомство: между правильным действием и едой проходит секунда-две, и за это время она успевает сделать ещё три вещи.')}</p>
    <p>${t('Кликер — короткий звук, который ставит метку ровно в нужный момент: «вот это и было правильно, еда сейчас будет». Сначала звук ничего не значит, но после десятка повторов «клик = лакомство» он становится точным указателем.')}</p>
    <div class="stack" style="margin-top:8px">
      <div class="step"><b>${t('Как пользоваться')}</b>
        ${t('Нажимаете в ту секунду, когда собака сделала нужное — сел, лёг, посмотрел на вас. Сразу после этого даёте лакомство. Каждый клик обязан заканчиваться едой, иначе метка обесценится.')}</div>
      <div class="step"><b>${t('Если кликера нет')}</b>
        ${t('Подойдёт короткое слово: «да» или «есть». Главное — всегда одно и то же и очень коротко. Кнопка в приложении звучит так же, как настоящий кликер, и её можно просто не использовать.')}</div>
      <div class="step"><b>${t('Чего не делать')}</b>
        ${t('Не кликать «на удачу» и не подзывать кликом — это не команда, а отметка. Не кликать после действия: поздний клик отмечает уже другое поведение.')}</div>
    </div>
    <div class="banner banner-info" style="margin-top:16px"><div>
      <b>${t('Кликер не обязателен')}</b>${t('Без него всё работает, просто медленнее. Если он мешает — не нажимайте кнопку, на прогресс это не влияет.')}</div></div>
    <button class="btn" style="margin-top:20px" data-i="ok">${t('Понятно')}</button>
  `, el => { el.querySelector('[data-i="ok"]').onclick = closeSheet; });
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
  askRating(ev.training.map(item => item.skill.id), 0, []);
}

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
      ${RATINGS.map(r => `<button class="rate" data-act="r" data-v="${r.v}" style="--rc:${r.color}">
        <b>${r.v}</b><span>${esc(ratingLabel(r.v))}</span></button>`).join('')}
    </div>
    <div class="row" style="margin-top:16px;gap:8px">
      <div class="dots">${[0,1,2,3,4].map(k => `<i class="dot ${k < p.streak ? 'dot-on' : ''}"></i>`).join('')}</div>
      <span class="cap grow">${t('Серия пятёрок: {n} из 5', { n:p.streak })}</span>
    </div>
    <button class="btn btn-sec" style="margin-top:16px" data-act="skip">${t('Пропустили этот навык')}</button>
  `, el => {
    el.querySelectorAll('[data-act="r"]').forEach(b => b.addEventListener('click', () => {
      const v = Number(b.dataset.v);
      let evs = [];
      store.update(st => { evs = rate(st.skills, id, v, ageWeeks(st.dog.birth)); });
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
  html += `</div><button class="btn" style="margin-top:20px" data-act="ok">${t('Вернуться к дню')}</button>`;
  sheet(html, el => el.querySelector('[data-act="ok"]').addEventListener('click', () => {
    closeSheet(); location.hash = '#/today'; location.reload();
  }));
}
