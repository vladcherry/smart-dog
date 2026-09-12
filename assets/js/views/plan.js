import * as store from '../state.js';
import { WEEKS, PHASES, phaseOf, weekByAge, planFinished } from '../data/weeks.js';
import { ageWeeks, ageLabel } from '../algo.js';
import { bind, esc } from '../ui.js';
import { t, tn } from '../i18n/index.js';
import { weekTheme, weekGoal, phase, skillName } from '../i18n/content.js';

export default function plan() {
  const s = store.get(), dog = s.dog;
  const weeks = ageWeeks(dog.birth);
  const cur = weekByAge(weeks);
  const ph = phaseOf(cur.n);
  const phText = phase(ph.id);
  const done = planFinished(weeks);

  return {
    html: `<div class="screen-head"><div class="over">${t('Программа на год')}</div>
      <h1>${done ? t('Программа пройдена') : t('Неделя {n} из 52', { n:cur.n })}</h1>
      <div class="cap">${ageLabel(dog.birth)} · ${t('фаза «{title}»', { title:esc(phText.title) })}</div>
      <div class="cap" style="margin-top:8px">${t('Это недели программы, а не недели жизни собаки. Отсчёт идёт с появления щенка дома — с возраста 8 недель — и заканчивается примерно в 14 месяцев. У каждой недели своя тема и контрольная точка.')}</div></div>
      <div class="screen" style="padding-top:8px">
        ${done ? `<div class="banner banner-ok" style="margin-bottom:16px"><div>
          <b>${t('Год программы позади')}</b>${t('Новые команды больше не открываются по расписанию — дальше поддержка: освоенные навыки всплывают на проверку по интервалам, а новые можно брать вручную из учебника.')}</div></div>` : ''}
        <div class="card card-lg">
          <div class="over">${done ? t('Последняя неделя программы') : t('Тема недели')}</div>
          <h2 style="margin:6px 0 8px">${esc(weekTheme(cur.n))}</h2>
          <div class="banner banner-ok" style="margin-top:12px"><div>
            <b>${t('Контрольная точка')}</b>${esc(weekGoal(cur.n))}</div></div>
          ${cur.new.length ? `<div class="cap" style="margin-top:12px">${t('Открываются навыки:')}
            ${cur.new.map(id => esc(skillName(id))).join(', ')}</div>` : ''}
        </div>

        <div class="section-title"><h2>${t('Фазы года')}</h2></div>
        <div class="stack">${PHASES.map(p => phaseCard(p, ph.id)).join('')}</div>

        <div class="section-title"><h2>${t('52 недели')}</h2>
          <span class="cap">${t('пройдено {n}', { n:Math.max(0, cur.n - 1) })}</span></div>
        <div class="stack">${WEEKS.map(w => weekRow(w, cur.n)).join('')}</div>
      </div>`,
    mount(root) { bind(root, {}); }
  };
}

function phaseCard(p, curId) {
  const x = phase(p.id);
  return `<div class="card ${p.id === curId ? '' : 'card-flat'}"
       style="${p.id === curId ? 'border-left:4px solid var(--moss-600)' : ''}">
    <div class="row-between"><b>${p.id}. ${esc(x.title)}</b>
      <span class="pill">${t('{from}–{to} нед.', { from:p.from, to:p.to })}</span></div>
    <div class="cap" style="margin-top:4px">${esc(x.age)} · ${esc(x.task)}</div>
    <div class="cap" style="margin-top:6px;color:var(--warn-text)">${t('Снимаем риск: {risk}', { risk:esc(x.risk) })}</div>
  </div>`;
}

function weekRow(w, curN) {
  const past = w.n < curN, now = w.n === curN;
  return `<div class="wk ${past ? 'wk-past' : ''} ${now ? 'wk-now' : ''}">
    <div class="wk-n">${past ? '✓' : w.n}</div>
    <div class="grow">
      <div style="font-weight:${now ? 600 : 400}">${esc(weekTheme(w.n))}</div>
      <div class="cap">${tn('неделя|недели|недель', w.age)} · ${esc(weekGoal(w.n))}</div>
    </div>
  </div>`;
}
