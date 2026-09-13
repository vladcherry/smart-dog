import * as store from '../state.js';
import * as ws from '../walksession.js';
import { buildDay } from '../dayplan.js';
import { todayISO } from '../algo.js';
import { skillById } from '../training.js';
import { bind, esc, sheet, closeSheet, icon } from '../ui.js';
import { t, tn } from '../i18n/index.js';
import { skillName, skillWhat, skillGear, skillCriterion, skillSteps,
         stageInfoText, article } from '../i18n/content.js';
import { timerHtml, repLineHtml, paint, walkActs, startWalk } from '../walkui.js';

export default function walk(slot = 'am') {
  const s = store.get(), dog = s.dog, date = todayISO();
  const live = ws.get();
  if (live) slot = live.slot;                    // идущая прогулка главнее адреса в ссылке
  const log = store.dayLog(date);
  const kg = store.lastWeight()?.kg || 5;
  const day = buildDay(dog, s.skills, date, kg, log.treatsKcal || 0);
  const ev = day.events.find(e => e.id === 'walk-' + slot) || day.events.find(e => e.type === 'walk');
  const fin = !!live?.finished;
  let timer = null;

  return {
    html: `<div class="screen" style="padding-top:20px">
      <div class="row-between" style="margin-bottom:20px">
        <button class="btn-ghost" data-act="exit">${icon('back', 20)} ${t('Выйти')}</button>
        <span class="chip">${esc(ev.title)}</span>
      </div>

      <div class="card card-lg" style="text-align:center">
        ${timerHtml(live)}
        <div class="cap" style="margin-top:4px">${fin
          ? t('Таймер остановлен. Если реальное время другое — поправьте кнопками ± и сохраните.')
          : t('Цель: {min} мин · тренировка {train} мин', { min:ev.minutes, train:ev.trainMin })}</div>
        <div class="stage-bar" style="margin:16px 0"><i data-bar style="width:0%"></i></div>
        ${fin
          ? `<div class="btn-row">
               <button class="btn btn-sec" data-act="resume">${t('Продолжить прогулку')}</button>
               <button class="btn" data-act="save">${t('Сохранить и оценить')}</button></div>`
          : `<button class="btn" data-act="toggle" data-toggle></button>`}
        ${live && !fin ? `<div class="cap" style="margin-top:10px">${t('Можно выйти назад — таймер и повторы продолжат считаться.')}</div>` : ''}
      </div>

      <div class="section-title"><h2>${t('Тренировка')}</h2>
        <span class="cap">${t('{n} мин', { n:ev.trainMin })}</span></div>
      <div class="stack">${ev.training.map(item => trainCard(item, live)).join('') ||
        `<div class="card"><div class="cap">${t('Сегодня тренировка не запланирована — просто гуляйте.')}</div></div>`}</div>

      <div class="section-title" style="margin-bottom:8px"><h2>${t('Маркер')}</h2>
        <button class="btn-ghost" data-act="whatclick" style="min-height:32px">${t('Зачем это?')}</button></div>
      <button class="clicker" data-act="click">${t('Кликер')}</button>
      <div class="cap" style="text-align:center;margin-top:8px" data-clicks></div>

      <div class="section-title"><h2>${t('Отметки')}</h2></div>
      <div class="walk-actions">
        <button data-act="mark" data-m="pee" data-count="${live?.marks.pee || 0}">💧 ${t('Пописал')}</button>
        <button data-act="mark" data-m="poo" data-count="${live?.marks.poo || 0}">💩 ${t('Покакал')}</button>
        <button data-act="mark" data-m="dog" data-count="${live?.marks.dog || 0}">🐕 ${t('Встретили собаку')}</button>
        <button data-act="mark" data-m="fear" data-count="${live?.marks.fear || 0}">😨 ${t('Испугался')}</button>
      </div>

      ${fin ? '' : `<button class="btn" style="margin-top:24px" data-act="finish">${t('Завершить прогулку')}</button>`}
      <p class="cap" style="text-align:center;margin-top:12px">${t('В конце спросим оценку по каждому навыку')}</p>
    </div>`,

    mount(root) {
      timer = setInterval(() => paint(root, ev), 500);
      bind(root, {
        ...walkActs(root, ev, slot),
        how: el => howSheet(el.dataset.id),
        whatclick: () => clickerSheet(),
        mark: el => {
          if (!ws.get()) startWalk(slot);
          const w = ws.addMark(el.dataset.m);
          el.dataset.count = w.marks[el.dataset.m];
        },
        exit: () => { location.hash = '#/today'; }   // прогулка продолжает идти
      });
      paint(root, ev);
    },
    unmount() { clearInterval(timer); timer = null; }
  };
}

function trainCard(item, live) {
  const st = stageInfoText(item.stage);
  const id = item.skill.id;
  return `<div class="card" id="card-${id}">
    <div style="font-weight:600">${esc(skillName(id))}
      ${item.review ? `<span class="badge">${t('проверка')}</span>` : ''}</div>
    <div class="cap">${st.label} · ${t('сделайте {reps} за прогулку и отмечайте каждый кнопкой ниже',
      { reps: tn('повтор|повтора|повторов', item.reps) })}</div>
    <div class="cap" style="margin-top:10px;color:var(--text)">${esc(skillWhat(id))}</div>
    <div class="cap" style="margin-top:6px">${t('Понадобится: {gear}', { gear:esc(skillGear(id)) })}</div>
    <ol class="steps">${skillSteps(id).map(x => `<li>${esc(x)}</li>`).join('')}</ol>
    ${repLineHtml(item, live)}
    <button class="btn btn-sec btn-sm" style="margin-top:10px;width:100%"
      data-act="how" data-id="${id}">${t('Разобрать подробно')}</button>
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
