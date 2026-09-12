import * as store from '../state.js';
import { buildDay, dayTitle, progressOf, nextEvent, mainEvents } from '../dayplan.js';
import { todayISO, ageLabel, ageMonths, minutesOf, predictAdultWeight, expectedWeight,
         growthStatus, ageWeeks, recommendations, round1 } from '../algo.js';
import { activeSkills, MAX_POOL } from '../training.js';
import { ARTICLES } from '../data/articles.js';
import { weekByAge, phaseOf, planFinished } from '../data/weeks.js';
import { bind, esc, ring, icon, sheet, closeSheet, toast, avatarHtml } from '../ui.js';
import { weightChart } from '../chart.js';
import { t, tn } from '../i18n/index.js';
import { skillName, stageInfoText, phase, articlesAll } from '../i18n/content.js';

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
  const wk = weekByAge(weeks), ph = phase(phaseOf(wk.n).id);
  const recs = recommendations(dog, s.weights);

  return {
    html: `
    <div class="hero">
      <div class="row">
${avatarHtml(dog)}
        <div class="grow">
          <h1 style="font-size:24px;line-height:30px">${esc(dog.name)}</h1>
          <div class="cap">${ageLabel(dog.birth)} · ${dayTitle(date)}</div>
        </div>
        ${ring(prog.pct)}
      </div>
      <div class="row" style="margin-top:14px;gap:8px;flex-wrap:wrap">
        <button class="chip chip-brand" data-act="plan" style="cursor:pointer">
          ${planFinished(weeks)
            ? t('Программа года пройдена · поддержка')
            : t('Программа: неделя {n} из 52 · {phase}', { n:wk.n, phase:esc(ph.title) })}</button>
        ${streak > 0 ? `<span class="chip chip-accent">🔥 ${t('{days} подряд', { days: tn('день|дня|дней', streak) })}</span>` : ''}
      </div>
    </div>

    <div class="screen" style="padding-top:16px">
      ${next ? nextCard(next, log) : `<div class="banner banner-ok"><div><b>${t('План на сегодня выполнен')}</b>
        ${t('{name} получил всё, что нужно. Завтра продолжим.', { name:esc(dog.name) })}</div></div>`}

      <div class="section-title"><h2>${t('Сегодня')}</h2>
        <div class="row" style="gap:4px">
          <span class="cap num">${t('{done} из {total}', { done:prog.done, total:prog.total })}</span>
          <button class="btn-ghost" data-act="sched" style="min-height:32px">${t('Расписание')}</button>
        </div></div>
      <div class="timeline">${day.events.map((e, i) => evRow(e, log, i === day.events.length - 1, nowMin)).join('')}</div>

      <button class="card row" data-act="sched" style="width:100%;text-align:left;cursor:pointer;
        font:inherit;color:inherit;border:1px solid var(--divider);margin-top:4px">
        <div class="ev-icon" style="--ev:var(--health)">⏰</div>
        <div class="grow">
          <div style="font-weight:600">${t('Изменить расписание')}</div>
          <div class="cap">${t('Время выгулов и кормлений, сколько раз в день кормить, длительность прогулки')}</div>
        </div>
        <span style="color:var(--text-3)">${icon('chevron', 18)}</span>
      </button>

      <div class="section-title"><h2>${t('Навыки в работе')}</h2>
        <div class="row" style="gap:4px">
          <span class="cap">${t('{done} из {total}', { done:activeSkills(s.skills).length, total:MAX_POOL })}</span>
          <button class="btn-ghost" data-act="allskills" style="min-height:32px">${t('Все команды')}</button>
        </div></div>
      <div class="stack">${skillsBlock(s.skills)}</div>

      <div class="section-title"><h2>${t('Рост и вес')}</h2>
        <button class="btn-ghost" data-act="weigh">${t('Взвесить')}</button></div>
      ${weightCard(dog, s.weights)}

      ${recs.length ? `<div class="section-title"><h2>${t('Совет дня')}</h2>
        <button class="btn-ghost" data-act="allrecs">${t('Все {n}', { n:recs.length })}</button></div>
        <div class="banner"><div><b>${esc(recs[0].title)}</b>${esc(recs[0].text)}</div></div>` : ''}

      <div class="section-title"><h2>${t('Что почитать')}</h2>
        <button class="btn-ghost" data-act="book">${t('Учебник')}</button></div>
      <div class="stack">${suggestedArticles(day).map(a => artCard(a)).join('')}</div>

      <p class="cap" style="margin-top:32px;text-align:center">
        ${t('Расчёты — стартовая точка. Итоговое решение по здоровью всегда за ветеринарным врачом.')}</p>
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
    <div class="over">${t('Следующее')}</div>
    <div class="row" style="margin:6px 0 4px">
      <div class="grow"><h2>${e.icon} ${esc(e.title)}</h2></div>
      <div class="num" style="font-size:20px">${e.time}</div>
    </div>
    <div class="cap">${esc(e.sub)}</div>
    ${isWalk && e.training.length ? `<div class="ev-train">
      <b>${t('Тренировка:')}</b> ${e.training.map(x => `${esc(skillName(x.skill.id))} ×${x.reps}`).join(' · ')}</div>` : ''}
    <div class="btn-row" style="margin-top:16px">
      ${isWalk ? `<button class="btn" data-act="walk" data-slot="${e.slot}">${t('Начать прогулку')}</button>`
               : `<button class="btn" data-act="toggle" data-id="${e.id}">${t('Отметить выполненным')}</button>`}
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
          ${e.training?.length ? `<div class="ev-train">🎯 ${e.training.map(x =>
            `${esc(skillName(x.skill.id))} ×${x.reps}${x.review ? ' ' + t('(проверка)') : ''}`).join(' · ')}
            ${!done ? `<div style="margin-top:8px"><button class="chip chip-train" data-act="walk"
              data-slot="${e.slot}">${t('Начать прогулку с тренировкой')}</button></div>` : ''}</div>` : ''}
        </div>
        <button class="ev-check" data-act="toggle" data-id="${e.id}" aria-pressed="${done}"
          aria-label="${t('Отметить: {title}', { title:esc(e.title) })}">✓</button>
      </div>
    </div>
  </div>`;
}

