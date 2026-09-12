import { BREEDS, GROUPS, FOOD_TYPES } from '../data/breeds.js';
import { SKILLS } from '../data/skills.js';
import * as store from '../state.js';
import { initSkills, unlockNext } from '../training.js';
import { todayISO, ageWeeks, ageMonths, feedingsPerDay, walkMinutes, recommendedSchedule,
         feedingPlan, trainingMinutes } from '../algo.js';
import { bind, esc, sheet, closeSheet } from '../ui.js';

const EMOJI = ['🐶','🐕','🦮','🐩','🐕‍🦺','🐺'];
let step = 1;
let draft = { emoji:'🐶', sex:'m', neutered:'no', activity:'mid', foodType:'dry',
              wake:'07:00', sleep:'22:30', known:[] };
const TOTAL = 8;

export default function onboarding() {
  return { html: shell(), mount };
}

function shell() {
  return `<div class="screen" id="ob">${body()}</div>`;
}

function head(title, sub) {
  return `<div style="margin-bottom:24px">
    <div class="over">Шаг ${step} из ${TOTAL}</div>
    <div class="stage-bar" style="margin:8px 0 16px"><i style="width:${step / TOTAL * 100}%"></i></div>
    <h1>${title}</h1>
    ${sub ? `<p class="muted" style="margin-top:8px">${sub}</p>` : ''}
  </div>`;
}

function nav(okLabel = 'Далее', disabled = false) {
  return `<div class="btn-row" style="margin-top:32px">
    ${step > 1 ? '<button class="btn btn-sec" data-act="back">Назад</button>' : ''}
    <button class="btn" data-act="next" ${disabled ? 'disabled' : ''}>${okLabel}</button>
  </div>`;
}

