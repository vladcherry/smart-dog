import * as store from '../state.js';
import { buildDay, dayTitle, progressOf, nextEvent, mainEvents } from '../dayplan.js';
import { todayISO, ageLabel, ageMonths, minutesOf, predictAdultWeight, expectedWeight,
         growthStatus, ageWeeks, recommendations, plural, round1 } from '../algo.js';
import { activeSkills, stageInfo, MAX_POOL } from '../training.js';
import { ARTICLES } from '../data/articles.js';
import { weekByAge, phaseOf, planFinished } from '../data/weeks.js';
import { bind, esc, ring, icon, sheet, closeSheet, toast } from '../ui.js';
import { weightChart } from '../chart.js';

const COLORS = { walk:'var(--walk)', meal:'var(--meal)', potty:'var(--potty)', train:'var(--train)' };

export default function today() {
  const s = store.get(), dog = s.dog;
  const date = todayISO();
  const log = store.dayLog(date);
  const kg = store.lastWeight()?.kg || 5;
  const day = buildDay(dog, s.skills, date, kg, log.treatsKcal || 0);
  const prog = progressOf(day, log);
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const next = nextEvent(day, log, nowMin);
  const streak = store.streakDays(date);
  const weeks = ageWeeks(dog.birth);
  const wk = weekByAge(weeks), ph = phaseOf(wk.n);
  const recs = recommendations(dog, s.weights);

  return {
    html: `
    <div class="hero">
      <div class="row">
        <div class="avatar">${dog.emoji || '🐶'}</div>
        <div class="grow">
          <h1 style="font-size:24px;line-height:30px">${esc(dog.name)}</h1>
          <div class="cap">${ageLabel(dog.birth)} · ${dayTitle(date)}</div>
        </div>
        ${ring(prog.pct)}
      </div>
      <div class="row" style="margin-top:14px;gap:8px;flex-wrap:wrap">
        <button class="chip chip-brand" data-act="plan" style="cursor:pointer">
          ${planFinished(weeks)
            ? 'Программа года пройдена · поддержка'
            : `Программа: неделя ${wk.n} из 52 · ${esc(ph.title)}`}</button>
        ${streak > 0 ? `<span class="chip chip-accent">🔥 ${streak} ${plural(streak, 'день', 'дня', 'дней')} подряд</span>` : ''}
      </div>
    </div>

    <div class="screen" style="padding-top:16px">
      ${next ? nextCard(next, log) : `<div class="banner banner-ok"><div><b>План на сегодня выполнен</b>
        ${esc(dog.name)} получил всё, что нужно. Завтра продолжим.</div></div>`}

      <div class="section-title"><h2>Сегодня</h2>
        <div class="row" style="gap:4px">
          <span class="cap num">${prog.done} из ${prog.total}</span>
          <button class="btn-ghost" data-act="sched" style="min-height:32px">Расписание</button>
        </div></div>
      <div class="timeline">${day.events.map((e, i) => evRow(e, log, i === day.events.length - 1, nowMin)).join('')}</div>

      <button class="card row" data-act="sched" style="width:100%;text-align:left;cursor:pointer;
        font:inherit;color:inherit;border:1px solid var(--divider);margin-top:4px">
        <div class="ev-icon" style="--ev:var(--health)">⏰</div>
        <div class="grow">
          <div style="font-weight:600">Изменить расписание</div>
          <div class="cap">Время выгулов и кормлений, сколько раз в день кормить, длительность прогулки</div>
        </div>
        <span style="color:var(--text-3)">${icon('chevron', 18)}</span>
      </button>

      <div class="section-title"><h2>Навыки в работе</h2>
        <div class="row" style="gap:4px">
          <span class="cap">${activeSkills(s.skills).length} из ${MAX_POOL}</span>
          <button class="btn-ghost" data-act="allskills" style="min-height:32px">Все команды</button>
        </div></div>
      <div class="stack">${skillsBlock(s.skills)}</div>

      <div class="section-title"><h2>Рост и вес</h2>
        <button class="btn-ghost" data-act="weigh">Взвесить</button></div>
      ${weightCard(dog, s.weights)}

      ${recs.length ? `<div class="section-title"><h2>Совет дня</h2>
        <button class="btn-ghost" data-act="allrecs">Все ${recs.length}</button></div>
        <div class="banner"><div><b>${esc(recs[0].title)}</b>${esc(recs[0].text)}</div></div>` : ''}

      <div class="section-title"><h2>Что почитать</h2>
        <button class="btn-ghost" data-act="book">Учебник</button></div>
      <div class="stack">${suggestedArticles(day).map(a => artCard(a)).join('')}</div>

      <p class="cap" style="margin-top:32px;text-align:center">
        Расчёты — стартовая точка. Итоговое решение по здоровью всегда за ветеринарным врачом.</p>
    </div>`,
    mount(root) {
      bind(root, {
        toggle: el => { store.toggleDone(date, el.dataset.id); location.reload(); },
        walk: el => { location.hash = '#/walk/' + el.dataset.slot; },
        skill: el => { location.hash = '#/skill/' + el.dataset.id; },
        article: el => { location.hash = '#/book/' + el.dataset.id; },
        book: () => { location.hash = '#/book'; },
        weigh: () => weighSheet(),
        sched: () => { location.hash = '#/schedule'; },
        plan: () => { location.hash = '#/plan'; },
        allskills: () => { location.hash = '#/skills'; },
        allrecs: () => { location.hash = '#/schedule'; }
      });
    }
  };
}