function skillsBlock(skills) {
  const act = activeSkills(skills);
  if (!act.length) return `<div class="card"><div class="cap">${t('Все текущие навыки освоены — новые откроются по возрасту.')}</div></div>`;
  return act.map(s => {
    const p = skills[s.id], st = stageInfoText(p.stage);
    return `<button class="skill" data-act="skill" data-id="${s.id}">
      <div class="grow">
        <div style="font-weight:600">${esc(skillName(s.id))}</div>
        <div class="cap">${st.label} · ${tn('повтор|повтора|повторов', st.reps)} · ${st.freq}</div>
      </div>
      <div class="dots" aria-label="${t('Серия пятёрок: {n} из 5', { n:p.streak })}">
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
      <div><div class="display num">${t('{kg} кг', { kg:last.kg })}</div>
        <div class="cap">${t('Ожидание по кривой: {kg} кг', { kg:round1(exp) })}</div></div>
      <span class="pill" style="background:var(--${st.tone}-bg);color:var(--${st.tone}-text)">${st.label}</span>
    </div>
    ${weightChart(dog, weights)}
    <div class="cap" style="margin-top:8px">${t('Прогноз взрослого веса:')}
      <b class="num">${t('{kg} кг', { kg:pred.value })}</b> ${pred.confident
        ? `(${pred.low}–${pred.high})` : t('— уточним после второго взвешивания')}</div>
  </div>`;
}

function suggestedArticles(day) {
  const ids = new Set();
  day.events.forEach(e => e.training?.forEach(x => ids.add(x.skill.article)));
  const all = articlesAll();
  const list = all.filter(a => ids.has(a.id));
  for (const a of all) { if (list.length >= 3) break; if (!list.includes(a)) list.push(a); }
  return list.slice(0, 3);
}

function artCard(a) {
  return `<button class="card art" data-act="article" data-id="${a.id}" style="width:100%;text-align:left;border:none;font:inherit;color:inherit;cursor:pointer">
    <div class="art-cover">${a.icon}</div>
    <div class="grow">
      <div style="font-weight:600;line-height:20px">${esc(a.title)}</div>
      <div class="cap" style="margin-top:4px">${esc(a.subtitle)}</div>
      <div class="cap" style="margin-top:6px">${t('{n} мин чтения', { n:a.min })}</div>
    </div>
  </button>`;
}

export function weighSheet(after) {
  const last = store.lastWeight();
  sheet(`
    <h2>${t('Взвешивание')}</h2>
    <p class="cap" style="margin:8px 0 16px">${t('Возьмите собаку на руки, встаньте на весы и вычтите свой вес.')}</p>
    <label class="field"><span>${t('Вес, кг')}</span>
      <input type="number" step="0.1" min="0.5" id="w-kg" inputmode="decimal" value="${last?.kg || ''}"></label>
    <button class="btn" data-act="save">${t('Сохранить')}</button>
  `, el => {
    const inp = el.querySelector('#w-kg');
    inp.focus(); inp.select();
    el.querySelector('[data-act="save"]').addEventListener('click', () => {
      const kg = Number(inp.value);
      if (!(kg > 0)) return toast(t('Введите вес больше нуля'));
      store.addWeight(todayISO(), kg);
      closeSheet();
      toast(t('Вес сохранён, план пересчитан'));
      after ? after() : location.reload();
    });
  });
}
