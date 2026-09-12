import * as store from '../state.js';
import { skillById, stageInfo, MAX_LEARNING, MAX_POOL } from '../training.js';
import { STAGES, RATINGS } from '../data/skills.js';
import { articleById } from '../data/articles.js';
import { bind, esc, icon } from '../ui.js';

export default function skillView(id) {
  const s = store.get();
  const sk = skillById(id);
  if (!sk) return { html:'<div class="screen"><p>Навык не найден</p></div>', mount(){} };
  const p = s.skills[id] || { stage:0, streak:0, ratings:[] };
  const st = stageInfo(p.stage);
  const art = articleById(sk.article);
  const last = [...(p.ratings || [])].reverse().slice(0, 12);

  return {
    html: `<div class="screen" style="padding-top:20px">
      <div class="row-between" style="margin-bottom:12px">
        <button class="btn-ghost" data-act="back">${icon('back', 20)} Назад</button>
        <button class="btn-ghost" data-act="all">Все команды</button>
      </div>
      <div class="over">${esc(st.label)}</div>
      <h1 style="margin-top:4px">${esc(sk.name)}</h1>

      <div class="card card-lg" style="margin-top:16px">
        <div class="row-between"><span class="cap">Серия пятёрок</span>
          <div class="dots">${[0,1,2,3,4].map(i => `<i class="dot ${i < p.streak ? 'dot-on' : ''}"></i>`).join('')}</div></div>
        <div class="divider"></div>
        <div class="row-between"><span class="cap">Повторов за сессию</span><b class="num">${st.reps}</b></div>
        <div class="divider"></div>
        <div class="row-between"><span class="cap">Частота</span><b>${esc(st.freq)}</b></div>
        ${p.nextReview ? `<div class="divider"></div>
          <div class="row-between"><span class="cap">Следующая проверка</span><b>${p.nextReview}</b></div>` : ''}
      </div>

      <div class="section-title"><h2>Стадии</h2></div>
      <div class="stack">${STAGES.slice(1).map((x, i) => `
        <div class="card ${i + 1 === p.stage ? '' : 'card-flat'}"
          style="${i + 1 === p.stage ? 'border-left:4px solid var(--brand)' : ''}">
          <div class="row-between"><b>${esc(x.label)}</b><span class="pill">${x.reps} повторов</span></div>
          <div class="cap" style="margin-top:4px">${esc(x.freq)}</div>
        </div>`).join('')}</div>
      <p class="cap" style="margin-top:12px">Пять оценок «отлично» подряд (минимум в три разных дня)
        поднимают стадию: повторов становится меньше, а освободившийся слот
        занимает следующая команда из плана. Одновременно изучаем не больше ${MAX_LEARNING} новых команд, всего в работе — до ${MAX_POOL}.</p>

      <div class="section-title"><h2>Как тренировать</h2></div>
      <div class="card">${sk.steps.map((x, i) => `<div class="step"><b>Шаг ${i + 1}</b>${esc(x)}</div>`).join('')}</div>

      <div class="banner banner-ok" style="margin-top:12px"><div>
        <b>Оценка «отлично»</b>${esc(sk.criterion)}</div></div>

      ${last.length ? `<div class="section-title"><h2>История оценок</h2></div>
        <div class="card"><div class="row" style="gap:6px;flex-wrap:wrap">
        ${last.map(r => { const c = RATINGS[r.r - 1];
          return `<span class="pill" style="background:${c.color}22;color:${c.color === '#4C8B59' ? 'var(--ok-text)' : 'var(--text)'}"
            title="${r.d}">${r.r}</span>`; }).join('')}
        </div><div class="cap" style="margin-top:8px">Последние оценки, свежие слева</div></div>` : ''}

      ${art ? `<button class="card art" data-act="article" data-id="${art.id}" style="width:100%;margin-top:16px;
        text-align:left;border:none;font:inherit;color:inherit;cursor:pointer">
        <div class="art-cover">${art.icon}</div>
        <div class="grow"><div style="font-weight:600">${esc(art.title)}</div>
        <div class="cap" style="margin-top:4px">Подробный протокол и частые ошибки</div></div></button>` : ''}
      </div>`,
    mount(root) {
      bind(root, {
        back: () => history.length > 1 ? history.back() : (location.hash = '#/today'),
        all: () => { location.hash = '#/skills'; },
        article: el => { location.hash = '#/book/' + el.dataset.id; }
      });
    }
  };
}