function nextCard(e, log) {
  const isWalk = e.type === 'walk';
  return `<div class="card card-lg" style="border-left:4px solid ${COLORS[e.type]}">
    <div class="over">Следующее</div>
    <div class="row" style="margin:6px 0 4px">
      <div class="grow"><h2>${e.icon} ${esc(e.title)}</h2></div>
      <div class="num" style="font-size:20px">${e.time}</div>
    </div>
    <div class="cap">${esc(e.sub)}</div>
    ${isWalk && e.training.length ? `<div class="ev-train">
      <b>Тренировка:</b> ${e.training.map(t => `${esc(t.skill.name)} ×${t.reps}`).join(' · ')}</div>` : ''}
    <div class="btn-row" style="margin-top:16px">
      ${isWalk ? `<button class="btn" data-act="walk" data-slot="${e.slot}">Начать прогулку</button>`
               : `<button class="btn" data-act="toggle" data-id="${e.id}">Отметить выполненным</button>`}
    </div>
  </div>`;
}

function evRow(e, log, last, nowMin) {
  const done = !!log.done[e.id];
  const now = !done && Math.abs(minutesOf(e.time) - nowMin) <= 30;
  const cls = ['ev', done ? 'ev-done' : '', now ? 'ev-now' : ''].join(' ');
  return `<div class="tl-item">
    <div class="tl-rail"><div class="tl-dot" style="--dot:${done ? 'var(--ok-fill)' : COLORS[e.type]}"></div>
      ${last ? '' : '<div class="tl-line"></div>'}</div>
    <div class="tl-body">
      <div class="${cls}" style="--ev:${COLORS[e.type]}">
        <div class="ev-icon">${e.icon}</div>
        <div class="grow">
          <div class="ev-title">${esc(e.title)}</div>
          <div class="ev-time">${e.time} · ${esc(e.sub)}</div>
          ${e.training?.length ? `<div class="ev-train">🎯 ${e.training.map(t =>
            `${esc(t.skill.name)} ×${t.reps}${t.review ? ' (проверка)' : ''}`).join(' · ')}
            ${!done ? `<div style="margin-top:8px"><button class="chip chip-train" data-act="walk"
              data-slot="${e.slot}">Начать прогулку с тренировкой</button></div>` : ''}</div>` : ''}
        </div>
        <button class="ev-check" data-act="toggle" data-id="${e.id}" aria-pressed="${done}"
          aria-label="Отметить: ${esc(e.title)}">✓</button>
      </div>
    </div>
  </div>`;
}

