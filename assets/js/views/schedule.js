import * as store from '../state.js';
import { effectiveSchedule, recommendedSchedule, recommendations, feedingPlan,
         ageMonths, walkMinutes, holdHours, trainingMinutes, plural } from '../algo.js';
import { bind, esc, icon, toast } from '../ui.js';

const RULES = [
  ['Сначала выгул, потом еда', 'Кормим через 20–30 минут после прогулки: голодная собака лучше работает за еду, и тренировка проходит продуктивнее.'],
  ['Не гулять активно 1–2 часа после кормления', 'Риск заворота желудка, особенно у крупных и глубокогрудых пород.'],
  ['Туалетный выход через 15–30 минут после еды', 'Гастро-колический рефлекс: в этом окне щенок почти гарантированно сходит.'],
  ['Последнее кормление за 3–4 часа до сна', 'Вода — за 1–2 часа. Меньше ночных подъёмов и луж.'],
  ['Одинаковое время каждый день, ±30 минут', 'Предсказуемость снижает тревожность и ускоряет приучение к туалету.'],
  ['Утром — новый материал, вечером — закрепление', 'Утром щенок свежий, вечером устал и лучше повторяет знакомое.'],
  ['Тренировка — в первой половине прогулки', 'В конце прогулки собака уже устала, качество выполнения падает.'],
  ['Между кормлениями не меньше 4 часов', 'Иначе щенок не успевает проголодаться, и мотивация на еду падает.'],
  ['Ночной интервал не больше нормы удержания', 'Щенок 3 месяцев не удержит 9 часов — нужен ночной выход.'],
  ['Лакомства с тренировки вычитаются из порции', 'Иначе к 8 месяцам собака незаметно набирает лишний вес.']
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
  const manual = k => man[k] ? '<span class="badge">вручную</span>' : '';

  return {
    html: `<div class="screen-head"><div class="over">Расписание</div><h1>Режим дня</h1>
      <div class="cap">Рассчитано по возрасту ${Math.round(months)} ${plural(Math.round(months), 'месяц','месяца','месяцев')}
      и размерной группе. Ручные значения не перетираются при пересчёте.</div></div>
      <div class="screen" style="padding-top:8px">

        <div class="section-title"><h2>Выгул</h2></div>
        <div class="card stack">
          <label class="field" style="margin:0"><span>Утренний выгул ${manual('walkAm')}</span>
            <input type="time" data-change="t" data-k="walkAm" value="${eff.walkAm}"></label>
          <label class="field" style="margin:0"><span>Вечерний выгул ${manual('walkPm')}</span>
            <input type="time" data-change="t" data-k="walkPm" value="${eff.walkPm}"></label>
          <label class="field" style="margin:0"><span>Длительность, мин ${manual('walkMin')}</span>
            <input type="number" min="5" max="120" data-change="t" data-k="walkMin" value="${eff.walkMin}"></label>
          <div class="cap">Норма для этого возраста: ${rec.walkMin} мин структурированной нагрузки дважды в день.
            Тренировка внутри прогулки: ${trainingMinutes(months)} мин.
            Туалетные выходы — каждые ${holdHours(months)} ч.</div>
        </div>

        <div class="section-title"><h2>Кормление</h2></div>
        <div class="card stack">
          <label class="field" style="margin:0"><span>Число кормлений</span>
            <select data-change="meals-count">
              ${[1,2,3,4,5].map(n => `<option value="${n}" ${eff.meals.length === n ? 'selected' : ''}>${n}</option>`).join('')}
            </select></label>
          ${eff.meals.map((t, i) => `<label class="field" style="margin:0">
            <span>Кормление ${i + 1}</span>
            <input type="time" data-change="meal" data-i="${i}" value="${t}"></label>`).join('')}
          <div class="cap">Порция: <b class="num">${food.perMeal} г</b> × ${food.meals} ·
            ${food.kcal} ккал в сутки · корм ${food.kcal100} ккал/100 г ·
            бюджет лакомств ${food.treatBudget} ккал.</div>
        </div>

        <div class="section-title"><h2>Рекомендации</h2>
          ${recs.length ? `<span class="pill">${recs.length}</span>` : '<span class="pill">всё по норме</span>'}</div>

        <button class="btn btn-sec" data-act="apply-all">Применить рекомендованное расписание целиком</button>

        <div class="stack" style="margin-top:12px">
          ${recs.map(r => `<div class="card">
            <div class="row-between"><b>${esc(r.title)}</b></div>
            <div class="cap" style="margin-top:6px">${esc(r.text)}</div>
            ${r.fix ? `<button class="btn btn-sm" style="margin-top:12px" data-act="fix"
              data-id="${r.id}">Применить</button>` : ''}
          </div>`).join('') || `<div class="banner banner-ok"><div>
            <b>Расписание согласовано с возрастом</b>Ничего менять не нужно.</div></div>`}
        </div>

        <div class="section-title"><h2>Правила, по которым строится режим</h2></div>
        <div class="stack">${RULES.map(([t, d], i) => `<div class="card card-flat">
          <b>${i + 1}. ${esc(t)}</b><div class="cap" style="margin-top:4px">${esc(d)}</div></div>`).join('')}</div>

        <button class="btn btn-sec" style="margin-top:24px" data-act="reset-manual">
          Вернуть все расчётные значения</button>
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
          toast('Применено');
          setTimeout(() => location.reload(), 400);
        },
        'apply-all': () => {
          store.update(s => { s.dog.schedule = {}; s.dog.mealsOverride = null; });
          toast('Расписание пересчитано по рекомендации');
          setTimeout(() => location.reload(), 400);
        },
        'reset-manual': () => {
          store.update(s => { s.dog.schedule = {}; s.dog.mealsOverride = null; });
          toast('Ручные значения сброшены');
          setTimeout(() => location.reload(), 400);
        }
      });
    }
  };
}
