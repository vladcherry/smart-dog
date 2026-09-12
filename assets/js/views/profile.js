import * as store from '../state.js';
import { SKILLS, STAGES } from '../data/skills.js';
import { ageLabel, ageWeeks, ageMonths, predictAdultWeight, expectedWeight, growthStatus,
         feedingPlan, todayISO, round1, plural } from '../algo.js';
import { progressSummary, stageInfo, nextUnlockHint, skillById, MAX_POOL } from '../training.js';
import { BREEDS, GROUPS } from '../data/breeds.js';
import { bind, esc, sheet, closeSheet, toast, icon } from '../ui.js';
import { weightChart } from '../chart.js';
import { weighSheet } from './today.js';
import { openInstall, isStandalone } from '../install.js';

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
  const streak = store.streakDays(todayISO());
  const walks = s.walks.length;
  const hint = nextUnlockHint(s.skills, weeks);

  return {
    html: `<div class="screen-head"><div class="over">Профиль</div><h1>${esc(dog.name)}</h1>
      <div class="cap">${ageLabel(dog.birth)} · ${esc(breed?.name || 'порода не указана')} ·
        ${GROUPS[dog.group].label} (${GROUPS[dog.group].hint})</div></div>
      <div class="screen" style="padding-top:8px">

        <div class="kpi">
          <div><b class="num">${walks}</b><span>прогулок</span></div>
          <div><b class="num">${streak}</b><span>${plural(streak, 'день','дня','дней')} подряд</span></div>
          <div><b class="num">${sum.MASTERED + sum.MAINTENANCE}</b><span>навыков освоено</span></div>
        </div>

        <div class="section-title"><h2>Вес и рост</h2>
          <button class="btn-ghost" data-act="weigh">Взвесить</button></div>
        <div class="card">
          <div class="row-between">
            <div><div class="display num">${kg || '—'} кг</div>
              ${exp ? `<div class="cap">Ожидание: ${round1(exp)} кг</div>` : ''}</div>
            ${st ? `<span class="pill" style="background:var(--${st.tone}-bg);color:var(--${st.tone}-text)">${st.label}</span>` : ''}
          </div>
          ${weightChart(dog, s.weights)}
          ${pred ? `<div class="cap" style="margin-top:8px">Прогноз взрослого веса
            <b class="num">${pred.value} кг</b> (${pred.low}–${pred.high})</div>` : ''}
          ${st ? `<div class="cap" style="margin-top:6px">${esc(st.advice)}</div>` : ''}
        </div>

        <div class="section-title"><h2>Питание сейчас</h2></div>
        <div class="card">
          <div class="row-between"><span>Суточная норма</span><b class="num">${food.kcal} ккал</b></div>
          <div class="divider"></div>
          <div class="row-between"><span>Порция</span><b class="num">${food.perMeal} г × ${food.meals}</b></div>
          <div class="divider"></div>
          <div class="row-between"><span>Бюджет лакомств</span><b class="num">${food.treatBudget} ккал</b></div>
          <div class="cap" style="margin-top:10px">RER × коэффициент роста × активность × кондиция.
            Лакомства с тренировок вычитаются из дневной порции.</div>
        </div>

        <div class="section-title"><h2>Кондиция тела</h2></div>
        <div class="card">
          <div class="cap" style="margin-bottom:10px">Рёбра должны прощупываться под тонким слоем жира,
            сверху видна талия, сбоку — подтянутый живот.</div>
          <div class="seg">
            ${[['thin','Худая'],['ok','Норма'],['full','Полная'],['fat','Ожирение']].map(([k, l]) =>
              `<button data-act="bcs" data-v="${k}" aria-pressed="${(dog.bcs || 'ok') === k}">${l}</button>`).join('')}
          </div>
        </div>

        <div class="section-title"><h2>Полка навыков</h2>
          <span class="cap">${sum.LEARNING + sum.PRACTICE} из ${MAX_POOL} в работе</span></div>
        <div class="stack">
          ${STAGES.slice(1).reverse().map(stg => {
            const list = SKILLS.filter(x => STAGES[s.skills[x.id]?.stage ?? 0].id === stg.id);
            if (!list.length) return '';
            return `<div class="card card-flat">
              <div class="over" style="margin-bottom:8px">${stg.label} · ${list.length}</div>
              <div class="row" style="flex-wrap:wrap;gap:6px">
                ${list.map(x => `<button class="chip" data-act="skill" data-id="${x.id}"
                  style="cursor:pointer">${esc(x.name)}</button>`).join('')}
              </div></div>`;
          }).join('')}
          <div class="card card-flat">
            <div class="over" style="margin-bottom:6px">Следующий в очереди</div>
            ${hint ? `<b>${esc(hint.skill.name)}</b><div class="cap" style="margin-top:4px">
              ${hint.reason === 'age' ? `откроется в ${hint.weeks} недель`
              : hint.reason === 'prereq' ? `ждёт: ${hint.skill.prereq.map(p => esc(skillById(p).name)).join(', ')}`
              : 'откроется, как только освободится слот'}</div>` : '<div class="cap">Все навыки открыты</div>'}
          </div>
        </div>

        <div class="section-title"><h2>Настройки</h2></div>
        <div class="card">
          <button class="list-row" data-act="sched" style="width:100%;background:none;border:none;font:inherit;color:inherit;cursor:pointer">
            <span class="grow" style="text-align:left">Расписание и рекомендации</span>${icon('chevron', 18)}</button>
          <button class="list-row" data-act="edit" style="width:100%;background:none;border:none;font:inherit;color:inherit;cursor:pointer">
            <span class="grow" style="text-align:left">Данные собаки</span>${icon('chevron', 18)}</button>
          ${isStandalone()
            ? `<div class="list-row"><span class="grow">Приложение установлено</span>
                 <span class="pill" style="background:var(--ok-bg);color:var(--ok-text)">на экране</span></div>`
            : `<button class="list-row" data-act="install" style="width:100%;background:none;border:none;font:inherit;color:inherit;cursor:pointer">
                 <span class="grow" style="text-align:left">Установить на экран «Домой»</span>${icon('chevron', 18)}</button>`}
          <div class="list-row"><span class="grow">Тема</span>
            <div class="seg" style="flex:none">
              ${[['auto','Авто'],['light','Светлая'],['dark','Тёмная']].map(([k, l]) =>
                `<button data-act="theme" data-v="${k}" aria-pressed="${s.settings.theme === k}"
                  style="min-width:auto;min-height:40px;padding:0 12px;font-size:13px">${l}</button>`).join('')}
            </div></div>
        </div>

        <button class="btn btn-sec" style="margin-top:24px" data-act="reset">Начать заново</button>
        <p class="cap" style="margin-top:12px;text-align:center">Все данные хранятся только на этом устройстве.</p>
      </div>`,

    mount(root) {
      bind(root, {
        weigh: () => weighSheet(),
        install: () => openInstall(),
        skill: el => { location.hash = '#/skill/' + el.dataset.id; },
        sched: () => { location.hash = '#/schedule'; },
        bcs: el => { store.update(s => { s.dog.bcs = el.dataset.v; }); toast('Питание пересчитано'); setTimeout(() => location.reload(), 400); },
        theme: el => { store.update(s => { s.settings.theme = el.dataset.v; }); location.reload(); },
        edit: () => editSheet(),
        reset: () => {
          sheet(`<h2>Начать заново?</h2>
            <p class="cap" style="margin:8px 0 16px">Профиль, история веса, прогресс навыков и прогулки будут удалены
            с этого устройства. Отменить это нельзя.</p>
            <div class="btn-row"><button class="btn btn-sec" data-act="no">Отмена</button>
            <button class="btn" data-act="yes" style="background:var(--bad-fill)">Удалить всё</button></div>`, el => {
              el.querySelector('[data-act="no"]').onclick = closeSheet;
              el.querySelector('[data-act="yes"]').onclick = () => { store.reset(); closeSheet(); location.hash = '#/today'; location.reload(); };
            });
        }
      });
    }
  };
}

