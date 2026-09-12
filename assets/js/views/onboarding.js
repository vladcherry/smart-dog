import { BREEDS, GROUPS, FOOD_TYPES } from '../data/breeds.js';
import { SKILLS } from '../data/skills.js';
import * as store from '../state.js';
import { initSkills, unlockNext } from '../training.js';
import { todayISO, ageWeeks, ageMonths, ageLabel, feedingsPerDay, walkMinutes,
         recommendedSchedule, feedingPlan, trainingMinutes } from '../algo.js';
import { bind, esc, sheet, closeSheet, pickPhoto, avatarHtml } from '../ui.js';
import { t, tn, LANGS, getLang, setLang } from '../i18n/index.js';
import { breedName, group as groupText, foodLabel, skillName } from '../i18n/content.js';

const EMOJI = ['🐶','🐕','🦮','🐩','🐕‍🦺','🐺'];
let step = 1;
let nameFocused = false;
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
    <div class="over">${t('Шаг {n} из {total}', { n:step, total:TOTAL })}</div>
    <div class="stage-bar" style="margin:8px 0 16px"><i style="width:${step / TOTAL * 100}%"></i></div>
    <h1>${title}</h1>
    ${sub ? `<p class="muted" style="margin-top:8px">${sub}</p>` : ''}
  </div>`;
}

function nav(okLabel = t('Далее'), disabled = false) {
  return `<div class="btn-row" style="margin-top:32px">
    ${step > 1 ? `<button class="btn btn-sec" data-act="back">${t('Назад')}</button>` : ''}
    <button class="btn" data-act="next" ${disabled ? 'disabled' : ''}>${okLabel}</button>
  </div>`;
}

function body() {
  switch (step) {
    case 1: return `<div class="seg" style="margin-bottom:24px">
        ${LANGS.map(l => `<button data-act="lang" data-v="${l.code}" aria-pressed="${getLang() === l.code}"
          style="min-height:44px;font-size:13px">${l.flag} ${l.name}</button>`).join('')}
      </div>` + head(t('Как зовут щенка?'), t('С этого начинается всё — и план, и обучение.')) + `
      <label class="field"><span>${t('Кличка')}</span>
        <input id="f-name" value="${esc(draft.name || '')}" placeholder="${t('Рекс')}" autocomplete="off"></label>
      <label class="field"><span>${t('Аватар')}</span></label>
      <div class="row" style="gap:12px;margin-bottom:12px">
        ${avatarHtml(draft, 'avatar avatar-lg')}
        <div class="grow">
          <button class="btn btn-sec btn-sm" data-act="photo" style="width:100%">
            ${draft.photo ? t('Заменить фото') : t('Сделать фото или выбрать из галереи')}</button>
          ${draft.photo ? `<button class="btn-ghost" data-act="nophoto"
            style="margin-top:6px">${t('Убрать фото')}</button>` : ''}
        </div>
      </div>
      <div class="seg">${EMOJI.map(e => `<button data-act="emoji" data-v="${e}"
        aria-pressed="${!draft.photo && draft.emoji === e}" style="font-size:24px">${e}</button>`).join('')}</div>
      <p class="cap" style="margin-top:8px">${t('Фото хранится только на этом устройстве и никуда не отправляется.')}</p>
      ` + nav();

    case 2: return head(t('Когда родился?'), t('Возраст — главный вход всех расчётов: и нагрузки, и порции, и тренировок.')) + `
      <label class="field"><span>${t('Дата рождения')}</span>
        <input type="date" id="f-birth" value="${draft.birth || ''}" max="${todayISO()}"></label>
      <p class="cap">${t('Не знаете точно? Нажмите примерный возраст — план можно пересчитать позже.')}</p>
      <div class="seg" style="margin-top:12px">
        ${[2,3,4,6,9].map(m => `<button data-act="approx" data-v="${m}">${t('{n} мес.', { n:m })}</button>`).join('')}
      </div>
      <p class="cap" id="birth-note" style="margin-top:12px">${birthNote()}</p>` + nav(t('Далее'), !draft.birth);

    case 3: return head(t('Порода'), t('От размерной группы зависит кривая роста и предел нагрузки на суставы.')) + `
      <label class="field"><span>${t('Порода')}</span>
        <select id="f-breed">
          <option value="" ${!draft.breed ? 'selected' : ''}>${t('— не выбрана —')}</option>
          ${BREEDS.map(b => `<option value="${b.id}"
            ${draft.breed === b.id ? 'selected' : ''}>${esc(breedName(b.id))}</option>`).join('')}</select></label>
      <p class="cap" style="margin:-8px 0 16px">${t('Нет в списке — выберите «Другая / метис» и укажите размерную группу вручную.')}</p>
      <label class="field"><span>${t('Размерная группа')}</span></label>
      <div class="seg">${Object.keys(GROUPS).map(k => { const g = groupText(k);
        return `<button data-act="group" data-v="${k}"
        aria-pressed="${draft.group === k}">${esc(g.label)}<br><span class="cap">${esc(g.hint)}</span></button>`; }).join('')}</div>
      ` + nav(t('Далее'), !draft.group);

    case 4: return head(t('Пол и стерилизация'), t('Влияет на прогноз взрослого веса и на коэффициент калорий.')) + `
      <label class="field"><span>${t('Пол')}</span></label>
      <div class="seg">
        <button data-act="sex" data-v="m" aria-pressed="${draft.sex === 'm'}">${t('Кобель')}</button>
        <button data-act="sex" data-v="f" aria-pressed="${draft.sex === 'f'}">${t('Сука')}</button></div>
      <label class="field" style="margin-top:24px"><span>${t('Стерилизация / кастрация')}</span></label>
      <div class="seg">
        <button data-act="neu" data-v="no" aria-pressed="${draft.neutered === 'no'}">${t('Нет')}</button>
        <button data-act="neu" data-v="plan" aria-pressed="${draft.neutered === 'plan'}">${t('Планируется')}</button>
        <button data-act="neu" data-v="yes" aria-pressed="${draft.neutered === 'yes'}">${t('Да')}</button></div>
      ` + nav();

    case 5: return head(t('Сколько весит сейчас?'), t('Взвесьте на обычных весах: возьмите собаку на руки и вычтите свой вес.')) + `
      <label class="field"><span>${t('Вес, кг')}</span>
        <input type="number" step="0.1" min="0.5" max="120" id="f-weight" inputmode="decimal"
          value="${draft.weight || ''}" placeholder="8.4"></label>
      ` + nav(t('Далее'), !draft.weight);

    case 6: return head(t('Чем кормите?'), t('Нужна калорийность, чтобы перевести калории в граммы. Она написана на упаковке.')) + `
      <label class="field"><span>${t('Тип корма')}</span></label>
      <div class="seg">${Object.keys(FOOD_TYPES).map(k => `<button data-act="food" data-v="${k}"
        aria-pressed="${draft.foodType === k}">${esc(foodLabel(k))}</button>`).join('')}</div>
      <label class="field" style="margin-top:24px"><span>${t('Ккал на 100 г — если знаете')}</span>
        <input type="number" id="f-kcal" inputmode="numeric" value="${draft.foodKcal || ''}"
          placeholder="${FOOD_TYPES[draft.foodType].kcal}"></label>
      <p class="cap">${t('Пусто — возьмём среднее {kcal} ккал/100 г и пометим расчёт как приблизительный.',
        { kcal:FOOD_TYPES[draft.foodType].kcal })}</p>
      ` + nav();

    case 7: return head(t('Режим дня'), t('Приложение расставит выгул и кормления вокруг вашего распорядка.')) + `
      <label class="field"><span>${t('Уровень активности')}</span></label>
      <div class="seg">
        <button data-act="act" data-v="low" aria-pressed="${draft.activity === 'low'}">${t('Низкий')}</button>
        <button data-act="act" data-v="mid" aria-pressed="${draft.activity === 'mid'}">${t('Средний')}</button>
        <button data-act="act" data-v="high" aria-pressed="${draft.activity === 'high'}">${t('Высокий')}</button></div>
      <div class="row" style="margin-top:24px;gap:12px">
        <label class="field grow"><span>${t('Подъём')}</span>
          <input type="time" id="f-wake" value="${draft.wake}"></label>
        <label class="field grow"><span>${t('Отбой')}</span>
          <input type="time" id="f-sleep" value="${draft.sleep}"></label>
      </div>` + nav();

    case 8: {
      const weeks = draft.birth ? ageWeeks(draft.birth) : 8;
      const avail = SKILLS.filter(s => s.minWeeks <= weeks + 4).slice(0, 12);
      return head(t('Что уже умеет?'), t('Отметьте то, что стабильно работает дома. Остальное начнём с нуля.')) + `
      <div class="stack">${avail.map(x => `<label class="check">
        <input type="checkbox" data-change="known" data-v="${x.id}" ${draft.known.includes(x.id) ? 'checked' : ''}>
        <span>${esc(skillName(x.id))}</span></label>`).join('')}</div>
      <p class="cap" style="margin-top:16px">${t('Ничего страшного, если список пустой — так начинают почти все.')}</p>
      ` + nav(t('Собрать план'));
    }
  }
}

function mount(root) {
  const ob = root.querySelector('#ob');
  // Любой выбор перерисовывает шаг, поэтому сначала забираем то, что уже введено руками,
  // иначе набранная кличка или вес потерялись бы при нажатии на аватар или размер
  const pick = fn => (el) => { collect(true); fn(el); rerender(root); };
  bind(ob, {
    next: () => { if (collect()) { step = Math.min(TOTAL, step + 1); rerender(root); } },
    back: () => { collect(true); step = Math.max(1, step - 1); rerender(root); },
    emoji: pick(el => { draft.emoji = el.dataset.v; }),
    lang: async el => { collect(true); await setLang(el.dataset.v); rerender(root); },
    photo: async () => {
      collect(true);
      const data = await pickPhoto();
      if (data) draft.photo = data;
      rerender(root);
    },
    nophoto: () => { collect(true); draft.photo = null; rerender(root); },
    group: pick(el => { draft.group = el.dataset.v; draft.groupManual = true; }),
    sex:   pick(el => { draft.sex = el.dataset.v; }),
    neu:   pick(el => { draft.neutered = el.dataset.v; }),
    food:  pick(el => { draft.foodType = el.dataset.v; }),
    act:   pick(el => { draft.activity = el.dataset.v; }),
    // Перерисовка на шаге с датой недопустима: нативный выбор даты на Android шлёт
    // события прямо во время прокрутки, и пересозданный input закрывал бы календарь
    approx: el => {
      const d = new Date(); d.setMonth(d.getMonth() - Number(el.dataset.v));
      draft.birth = todayISO(d);
      setBirth(ob);
    },
    known: el => {
      const id = el.dataset.v;
      draft.known = el.checked ? [...new Set([...draft.known, id])] : draft.known.filter(x => x !== id);
    }
  });
  const breed = ob.querySelector('#f-breed');
  if (breed) {
    breed.addEventListener('change', () => {
      collect(true);
      draft.breed = breed.value || null;
      const b = BREEDS.find(x => x.id === breed.value);
      if (b?.group) { draft.group = b.group; draft.groupManual = false; }
      // «Другая / метис» и пустой выбор: группу, унаследованную от прежней породы,
      // сбрасываем — иначе метис молча останется с чужим размером
      else if (!draft.groupManual) draft.group = null;
      rerender(root);
    });
  }
  const birth = ob.querySelector('#f-birth');
  const onBirth = () => { draft.birth = birth.value; setBirth(ob); };
  birth?.addEventListener('input', onBirth);
  birth?.addEventListener('change', onBirth);
  const nameInput = ob.querySelector('#f-name');
  nameInput?.addEventListener('input', () => { draft.name = nameInput.value.trim(); });
  const weight = ob.querySelector('#f-weight');
  weight?.addEventListener('input', () => {
    draft.weight = weight.value;
    ob.querySelector('[data-act="next"]').disabled = !(Number(weight.value) > 0);
  });
  if (step === 1 && !nameFocused) { ob.querySelector('#f-name')?.focus(); nameFocused = true; }
}

/** Обновляет шаг с датой точечно, не пересоздавая input — иначе закрывается календарь */
function setBirth(ob) {
  const input = ob.querySelector('#f-birth');
  if (input && input.value !== draft.birth) input.value = draft.birth || '';
  const note = ob.querySelector('#birth-note');
  if (note) note.textContent = birthNote();
  const next = ob.querySelector('[data-act="next"]');
  if (next) next.disabled = !draft.birth;
}

function birthNote() {
  return draft.birth ? t('Возраст: {age}', { age: ageLabel(draft.birth) }) : t('Дата пока не выбрана');
}

function collect(silent) {
  const g = id => document.getElementById(id)?.value;
  if (step === 1) { const v = g('f-name'); if (v !== undefined) draft.name = v.trim(); }
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
    name: (draft.name || '').trim() || t('Щенок'), emoji: draft.emoji, photo: draft.photo || null,
    birth: draft.birth, breed: draft.breed,
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
  nameFocused = false;
  location.hash = '#/today';
  setTimeout(() => summary(dog, Number(draft.weight)), 60);
}

function summary(dog, kg) {
  const months = ageMonths(dog.birth);
  const s = recommendedSchedule(dog);
  const food = feedingPlan(dog, kg);
  const active = SKILLS.filter(x => store.get().skills[x.id]?.stage === 1).map(x => skillName(x.id));
  sheet(`
    <div class="pop" style="display:flex;justify-content:center">${avatarHtml(dog, 'avatar avatar-lg')}</div>
    <h2 style="text-align:center;margin:8px 0 20px">${t('{name} — план готов', { name:esc(dog.name) })}</h2>
    <div class="stack">
      <div class="card"><div class="over">${t('Выгул')}</div>
        <b>${t('2 прогулки по {min} мин', { min: walkMinutes(months, dog.group) })}</b>
        <div class="cap">${t('{am} и {pm} · тренировка {train} мин внутри каждой',
          { am:s.walkAm, pm:s.walkPm, train: trainingMinutes(months) })}</div></div>
      <div class="card"><div class="over">${t('Питание')}</div>
        <b>${t('{n} × {g} г', { n:food.meals, g:food.perMeal })}</b>
        <div class="cap">${t('{kcal} ккал в сутки · бюджет лакомств {treats} ккал',
          { kcal:food.kcal, treats:food.treatBudget })}</div></div>
      <div class="card"><div class="over">${t('Начинаем учить')}</div>
        <b>${active.join(', ') || t('подберём на первой прогулке')}</b>
        <div class="cap">${t('Новые команды открываются после пяти оценок «отлично» подряд')}</div></div>
    </div>
    <p class="cap" style="margin:16px 0 0">${t('Время выгулов, время и количество кормлений меняются в разделе «Расписание» — он есть на экране «Сегодня» и в профиле.')}</p>
    <div class="btn-row" style="margin-top:16px">
      <button class="btn btn-sec" data-act="sched">${t('Расписание')}</button>
      <button class="btn" data-act="ok">${t('Открыть день')}</button>
    </div>
  `, el => {
    el.querySelector('[data-act="ok"]').addEventListener('click', closeSheet);
    el.querySelector('[data-act="sched"]').addEventListener('click', () => {
      closeSheet(); location.hash = '#/schedule';
    });
  });
}
