import * as store from '../state.js';
import { SKILLS, STAGES } from '../data/skills.js';
import { ageLabel, ageWeeks, ageMonths, predictAdultWeight, expectedWeight, growthStatus,
         feedingPlan, todayISO, round1, effectiveSchedule } from '../algo.js';
import { progressSummary, stageInfo, nextUnlockHint, skillById, MAX_POOL } from '../training.js';
import { BREEDS, GROUPS } from '../data/breeds.js';
import { bind, esc, sheet, closeSheet, toast, icon, pickPhoto, avatarHtml } from '../ui.js';
import { weightChart } from '../chart.js';
import { weighSheet } from './today.js';
import { openInstall, isStandalone } from '../install.js';
import { VERSION, BUILD } from '../version.js';
import { t, tn, LANGS, getLang, setLang } from '../i18n/index.js';
import { skillName, stageLabel, breedName, group as groupText } from '../i18n/content.js';

export default function profile() {
  const s = store.get(), dog = s.dog;
  const weeks = ageWeeks(dog.birth), months = ageMonths(dog.birth);
  const kg = store.lastWeight()?.kg || 0;
  const pred = predictAdultWeight(dog, s.weights);
  const exp = pred ? expectedWeight(pred.value, weeks, dog.group) : null;
  const st = exp ? growthStatus(kg, exp) : null;
  const food = feedingPlan(dog, kg || 5);
  const sum = progressSummary(s.skills);
  const breed = BREEDS.find(b => b.id === dog.breed);
  const grp = groupText(dog.group);
  const streak = store.streakDays(todayISO());
  const walks = s.walks.length;
  const hint = nextUnlockHint(s.skills, weeks);
  const eff = effectiveSchedule(dog);

  return {
    html: `<div class="screen-head">
      <div class="row" style="gap:14px">
        <button data-act="photo" style="border:none;background:none;padding:0;cursor:pointer"
          aria-label="${t('Сменить фото')}">${avatarHtml(dog, 'avatar avatar-lg')}</button>
        <div class="grow">
          <div class="over">${t('Профиль')}</div><h1>${esc(dog.name)}</h1>
          <div class="cap">${ageLabel(dog.birth)} · ${esc(breed ? breedName(breed.id) : t('порода не указана'))} ·
            ${esc(grp.label)} (${esc(grp.hint)})</div>
        </div>
      </div></div>
      <div class="screen" style="padding-top:8px">

        <div class="kpi">
          <div><b class="num">${walks}</b><span>${t('прогулок')}</span></div>
          <div><b class="num">${streak}</b><span>${t('{days} подряд', { days: tn('день|дня|дней', streak) })}</span></div>
          <div><b class="num">${sum.MASTERED + sum.MAINTENANCE}</b><span>${t('навыков освоено')}</span></div>
        </div>

        <button class="card row" data-act="sched" style="width:100%;text-align:left;cursor:pointer;
          font:inherit;color:inherit;border:1px solid var(--divider);margin-top:24px">
          <div class="ev-icon" style="--ev:var(--health)">⏰</div>
          <div class="grow">
            <div style="font-weight:600">${t('Расписание дня')}</div>
            <div class="cap">${t('Выгул {am} и {pm} по {min} мин · {meals}: {times}',
              { am:eff.walkAm, pm:eff.walkPm, min:eff.walkMin,
                meals: tn('кормление|кормления|кормлений', eff.meals.length), times: eff.meals.join(', ') })}</div>
          </div>
          <span style="color:var(--text-3)">${icon('chevron', 18)}</span>
        </button>

        <div class="section-title"><h2>${t('Вес и рост')}</h2>
          <button class="btn-ghost" data-act="weigh">${t('Взвесить')}</button></div>
        <div class="card">
          <div class="row-between">
            <div><div class="display num">${kg ? t('{kg} кг', { kg }) : '—'}</div>
              ${exp ? `<div class="cap">${t('Ожидание: {kg} кг', { kg:round1(exp) })}</div>` : ''}</div>
            ${st ? `<span class="pill" style="background:var(--${st.tone}-bg);color:var(--${st.tone}-text)">${st.label}</span>` : ''}
          </div>
          ${weightChart(dog, s.weights)}
          ${pred ? `<div class="cap" style="margin-top:8px">${t('Прогноз взрослого веса:')}
            <b class="num">${t('{kg} кг', { kg:pred.value })}</b> (${pred.low}–${pred.high})</div>` : ''}
          ${st ? `<div class="cap" style="margin-top:6px">${esc(st.advice)}</div>` : ''}
        </div>

        <div class="section-title"><h2>${t('Питание сейчас')}</h2></div>
        <div class="card">
          <div class="row-between"><span>${t('Суточная норма')}</span><b class="num">${t('{n} ккал', { n:food.kcal })}</b></div>
          <div class="divider"></div>
          <div class="row-between"><span>${t('Порция')}</span><b class="num">${t('{g} г × {n}', { g:food.perMeal, n:food.meals })}</b></div>
          <div class="divider"></div>
          <div class="row-between"><span>${t('Бюджет лакомств')}</span><b class="num">${t('{n} ккал', { n:food.treatBudget })}</b></div>
          <div class="cap" style="margin-top:10px">${t('RER × коэффициент роста × активность × кондиция. Лакомства с тренировок вычитаются из дневной порции.')}</div>
        </div>

        <div class="section-title"><h2>${t('Кондиция тела')}</h2></div>
        <div class="card">
          <div class="cap" style="margin-bottom:10px">${t('Рёбра должны прощупываться под тонким слоем жира, сверху видна талия, сбоку — подтянутый живот.')}</div>
          <div class="seg">
            ${[['thin',t('Худая')],['ok',t('Норма')],['full',t('Полная')],['fat',t('Ожирение')]].map(([k, l]) =>
              `<button data-act="bcs" data-v="${k}" aria-pressed="${(dog.bcs || 'ok') === k}">${l}</button>`).join('')}
          </div>
        </div>

        <div class="section-title"><h2>${t('Полка навыков')}</h2>
          <button class="btn-ghost" data-act="allskills" style="min-height:32px">${t('Все команды')}</button></div>
        <div class="cap" style="margin:-8px 0 12px">${t('{n} из {pool} в работе, всего в программе {all}',
          { n:sum.LEARNING + sum.PRACTICE, pool:MAX_POOL, all:Object.values(sum).reduce((a, b) => a + b, 0) })}</div>
        <div class="stack">
          ${STAGES.slice(1).reverse().map(stg => {
            const list = SKILLS.filter(x => STAGES[s.skills[x.id]?.stage ?? 0].id === stg.id);
            if (!list.length) return '';
            return `<div class="card card-flat">
              <div class="over" style="margin-bottom:8px">${esc(stageLabel(STAGES.indexOf(stg)))} · ${list.length}</div>
              <div class="row" style="flex-wrap:wrap;gap:6px">
                ${list.map(x => `<button class="chip" data-act="skill" data-id="${x.id}"
                  style="cursor:pointer">${esc(skillName(x.id))}</button>`).join('')}
              </div></div>`;
          }).join('')}
          <div class="card card-flat">
            <div class="over" style="margin-bottom:6px">${t('Следующий в очереди')}</div>
            ${hint ? `<b>${esc(skillName(hint.skill.id))}</b><div class="cap" style="margin-top:4px">
              ${hint.reason === 'age' ? t('откроется в {weeks}', { weeks: tn('неделю|недели|недель', hint.weeks) })
              : hint.reason === 'prereq' ? t('ждёт: {list}', { list: hint.skill.prereq.map(p => esc(skillName(p))).join(', ') })
              : t('откроется, как только освободится слот')}</div>` : `<div class="cap">${t('Все навыки открыты')}</div>`}
          </div>
        </div>

        <div class="section-title"><h2>${t('Настройки')}</h2></div>
        <div class="card">
          <button class="list-row" data-act="edit" style="width:100%">
            <span class="grow" style="text-align:left">${t('Данные собаки')}</span>${icon('chevron', 18)}</button>
          ${isStandalone()
            ? `<div class="list-row"><span class="grow">${t('Приложение установлено')}</span>
                 <span class="pill" style="background:var(--ok-bg);color:var(--ok-text)">${t('на экране')}</span></div>`
            : `<button class="list-row" data-act="install" style="width:100%">
                 <span class="grow" style="text-align:left">${t('Установить на экран «Домой»')}</span>${icon('chevron', 18)}</button>`}
          <div class="list-row" style="align-items:flex-start;flex-direction:column;gap:8px">
            <span class="grow">${t('Язык')}</span>
            <div class="seg" style="width:100%">
              ${LANGS.map(l => `<button data-act="lang" data-v="${l.code}" aria-pressed="${getLang() === l.code}"
                style="min-height:44px;font-size:13px">${l.flag} ${l.name}</button>`).join('')}
            </div></div>
          <div class="list-row"><span class="grow">${t('Тема')}</span>
            <div class="seg" style="flex:none">
              ${[['auto',t('Авто')],['light',t('Светлая')],['dark',t('Тёмная')]].map(([k, l]) =>
                `<button data-act="theme" data-v="${k}" aria-pressed="${s.settings.theme === k}"
                  style="min-width:auto;min-height:40px;padding:0 12px;font-size:13px">${l}</button>`).join('')}
            </div></div>
        </div>

        <div class="section-title"><h2>${t('О приложении')}</h2></div>
        <div class="card">
          <div class="row-between"><span class="cap">${t('Версия')}</span>
            <b class="num">${VERSION}</b></div>
          <div class="divider"></div>
          <div class="row-between"><span class="cap">${t('Сборка')}</span>
            <b>${BUILD.split('-').reverse().join('.')}</b></div>
          <div class="divider"></div>
          <button class="list-row" data-act="update" style="width:100%">
            <span class="grow" style="text-align:left">${t('Проверить обновление')}</span>${icon('chevron', 18)}</button>
          <div class="cap">${t('Приложение обновляется само при запуске с интернетом. Кнопка нужна, если версия застряла: она сбрасывает офлайн-кэш и перезагружает. Профиль, вес и прогресс при этом остаются.')}</div>
        </div>

        <button class="btn btn-sec" style="margin-top:24px" data-act="reset">${t('Начать заново')}</button>
        <p class="cap" style="margin-top:12px;text-align:center">${t('Все данные хранятся только на этом устройстве.')}</p>
      </div>`,

    mount(root) {
      bind(root, {
        weigh: () => weighSheet(),
        install: () => openInstall(),
        skill: el => { location.hash = '#/skill/' + el.dataset.id; },
        sched: () => { location.hash = '#/schedule'; },
        allskills: () => { location.hash = '#/skills'; },
        bcs: el => { store.update(s => { s.dog.bcs = el.dataset.v; }); toast(t('Питание пересчитано')); setTimeout(() => location.reload(), 400); },
        theme: el => { store.update(s => { s.settings.theme = el.dataset.v; }); location.reload(); },
        lang: async el => { await setLang(el.dataset.v); location.reload(); },
        edit: () => editSheet(),
        photo: () => photoSheet(),
        update: () => refresh(),
        reset: () => {
          sheet(`<h2>${t('Начать заново?')}</h2>
            <p class="cap" style="margin:8px 0 16px">${t('Профиль, история веса, прогресс навыков и прогулки будут удалены с этого устройства. Отменить это нельзя.')}</p>
            <div class="btn-row"><button class="btn btn-sec" data-act="no">${t('Отмена')}</button>
            <button class="btn" data-act="yes" style="background:var(--bad-fill)">${t('Удалить всё')}</button></div>`, el => {
              el.querySelector('[data-act="no"]').onclick = closeSheet;
              el.querySelector('[data-act="yes"]').onclick = () => { store.reset(); closeSheet(); location.hash = '#/today'; location.reload(); };
            });
        }
      });
    }
  };
}

