import * as store from '../state.js';
import { WEEKS, PHASES, phaseOf, weekByAge } from '../data/weeks.js';
import { ageWeeks, ageLabel } from '../algo.js';
import { skillById } from '../training.js';
import { bind, esc } from '../ui.js';

export default function plan() {
  const s = store.get(), dog = s.dog;
  const weeks = ageWeeks(dog.birth);
  const cur = weekByAge(weeks);
  const ph = phaseOf(cur.n);

  return {
    html: `<div class="screen-head"><div class="over">План на год</div>
      <h1>Неделя ${cur.n} из 52</h1>
      <div class="cap">${ageLabel(dog.birth)} · фаза «${esc(ph.title)}»</div></div>
      <div class="screen" style="padding-top:8px">
        <div class="card card-lg">
          <div class="over">Тема недели</div>
          <h2 style="margin:6px 0 8px">${esc(cur.theme)}</h2>
          <div class="banner banner-ok" style="margin-top:12px"><div>
            <b>Контрольная точка</b>${esc(cur.goal)}</div></div>
          ${cur.new.length ? `<div class="cap" style="margin-top:12px">Открываются навыки:
            ${cur.new.map(id => esc(skillById(id)?.name || id)).join(', ')}</div>` : ''}
        </div>

        <div class="section-title"><h2>Фазы года</h2></div>
        <div class="stack">${PHASES.map(p => `
          <div class="card ${p.id === ph.id ? '' : 'card-flat'}"
               style="${p.id === ph.id ? 'border-left:4px solid var(--moss-600)' : ''}">
            <div class="row-between"><b>${p.id}. ${esc(p.title)}</b>
              <span class="pill">${p.from}–${p.to} нед.</span></div>
            <div class="cap" style="margin-top:4px">${esc(p.age)} · ${esc(p.task)}</div>
            <div class="cap" style="margin-top:6px;color:var(--warn-text)">Снимаем риск: ${esc(p.risk)}</div>
          </div>`).join('')}</div>

        <div class="section-title"><h2>52 недели</h2>
          <span class="cap">пройдено ${Math.max(0, cur.n - 1)}</span></div>
        <div class="stack">${WEEKS.map(w => weekRow(w, cur.n)).join('')}</div>
      </div>`,
    mount(root) { bind(root, {}); }
  };
}

function weekRow(w, curN) {
  const past = w.n < curN, now = w.n === curN;
  return `<div class="wk ${past ? 'wk-past' : ''} ${now ? 'wk-now' : ''}">
    <div class="wk-n">${past ? '✓' : w.n}</div>
    <div class="grow">
      <div style="font-weight:${now ? 600 : 400}">${esc(w.theme)}</div>
      <div class="cap">${w.age} нед. · ${esc(w.goal)}</div>
    </div>
  </div>`;
}
