import { CATEGORY_IDS } from '../data/articles.js';
import { bind, esc, icon } from '../ui.js';
import * as store from '../state.js';
import { ageWeeks } from '../algo.js';
import { phaseOf, weekByAge } from '../data/weeks.js';
import { skillById } from '../training.js';
import { t } from '../i18n/index.js';
import { article, articlesAll, categoryName, skillName, stageLabel } from '../i18n/content.js';

export default function book(id) {
  return id ? articleView(id) : list();
}

function list() {
  const dog = store.get().dog;
  const curPhase = dog ? phaseOf(weekByAge(ageWeeks(dog.birth)).n).id : 1;
  const all = articlesAll();
  return {
    html: `<div class="screen-head"><div class="over">${t('Учебник')}</div><h1>${t('Как учить')}</h1>
      <div class="cap">${t('10 статей с пошаговыми протоколами. Критерий «навык освоен» совпадает с оценкой «отлично» в тренировке.')}</div></div>
      <div class="screen" style="padding-top:8px">
      ${CATEGORY_IDS.map(cat => {
        const items = all.filter(a => a.cat === cat);
        if (!items.length) return '';
        return `<div class="section-title"><h2>${esc(categoryName(cat))}</h2></div>
        <div class="stack">${items.map(a => `
          <button class="card art" data-act="open" data-id="${a.id}"
            style="width:100%;text-align:left;border:none;font:inherit;color:inherit;cursor:pointer">
            <div class="art-cover">${a.icon}</div>
            <div class="grow">
              <div style="font-weight:600;line-height:20px">${esc(a.title)}</div>
              <div class="cap" style="margin-top:4px">${esc(a.subtitle)}</div>
              <div class="row" style="margin-top:8px;gap:6px">
                <span class="pill">${t('{n} мин', { n:a.min })}</span>
                ${a.phase === curPhase ? `<span class="pill" style="background:var(--moss-100);color:var(--moss-800)">${t('актуально сейчас')}</span>` : ''}
              </div>
            </div>
          </button>`).join('')}</div>`;
      }).join('')}
      </div>`,
    mount(root) { bind(root, { open: el => { location.hash = '#/book/' + el.dataset.id; } }); }
  };
}

function articleView(id) {
  const a = article(id);
  if (!a || !a.title) return { html:`<div class="screen"><p>${t('Статья не найдена')}</p></div>`, mount(){} };
  return {
    html: `<div class="screen" style="padding-top:20px">
      <button class="btn-ghost" data-act="back" style="margin-bottom:12px">${icon('back', 20)} ${t('Учебник')}</button>
      <div style="font-size:44px">${a.icon}</div>
      <h1 style="margin-top:8px">${esc(a.title)}</h1>
      <p class="muted" style="margin-top:8px">${esc(a.subtitle)}</p>
      <div class="row" style="gap:6px;flex-wrap:wrap;margin:16px 0">
        <span class="pill">${t('{n} мин чтения', { n:a.min })}</span>
        <span class="pill">${esc(a.meta.start)}</span>
        <span class="pill">${esc(a.meta.dur)}</span>
      </div>
      <div class="card card-flat"><b>${t('Зачем это нужно')}</b>
        <p style="margin:8px 0 0">${esc(a.why)}</p></div>
      <div class="cap" style="margin-top:12px">${t('Понадобится: {gear}', { gear:esc(a.meta.need) })}</div>

      <div class="prose">
        <h3>${t('Протокол по шагам')}</h3>
        ${a.steps.map((s, i) => `<div class="step">
          <b>${t('Шаг {n}. {title}', { n:i + 1, title:esc(s.t) })}</b>
          <div>${esc(s.d)}</div>
          <div class="cap" style="margin-top:6px">${t('Переходим дальше, когда: {c}', { c:esc(s.c) })}</div>
        </div>`).join('')}

        <h3>${t('Как усложнять')}</h3>
        <p>${esc(a.harder)}</p>

        <h3>${t('Частые ошибки')}</h3>
        <ul>${a.mistakes.map(m => `<li>${esc(m)}</li>`).join('')}</ul>

        <h3>${t('Если не получается')}</h3>
        <p>${esc(a.fails)}</p>
      </div>

      <div class="banner banner-ok"><div><b>${t('Навык освоен, когда')}</b>${esc(a.check)}</div></div>
      ${a.skills.length ? `<div class="section-title"><h2>${t('Навыки из статьи')}</h2></div>
        <div class="stack">${a.skills.map(sid => skillLink(sid)).join('')}</div>` : ''}
      </div>`,
    mount(root) {
      bind(root, {
        back: () => { location.hash = '#/book'; },
        skill: el => { location.hash = '#/skill/' + el.dataset.id; }
      });
    }
  };
}

function skillLink(sid) {
  if (!skillById(sid)) return '';
  const p = store.get().skills?.[sid];
  return `<button class="skill" data-act="skill" data-id="${sid}">
    <div class="grow"><div style="font-weight:600">${esc(skillName(sid))}</div>
      <div class="cap">${p ? esc(stageLabel(p.stage)) : t('появится по возрасту')}</div></div>
    <span style="color:var(--text-3)">›</span></button>`;
}