/** Фото собаки: снять на камеру, выбрать из галереи или убрать */
function photoSheet() {
  const dog = store.get().dog;
  sheet(`
    <h2>${t('Фото собаки')}</h2>
    <div style="display:flex;justify-content:center;margin:16px 0">${avatarHtml(dog, 'avatar avatar-xl')}</div>
    <p class="cap" style="margin-bottom:16px">${t('Фото хранится только на этом устройстве и никуда не отправляется.')}</p>
    <button class="btn" data-i="pick">${dog.photo ? t('Заменить фото') : t('Сделать фото или выбрать из галереи')}</button>
    ${dog.photo ? `<button class="btn btn-sec" style="margin-top:12px" data-i="drop">${t('Убрать фото')}</button>` : ''}
  `, el => {
    el.querySelector('[data-i="pick"]').addEventListener('click', async () => {
      const data = await pickPhoto();
      if (!data) return;
      store.update(s => { s.dog.photo = data; });
      closeSheet(); toast(t('Фото обновлено'));
      setTimeout(() => location.reload(), 400);
    });
    el.querySelector('[data-i="drop"]')?.addEventListener('click', () => {
      store.update(s => { s.dog.photo = null; });
      closeSheet(); setTimeout(() => location.reload(), 300);
    });
  });
}

