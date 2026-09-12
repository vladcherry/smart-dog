import * as store from '../state.js';
import { effectiveSchedule, recommendedSchedule, recommendations, feedingPlan,
         ageMonths, walkMinutes, holdHours, trainingMinutes } from '../algo.js';
import { bind, esc, icon, toast } from '../ui.js';
import { t, tn } from '../i18n/index.js';

const RULES = () => [
  [t('Сначала выгул, потом еда'), t('Кормим через 20–30 минут после прогулки: голодная собака лучше работает за еду, и тренировка проходит продуктивнее.')],
  [t('Не гулять активно 1–2 часа после кормления'), t('Риск заворота желудка, особенно у крупных и глубокогрудых пород.')],
  [t('Туалетный выход через 15–30 минут после еды'), t('Гастро-колический рефлекс: в этом окне щенок почти гарантированно сходит.')],
  [t('Последнее кормление за 3–4 часа до сна'), t('Вода — за 1–2 часа. Меньше ночных подъёмов и луж.')],
  [t('Одинаковое время каждый день, ±30 минут'), t('Предсказуемость снижает тревожность и ускоряет приучение к туалету.')],
  [t('Утром — новый материал, вечером — закрепление'), t('Утром щенок свежий, вечером устал и лучше повторяет знакомое.')],
  [t('Тренировка — в первой половине прогулки'), t('В конце прогулки собака уже устала, качество выполнения падает.')],
  [t('Между кормлениями не меньше 4 часов'), t('Иначе щенок не успевает проголодаться, и мотивация на еду падает.')],
  [t('Ночной интервал не больше нормы удержания'), t('Щенок 3 месяцев не удержит 9 часов — нужен ночной выход.')],
  [t('Лакомства с тренировки вычитаются из порции'), t('Иначе к 8 месяцам собака незаметно набирает лишний вес.')]
];