function body() {
  switch (step) {
    case 1: return head('Как зовут щенка?', 'С этого начинается всё — и план, и обучение.') + `
      <label class="field"><span>Кличка</span>
        <input id="f-name" value="${esc(draft.name || '')}" placeholder="Рекс" autocomplete="off"></label>
      <label class="field"><span>Аватар</span></label>
      <div class="seg">${EMOJI.map(e => `<button data-act="emoji" data-v="${e}"
        aria-pressed="${draft.emoji === e}" style="font-size:24px">${e}</button>`).join('')}</div>
      ` + nav();

    case 2: return head('Когда родился?', 'Возраст — главный вход всех расчётов: и нагрузки, и порции, и тренировок.') + `
      <label class="field"><span>Дата рождения</span>
        <input type="date" id="f-birth" value="${draft.birth || ''}" max="${todayISO()}"></label>
      <p class="cap">Не знаете точно? Поставьте примерную дату — план можно пересчитать позже.</p>
      <div class="seg" style="margin-top:12px">
        ${[2,3,4,6,9].map(m => `<button data-act="approx" data-v="${m}">${m} мес.</button>`).join('')}
      </div>` + nav('Далее', !draft.birth);

    case 3: return head('Порода', 'От размерной группы зависит кривая роста и предел нагрузки на суставы.') + `
      <label class="field"><span>Порода</span>
        <select id="f-breed">${BREEDS.map(b => `<option value="${b.id}"
          ${draft.breed === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}</select></label>
      <label class="field"><span>Размерная группа</span></label>
      <div class="seg">${Object.entries(GROUPS).map(([k, g]) => `<button data-act="group" data-v="${k}"
        aria-pressed="${draft.group === k}">${g.label}<br><span class="cap">${g.hint}</span></button>`).join('')}</div>
      ` + nav('Далее', !draft.group);

    case 4: return head('Пол и стерилизация', 'Влияет на прогноз взрослого веса и на коэффициент калорий.') + `
      <label class="field"><span>Пол</span></label>
      <div class="seg">
        <button data-act="sex" data-v="m" aria-pressed="${draft.sex === 'm'}">Кобель</button>
        <button data-act="sex" data-v="f" aria-pressed="${draft.sex === 'f'}">Сука</button></div>
      <label class="field" style="margin-top:24px"><span>Стерилизация / кастрация</span></label>
      <div class="seg">
        <button data-act="neu" data-v="no" aria-pressed="${draft.neutered === 'no'}">Нет</button>
        <button data-act="neu" data-v="plan" aria-pressed="${draft.neutered === 'plan'}">Планируется</button>
        <button data-act="neu" data-v="yes" aria-pressed="${draft.neutered === 'yes'}">Да</button></div>
      ` + nav();

    case 5: return head('Сколько весит сейчас?', 'Взвесьте на обычных весах: возьмите собаку на руки и вычтите свой вес.') + `
      <label class="field"><span>Вес, кг</span>
        <input type="number" step="0.1" min="0.5" max="120" id="f-weight" inputmode="decimal"
          value="${draft.weight || ''}" placeholder="8.4"></label>
      ` + nav('Далее', !draft.weight);

    case 6: return head('Чем кормите?', 'Нужна калорийность, чтобы перевести калории в граммы. Она написана на упаковке.') + `
      <label class="field"><span>Тип корма</span></label>
      <div class="seg">${Object.entries(FOOD_TYPES).map(([k, f]) => `<button data-act="food" data-v="${k}"
        aria-pressed="${draft.foodType === k}">${f.label}</button>`).join('')}</div>
      <label class="field" style="margin-top:24px"><span>Ккал на 100 г — если знаете</span>
        <input type="number" id="f-kcal" inputmode="numeric" value="${draft.foodKcal || ''}"
          placeholder="${FOOD_TYPES[draft.foodType].kcal}"></label>
      <p class="cap">Пусто — возьмём среднее ${FOOD_TYPES[draft.foodType].kcal} ккал/100 г и пометим расчёт как приблизительный.</p>
      ` + nav();

    case 7: return head('Режим дня', 'Приложение расставит выгул и кормления вокруг вашего распорядка.') + `
      <label class="field"><span>Уровень активности</span></label>
      <div class="seg">
        <button data-act="act" data-v="low" aria-pressed="${draft.activity === 'low'}">Низкий</button>
        <button data-act="act" data-v="mid" aria-pressed="${draft.activity === 'mid'}">Средний</button>
        <button data-act="act" data-v="high" aria-pressed="${draft.activity === 'high'}">Высокий</button></div>
      <div class="row" style="margin-top:24px;gap:12px">
        <label class="field grow"><span>Подъём</span>
          <input type="time" id="f-wake" value="${draft.wake}"></label>
        <label class="field grow"><span>Отбой</span>
          <input type="time" id="f-sleep" value="${draft.sleep}"></label>
      </div>` + nav();

    case 8: {
      const weeks = draft.birth ? ageWeeks(draft.birth) : 8;
      const avail = SKILLS.filter(s => s.minWeeks <= weeks + 4).slice(0, 12);
      return head('Что уже умеет?', 'Отметьте то, что стабильно работает дома. Остальное начнём с нуля.') + `
      <div class="stack">${avail.map(s => `<label class="check">
        <input type="checkbox" data-act="known" data-v="${s.id}" ${draft.known.includes(s.id) ? 'checked' : ''}>
        <span>${s.name}</span></label>`).join('')}</div>
      <p class="cap" style="margin-top:16px">Ничего страшного, если список пустой — так начинают почти все.</p>
      ` + nav('Собрать план');
    }
  }
}

function mount(root) {
  const ob = root.querySelector('#ob');
  bind(ob, {
    next: () => { if (collect()) { step = Math.min(TOTAL, step + 1); rerender(root); } },
    back: () => { collect(true); step = Math.max(1, step - 1); rerender(root); },
    emoji: el => { draft.emoji = el.dataset.v; rerender(root); },
    group: el => { draft.group = el.dataset.v; rerender(root); },
    sex:   el => { draft.sex = el.dataset.v; rerender(root); },
    neu:   el => { draft.neutered = el.dataset.v; rerender(root); },
    food:  el => { draft.foodType = el.dataset.v; rerender(root); },
    act:   el => { draft.activity = el.dataset.v; rerender(root); },
    approx: el => {
      const d = new Date(); d.setMonth(d.getMonth() - Number(el.dataset.v));
      draft.birth = todayISO(d); rerender(root);
    },
    known: el => {
      const id = el.dataset.v;
      draft.known = el.checked ? [...new Set([...draft.known, id])] : draft.known.filter(x => x !== id);
    }
  });
  const breed = ob.querySelector('#f-breed');
  if (breed) {
    if (!draft.breed) { draft.breed = breed.value; const b = BREEDS.find(x => x.id === breed.value); if (b?.group) draft.group = b.group; }
    breed.addEventListener('change', () => {
      draft.breed = breed.value;
      const b = BREEDS.find(x => x.id === breed.value);
      if (b?.group) draft.group = b.group;
      rerender(root);
    });
  }
  const birth = ob.querySelector('#f-birth');
  birth?.addEventListener('change', () => { draft.birth = birth.value; rerender(root); });
  const weight = ob.querySelector('#f-weight');
  weight?.addEventListener('input', () => {
    draft.weight = weight.value;
    ob.querySelector('[data-act="next"]').disabled = !(Number(weight.value) > 0);
  });
  ob.querySelector('#f-name')?.focus();
}

function collect(silent) {
  const g = id => document.getElementById(id)?.value;
  if (step === 1) { draft.name = (g('f-name') || '').trim() || 'Щенок'; }
  if (step === 2) { draft.birth = g('f-birth') || draft.birth; if (!draft.birth && !silent) return false; }
  if (step === 5) { draft.weight = g('f-weight') || draft.weight; if (!(Number(draft.weight) > 0) && !silent) return false; }
  if (step === 6) { draft.foodKcal = Number(g('f-kcal')) || null; }
  if (step === 7) { draft.wake = g('f-wake') || draft.wake; draft.sleep = g('f-sleep') || draft.sleep; }
  if (step === TOTAL && !silent) { finish(); return false; }
  return true;
}

function rerender(root) {
  root.querySelector('#ob').innerHTML = body();
  mount(root);
}

function finish() {
  const dog = {
    name: draft.name || 'Щенок', emoji: draft.emoji, birth: draft.birth, breed: draft.breed,
    group: draft.group || 'M', sex: draft.sex, neutered: draft.neutered,
    foodType: draft.foodType, foodKcal: draft.foodKcal, activity: draft.activity,
    wake: draft.wake, sleep: draft.sleep, schedule: {}, createdAt: todayISO()
  };
  const skills = initSkills(draft.known);
  unlockNext(skills, ageWeeks(dog.birth));
  store.update(s => {
    s.dog = dog; s.skills = skills;
    s.weights = [{ date: todayISO(), kg: Number(draft.weight) }];
  });
  step = 1;
  location.hash = '#/today';
  setTimeout(() => summary(dog, Number(draft.weight)), 60);
}

function summary(dog, kg) {
  const months = ageMonths(dog.birth);
  const s = recommendedSchedule(dog);
  const food = feedingPlan(dog, kg);
  const active = SKILLS.filter(x => store.get().skills[x.id]?.stage === 1).map(x => x.name);
  sheet(`
    <div class="pop" style="text-align:center;font-size:44px">${dog.emoji}</div>
    <h2 style="text-align:center;margin:8px 0 20px">План для ${esc(dog.name)} готов</h2>
    <div class="stack">
      <div class="card"><div class="over">Выгул</div>
        <b>2 прогулки по ${walkMinutes(months, dog.group)} мин</b>
        <div class="cap">${s.walkAm} и ${s.walkPm} · тренировка ${trainingMinutes(months)} мин внутри каждой</div></div>
      <div class="card"><div class="over">Питание</div>
        <b>${food.meals} × ${food.perMeal} г</b>
        <div class="cap">${food.kcal} ккал в сутки · бюджет лакомств ${food.treatBudget} ккал</div></div>
      <div class="card"><div class="over">Начинаем учить</div>
        <b>${active.join(', ') || 'подберём на первой прогулке'}</b>
        <div class="cap">Новые команды открываются после пяти оценок «отлично» подряд</div></div>
    </div>
    <p class="cap" style="margin:16px 0 0">Всё можно поправить в разделе «Расписание».</p>
    <button class="btn" style="margin-top:16px" data-act="ok">Открыть день</button>
  `, el => el.querySelector('[data-act="ok"]').addEventListener('click', closeSheet));
}