/** Принудительное обновление: снимаем воркер, чистим кэш, перезагружаем. Данные не трогаем. */
async function refresh() {
  toast(t('Обновляем…'));
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
    if (window.caches) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  } catch {}
  setTimeout(() => location.reload(), 600);
}

function editSheet() {
  const dog = store.get().dog;
  sheet(`<h2>${t('Данные собаки')}</h2>
    <div class="row" style="gap:14px;margin-top:16px">
      ${avatarHtml(dog, 'avatar avatar-lg')}
      <button class="btn btn-sec btn-sm grow" data-act="photo2">
        ${dog.photo ? t('Заменить фото') : t('Сделать фото или выбрать из галереи')}</button>
    </div>
    <div style="margin-top:16px">
      <label class="field"><span>${t('Кличка')}</span><input id="e-name" value="${esc(dog.name)}"></label>
      <label class="field"><span>${t('Дата рождения')}</span><input type="date" id="e-birth" value="${dog.birth}"></label>
      <label class="field"><span>${t('Порода')}</span><select id="e-breed">
        ${BREEDS.map(b => `<option value="${b.id}" ${dog.breed === b.id ? 'selected' : ''}>${esc(breedName(b.id))}</option>`).join('')}
      </select></label>
      <label class="field"><span>${t('Размерная группа')}</span><select id="e-group">
        ${Object.keys(GROUPS).map(k => { const g = groupText(k);
          return `<option value="${k}" ${dog.group === k ? 'selected' : ''}>${esc(g.label)} — ${esc(g.hint)}</option>`; }).join('')}
      </select></label>
      <label class="field"><span>${t('Ккал на 100 г корма')}</span>
        <input type="number" id="e-kcal" value="${dog.foodKcal || ''}" placeholder="370"></label>
      <div class="row" style="gap:12px">
        <label class="field grow"><span>${t('Подъём')}</span><input type="time" id="e-wake" value="${dog.wake}"></label>
        <label class="field grow"><span>${t('Отбой')}</span><input type="time" id="e-sleep" value="${dog.sleep}"></label>
      </div>
      <label class="field"><span>${t('Стерилизация')}</span><select id="e-neu">
        ${[['no',t('Нет')],['plan',t('Планируется')],['yes',t('Да')]].map(([k, l]) =>
          `<option value="${k}" ${dog.neutered === k ? 'selected' : ''}>${l}</option>`).join('')}
      </select></label>
    </div>
    <button class="btn" data-act="save">${t('Сохранить и пересчитать')}</button>`, el => {
    el.querySelector('[data-act="photo2"]').addEventListener('click', async () => {
      const data = await pickPhoto();
      if (!data) return;
      store.update(s => { s.dog.photo = data; });
      closeSheet(); toast(t('Фото обновлено'));
      setTimeout(() => location.reload(), 400);
    });
    el.querySelector('[data-act="save"]').addEventListener('click', () => {
      const v = id => el.querySelector('#' + id).value;
      store.update(s => {
        Object.assign(s.dog, {
          name: v('e-name').trim() || s.dog.name, birth: v('e-birth') || s.dog.birth,
          breed: v('e-breed'), group: v('e-group'), foodKcal: Number(v('e-kcal')) || null,
          wake: v('e-wake'), sleep: v('e-sleep'), neutered: v('e-neu')
        });
      });
      closeSheet(); toast(t('Профиль обновлён, план пересчитан'));
      setTimeout(() => location.reload(), 500);
    });
  });
}