function editSheet() {
  const dog = store.get().dog;
  sheet(`<h2>Данные собаки</h2>
    <div style="margin-top:16px">
      <label class="field"><span>Кличка</span><input id="e-name" value="${esc(dog.name)}"></label>
      <label class="field"><span>Дата рождения</span><input type="date" id="e-birth" value="${dog.birth}"></label>
      <label class="field"><span>Порода</span><select id="e-breed">
        ${BREEDS.map(b => `<option value="${b.id}" ${dog.breed === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
      </select></label>
      <label class="field"><span>Размерная группа</span><select id="e-group">
        ${Object.entries(GROUPS).map(([k, g]) => `<option value="${k}" ${dog.group === k ? 'selected' : ''}>${g.label} — ${g.hint}</option>`).join('')}
      </select></label>
      <label class="field"><span>Ккал на 100 г корма</span>
        <input type="number" id="e-kcal" value="${dog.foodKcal || ''}" placeholder="370"></label>
      <div class="row" style="gap:12px">
        <label class="field grow"><span>Подъём</span><input type="time" id="e-wake" value="${dog.wake}"></label>
        <label class="field grow"><span>Отбой</span><input type="time" id="e-sleep" value="${dog.sleep}"></label>
      </div>
      <label class="field"><span>Стерилизация</span><select id="e-neu">
        ${[['no','Нет'],['plan','Планируется'],['yes','Да']].map(([k, l]) =>
          `<option value="${k}" ${dog.neutered === k ? 'selected' : ''}>${l}</option>`).join('')}
      </select></label>
    </div>
    <button class="btn" data-act="save">Сохранить и пересчитать</button>`, el => {
    el.querySelector('[data-act="save"]').addEventListener('click', () => {
      const v = id => el.querySelector('#' + id).value;
      store.update(s => {
        Object.assign(s.dog, {
          name: v('e-name').trim() || s.dog.name, birth: v('e-birth') || s.dog.birth,
          breed: v('e-breed'), group: v('e-group'), foodKcal: Number(v('e-kcal')) || null,
          wake: v('e-wake'), sleep: v('e-sleep'), neutered: v('e-neu')
        });
      });
      closeSheet(); toast('Профиль обновлён, план пересчитан');
      setTimeout(() => location.reload(), 500);
    });
  });
}