function skillsBlock(skills) {
  const act = activeSkills(skills);
  if (!act.length) return `<div class="card"><div class="cap">Все текущие навыки освоены — новые откроются по возрасту.</div></div>`;
  return act.map(s => {
    const p = skills[s.id], st = stageInfo(p.stage);
    return `<button class="skill" data-act="skill" data-id="${s.id}">
      <div class="grow">
        <div style="font-weight:600">${esc(s.name)}</div>
        <div class="cap">${st.label} · ${st.reps} повторов · ${st.freq}</div>
      </div>
      <div class="dots" aria-label="Серия пятёрок: ${p.streak} из 5">
        ${[0,1,2,3,4].map(i => `<i class="dot ${i < p.streak ? 'dot-on' : ''}"></i>`).join('')}
      </div>
      <span style="color:var(--text-3)">${icon('chevron', 18)}</span>
    </button>`;
  }).join('');
}

function weightCard(dog, weights) {
  const last = weights[weights.length - 1];
  const pred = predictAdultWeight(dog, weights);
  if (!last || !pred) return `<div class="card">${weightChart(dog, weights)}</div>`;
  const weeks = ageWeeks(dog.birth, new Date(last.date + 'T12:00:00'));
  const exp = expectedWeight(pred.value, weeks, dog.group);
  const st = growthStatus(last.kg, exp);
  return `<div class="card">
    <div class="row-between" style="margin-bottom:8px">
      <div><div class="display num">${last.kg} кг</div>
        <div class="cap">Ожидание по кривой: ${round1(exp)} кг</div></div>
      <span class="pill" style="background:var(--${st.tone}-bg);color:var(--${st.tone}-text)">${st.label}</span>
    </div>
    ${weightChart(dog, weights)}
    <div class="cap" style="margin-top:8px">Прогноз взрослого веса:
      <b class="num">${pred.value} кг</b> ${pred.confident ? `(${pred.low}–${pred.high})` : '— уточним после второго взвешивания'}</div>
  </div>`;
}

function suggestedArticles(day) {
  const ids = new Set();
  day.events.forEach(e => e.training?.forEach(t => ids.add(t.skill.article)));
  const list = ARTICLES.filter(a => ids.has(a.id));
  for (const a of ARTICLES) { if (list.length >= 3) break; if (!list.includes(a)) list.push(a); }
  return list.slice(0, 3);
}

function artCard(a) {
  return `<button class="card art" data-act="article" data-id="${a.id}" style="width:100%;text-align:left;border:none;font:inherit;color:inherit;cursor:pointer">
    <div class="art-cover">${a.icon}</div>
    <div class="grow">
      <div style="font-weight:600;line-height:20px">${esc(a.title)}</div>
      <div class="cap" style="margin-top:4px">${esc(a.subtitle)}</div>
      <div class="cap" style="margin-top:6px">${a.min} мин чтения</div>
    </div>
  </button>`;
}

export function weighSheet(after) {
  const last = store.lastWeight();
  sheet(`
    <h2>Взвешивание</h2>
    <p class="cap" style="margin:8px 0 16px">Возьмите собаку на руки, встаньте на весы и вычтите свой вес.</p>
    <label class="field"><span>Вес, кг</span>
      <input type="number" step="0.1" min="0.5" id="w-kg" inputmode="decimal" value="${last?.kg || ''}"></label>
    <button class="btn" data-act="save">Сохранить</button>
  `, el => {
    const inp = el.querySelector('#w-kg');
    inp.focus(); inp.select();
    el.querySelector('[data-act="save"]').addEventListener('click', () => {
      const kg = Number(inp.value);
      if (!(kg > 0)) return toast('Введите вес больше нуля');
      store.addWeight(todayISO(), kg);
      closeSheet();
      toast('Вес сохранён, план пересчитан');
      after ? after() : location.reload();
    });
  });
}