export default function schedule() {
  const s = store.get(), dog = s.dog;
  const eff = effectiveSchedule(dog);
  const rec = recommendedSchedule(dog);
  const recs = recommendations(dog, s.weights);
  const months = ageMonths(dog.birth);
  const kg = store.lastWeight()?.kg || 5;
  const food = feedingPlan(dog, kg);
  const man = dog.schedule || {};
  const manual = k => man[k] ? `<span class="badge">${t('вручную')}</span>` : '';

  return {
    html: `<div class="screen-head"><div class="over">${t('Расписание')}</div><h1>${t('Режим дня')}</h1>
      <div class="cap">${t('Рассчитано по возрасту {age} и размерной группе. Ручные значения не перетираются при пересчёте.',
        { age: tn('месяц|месяца|месяцев', Math.round(months)) })}</div></div>
      <div class="screen" style="padding-top:8px">

        <div class="section-title"><h2>${t('Выгул')}</h2></div>
        <div class="card stack">
          <label class="field" style="margin:0"><span>${t('Утренний выгул')} ${manual('walkAm')}</span>
            <input type="time" data-change="t" data-k="walkAm" value="${eff.walkAm}"></label>
          <label class="field" style="margin:0"><span>${t('Вечерний выгул')} ${manual('walkPm')}</span>
            <input type="time" data-change="t" data-k="walkPm" value="${eff.walkPm}"></label>
          <label class="field" style="margin:0"><span>${t('Длительность, мин')} ${manual('walkMin')}</span>
            <input type="number" min="5" max="120" data-change="t" data-k="walkMin" value="${eff.walkMin}"></label>
          <div class="cap">${t('Норма для этого возраста: {min} мин структурированной нагрузки дважды в день. Тренировка внутри прогулки: {train} мин. Туалетные выходы — каждые {hold} ч.',
            { min:rec.walkMin, train:trainingMinutes(months), hold:holdHours(months) })}</div>
        </div>

        <div class="section-title"><h2>${t('Кормление')}</h2></div>
        <div class="card stack">
          <label class="field" style="margin:0"><span>${t('Число кормлений')}</span>
            <select data-change="meals-count">
              ${[1,2,3,4,5].map(n => `<option value="${n}" ${eff.meals.length === n ? 'selected' : ''}>${n}</option>`).join('')}
            </select></label>
          ${eff.meals.map((time, i) => `<label class="field" style="margin:0">
            <span>${t('Кормление {n}', { n:i + 1 })}</span>
            <input type="time" data-change="meal" data-i="${i}" value="${time}"></label>`).join('')}
          <div class="cap">${t('Порция: {g} г × {n} · {kcal} ккал в сутки · корм {k100} ккал/100 г · бюджет лакомств {treats} ккал.',
            { g:food.perMeal, n:food.meals, kcal:food.kcal, k100:food.kcal100, treats:food.treatBudget })}</div>
        </div>

        <div class="section-title"><h2>${t('Рекомендации')}</h2>
          ${recs.length ? `<span class="pill">${recs.length}</span>` : `<span class="pill">${t('всё по норме')}</span>`}</div>

        <button class="btn btn-sec" data-act="apply-all">${t('Применить рекомендованное расписание целиком')}</button>

        <div class="stack" style="margin-top:12px">
          ${recs.map(r => `<div class="card">
            <div class="row-between"><b>${esc(r.title)}</b></div>
            <div class="cap" style="margin-top:6px">${esc(r.text)}</div>
            ${r.fix ? `<button class="btn btn-sm" style="margin-top:12px" data-act="fix"
              data-id="${r.id}">${t('Применить')}</button>` : ''}
          </div>`).join('') || `<div class="banner banner-ok"><div>
            <b>${t('Расписание согласовано с возрастом')}</b>${t('Ничего менять не нужно.')}</div></div>`}
        </div>

        <div class="section-title"><h2>${t('Правила, по которым строится режим')}</h2></div>
        <div class="stack">${RULES().map(([title, d], i) => `<div class="card card-flat">
          <b>${i + 1}. ${esc(title)}</b><div class="cap" style="margin-top:4px">${esc(d)}</div></div>`).join('')}</div>

        <button class="btn btn-sec" style="margin-top:24px" data-act="reset-manual">
          ${t('Вернуть все расчётные значения')}</button>
      </div>`,

    mount(root) {
      const setSchedule = fn => { store.update(s => { s.dog.schedule = s.dog.schedule || {}; fn(s.dog.schedule, s); }); render(); };
      const render = () => location.reload();
      bind(root, {
        t: el => setSchedule(sc => { sc[el.dataset.k] = el.dataset.k === 'walkMin' ? Number(el.value) : el.value; }),
        meal: el => setSchedule(sc => {
          const meals = [...effectiveSchedule(store.get().dog).meals];
          meals[Number(el.dataset.i)] = el.value;
          sc.meals = meals;
        }),
        'meals-count': el => setSchedule((sc, s) => {
          s.dog.mealsOverride = Number(el.value);
          sc.meals = recommendedSchedule(s.dog).meals;
        }),
        fix: el => {
          const r = recommendations(store.get().dog, store.get().weights).find(x => x.id === el.dataset.id);
          if (!r?.fix) return;
          store.update(s => {
            s.dog.schedule = s.dog.schedule || {};
            if (r.fix.type === 'meals') s.dog.schedule.meals = r.fix.value;
            else if (r.fix.type === 'mealsCount') {
              s.dog.mealsOverride = r.fix.value;
              s.dog.schedule.meals = recommendedSchedule(s.dog).meals;
            } else s.dog.schedule[r.fix.type] = r.fix.value;
          });
          toast(t('Применено'));
          setTimeout(() => location.reload(), 400);
        },
        'apply-all': () => {
          store.update(s => { s.dog.schedule = {}; s.dog.mealsOverride = null; });
          toast(t('Расписание пересчитано по рекомендации'));
          setTimeout(() => location.reload(), 400);
        },
        'reset-manual': () => {
          store.update(s => { s.dog.schedule = {}; s.dog.mealsOverride = null; });
          toast(t('Ручные значения сброшены'));
          setTimeout(() => location.reload(), 400);
        }
      });
    }
  };
}
