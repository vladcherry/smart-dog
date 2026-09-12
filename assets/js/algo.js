// Алгоритмы расчёта: docs/04-profile-and-algorithms.md
import { GROUPS, BREEDS, FOOD_TYPES } from './data/breeds.js';

/* ---------- Возраст ---------- */
export const DAY = 86400000;
export function todayISO(d = new Date()) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
export function ageDays(birth, now = new Date()) {
  return Math.max(0, Math.floor((now - new Date(birth + 'T00:00:00')) / DAY));
}
export function ageWeeks(birth, now) { return ageDays(birth, now) / 7; }
export function ageMonths(birth, now) { return ageDays(birth, now) / 30.44; }
export function ageLabel(birth, now) {
  const d = ageDays(birth, now), m = Math.floor(d / 30.44), w = Math.floor((d - m * 30.44) / 7);
  if (m < 1) return `${Math.floor(d / 7)} нед.`;
  const mm = plural(m, 'месяц', 'месяца', 'месяцев');
  return w > 0 ? `${m} ${mm} ${w} нед.` : `${m} ${mm}`;
}
export function plural(n, one, few, many) {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}

/* ---------- Кривая роста ---------- */
const GROWTH = {
  S:  [[8,.22],[12,.39],[16,.53],[20,.65],[24,.75],[30,.86],[36,.93],[44,.98],[52,1],[78,1]],
  M:  [[8,.17],[12,.31],[16,.43],[20,.54],[24,.63],[30,.74],[36,.83],[44,.91],[52,.96],[65,1],[78,1]],
  L:  [[8,.14],[12,.26],[16,.36],[20,.46],[24,.55],[30,.66],[36,.75],[44,.84],[52,.91],[65,.97],[78,1]],
  XL: [[8,.12],[12,.22],[16,.31],[20,.39],[24,.47],[30,.57],[36,.66],[44,.76],[52,.84],[65,.92],[78,1]]
};

export function pctOfAdult(weeks, group = 'M') {
  const t = GROWTH[group] || GROWTH.M;
  if (weeks <= t[0][0]) return t[0][1] * (weeks / t[0][0]) || t[0][1];
  for (let i = 0; i < t.length - 1; i++) {
    const [w1, p1] = t[i], [w2, p2] = t[i + 1];
    if (weeks <= w2) return p1 + (p2 - p1) * (weeks - w1) / (w2 - w1);
  }
  return 1;
}

/** Прогноз взрослого веса. weights — [{date, kg}] по возрастанию даты. */
export function predictAdultWeight(dog, weights) {
  const group = dog.group || 'M';
  const breed = BREEDS.find(b => b.id === dog.breed);
  const list = (weights || []).slice(-6);
  if (!list.length) return null;
  let est = null;
  for (const w of list) {
    const weeks = ageWeeks(dog.birth, new Date(w.date + 'T12:00:00'));
    const pct = pctOfAdult(weeks, group);
    if (pct <= 0.02) continue;
    let raw = w.kg / pct;
    est = est === null ? raw : est * 0.7 + raw * 0.3;   // экспоненциальное сглаживание
  }
  if (est === null) return null;
  est *= dog.sex === 'm' ? 1.05 : 0.95;
  if (breed && breed.min) est = Math.min(Math.max(est, breed.min * 0.9), breed.max * 1.1);
  return {
    value: round1(est),
    low: round1(est * 0.9),
    high: round1(est * 1.1),
    confident: list.length >= 2
  };
}

export function expectedWeight(adultKg, weeks, group) { return adultKg * pctOfAdult(weeks, group); }

export function growthStatus(actual, expected) {
  const d = (actual - expected) / expected;
  if (d > 0.25)  return { key:'high2', label:'Сильно выше нормы', tone:'bad',  delta:d, advice:'Обсудите с ветеринарным врачом, не сокращайте рацион самостоятельно больше чем на 10 %.' };
  if (d > 0.15)  return { key:'high',  label:'Выше нормы',        tone:'warn', delta:d, advice:'Снижаем калорийность на 10 % и проверяем кондицию тела.' };
  if (d < -0.25) return { key:'low2',  label:'Сильно ниже нормы', tone:'bad',  delta:d, advice:'Покажите собаку ветеринарному врачу.' };
  if (d < -0.15) return { key:'low',   label:'Ниже нормы',        tone:'warn', delta:d, advice:'Поднимаем калорийность на 10 %, проверяем корм и обработку от паразитов.' };
  return { key:'ok', label:'В коридоре нормы', tone:'ok', delta:d, advice:'Продолжаем в том же режиме.' };
}

/* ---------- Питание ---------- */
export function rer(kg) { return 70 * Math.pow(Math.max(kg, 0.5), 0.75); }

/** Коэффициент жизненного этапа с плавным переходом (±2 недели вокруг границы) */
export function lifeStageFactor(months, dog) {
  const growthEnd = (GROUPS[dog.group] || GROUPS.M).growthEndWeeks / 4.345;
  const adult = dog.neutered === 'yes' ? 1.6 : 1.8;
  const points = [[0, 3.0], [3.75, 3.0], [4.25, 2.5], [6.75, 2.5], [7.25, 2.0],
                  [growthEnd - 0.25, 2.0], [growthEnd + 0.25, adult], [999, adult]];
  for (let i = 0; i < points.length - 1; i++) {
    const [m1, k1] = points[i], [m2, k2] = points[i + 1];
    if (months <= m2) return k1 + (k2 - k1) * (months - m1) / (m2 - m1 || 1);
  }
  return adult;
}

export const ACTIVITY = { low:0.9, mid:1.0, high:1.1 };
export const BCS_FACTOR = { thin:1.15, ok:1.0, full:0.9, fat:0.8 };

export function der(dog, kg, now = new Date()) {
  const m = ageMonths(dog.birth, now);
  const k = lifeStageFactor(m, dog);
  const act = ACTIVITY[dog.activity] || 1;
  const bcs = BCS_FACTOR[dog.bcs] || 1;
  return Math.round(rer(kg) * k * act * bcs);
}

export function feedingsPerDay(months) { return months < 4 ? 4 : months < 6 ? 3 : 2; }

export function foodKcal(dog) {
  return dog.foodKcal || (FOOD_TYPES[dog.foodType] || FOOD_TYPES.dry).kcal;
}

export function gramsPerDay(kcalDay, kcal100) { return Math.round(kcalDay / kcal100 * 100 / 5) * 5; }

export function treatBudgetKcal(kcalDay) { return Math.round(kcalDay * 0.1); }

/** Полный расчёт питания на день с учётом израсходованных лакомств */
export function feedingPlan(dog, kg, treatsKcal = 0, now = new Date()) {
  const total = der(dog, kg, now);
  const kcal100 = foodKcal(dog);
  const meals = dog.mealsOverride || feedingsPerDay(ageMonths(dog.birth, now));
  const food = Math.max(0, total - Math.min(treatsKcal, treatBudgetKcal(total)));
  const grams = gramsPerDay(food, kcal100);
  return {
    kcal: total, kcal100, meals, grams,
    perMeal: Math.round(grams / meals / 5) * 5,
    treatBudget: treatBudgetKcal(total),
    treatsKcal
  };
}

/* ---------- Выгул ---------- */
export function walkMinutes(months, group) {
  const max = (GROUPS[group] || GROUPS.M).maxWalk;
  if (months >= 12) return Math.min(max, group === 'XL' ? 45 : 55);
  return Math.round(Math.min(Math.max(5 * months, 10), max));
}
export function holdHours(months) { return Math.min(Math.round(months + 1), 8); }
export function trainingMinutes(months) {
  return Math.round(Math.min(Math.max(1.5 * months, 3), 12));
}
export function growthDone(dog, now = new Date()) {
  return ageWeeks(dog.birth, now) >= (GROUPS[dog.group] || GROUPS.M).growthEndWeeks;
}

/* ---------- Расписание ---------- */
export function minutesOf(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
export function timeOf(min) {
  const m = ((min % 1440) + 1440) % 1440;
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
}

/** Рекомендованное расписание от подъёма/отбоя и возраста */
export function recommendedSchedule(dog, now = new Date()) {
  const months = ageMonths(dog.birth, now);
  const wake = minutesOf(dog.wake || '07:00');
  const sleep = minutesOf(dog.sleep || '22:30');
  const meals = dog.mealsOverride || feedingsPerDay(months);
  const walkAm = timeOf(wake);
  const walkPm = timeOf(Math.max(wake + 600, sleep - 240));
  const times = [];
  const first = wake + 30;                       // завтрак через 30 мин после выгула
  const needed = first + 240 * (meals - 1);      // не меньше 4 часов между кормлениями
  const cap = Math.max(first + 240, sleep - 180); // последнее кормление за 3 часа до сна
  const last = Math.max(minutesOf(walkPm) + 30, Math.min(needed, cap));
  if (meals === 1) times.push(timeOf(first));
  else {
    const step = (last - first) / (meals - 1);
    for (let i = 0; i < meals; i++) times.push(timeOf(Math.round(first + step * i)));
  }
  return { walkAm, walkPm, meals: times, walkMin: walkMinutes(months, dog.group) };
}

export function effectiveSchedule(dog, now = new Date()) {
  const rec = recommendedSchedule(dog, now);
  const man = dog.schedule || {};
  return {
    walkAm: man.walkAm || rec.walkAm,
    walkPm: man.walkPm || rec.walkPm,
    walkMin: man.walkMin || rec.walkMin,
    meals: (man.meals && man.meals.length) ? man.meals : rec.meals,
    rec
  };
}

/* ---------- Рекомендации ---------- */
export function recommendations(dog, weights, now = new Date()) {
  const out = [];
  const s = effectiveSchedule(dog, now);
  const months = ageMonths(dog.birth, now);
  const rec = s.rec;
  const add = (id, title, text, fix) => out.push({ id, title, text, fix });

  const firstMeal = minutesOf(s.meals[0]);
  if (firstMeal < minutesOf(s.walkAm)) {
    add('meal-before-walk', 'Завтрак стоит до прогулки',
      `Кормление в ${s.meals[0]} идёт раньше выгула в ${s.walkAm}. Голодная собака работает за еду охотнее — тренировка на прогулке пройдёт продуктивнее.`,
      { type:'meals', value:[timeOf(minutesOf(s.walkAm) + 30), ...s.meals.slice(1)] });
  }
  const lastMeal = minutesOf(s.meals[s.meals.length - 1]);
  const pm = minutesOf(s.walkPm);
  if (pm > lastMeal && pm - lastMeal < 60) {
    add('walk-after-meal', 'Выгул слишком близко к кормлению',
      `Между кормлением в ${s.meals[s.meals.length - 1]} и выгулом в ${s.walkPm} меньше часа. Для растущей собаки это риск заворота желудка — особенно у крупных пород.`,
      { type:'walkPm', value: timeOf(lastMeal + 90) });
  }
  for (let i = 1; i < s.meals.length; i++) {
    if (minutesOf(s.meals[i]) - minutesOf(s.meals[i - 1]) < 210) {
      add('meal-gap', 'Кормления слишком близко',
        `Между ${s.meals[i - 1]} и ${s.meals[i]} меньше 3.5 часов — щенок не успеет проголодаться, и мотивация на еду в тренировке упадёт.`,
        { type:'meals', value: rec.meals });
      break;
    }
  }
  const hold = holdHours(months);
  const night = (1440 - minutesOf(dog.sleep || '22:30') + minutesOf(dog.wake || '07:00')) / 60;
  if (night > hold * 1.5 + 1) {
    add('night', 'Ночной интервал больше нормы удержания',
      `В ${Math.round(months)} мес. собака удерживает около ${hold} ч днём, а ночью между ${dog.sleep || '22:30'} и ${dog.wake || '07:00'} проходит ${night.toFixed(1)} ч. Поставьте ночной выход примерно в ${timeOf(minutesOf(dog.sleep || '22:30') + Math.round(hold * 1.5) * 60)}.`, null);
  }
  const recMeals = feedingsPerDay(months);
  if (s.meals.length !== recMeals) {
    add('meals-count', 'Число кормлений не по возрасту',
      `Сейчас ${s.meals.length} ${plural(s.meals.length, 'кормление', 'кормления', 'кормлений')}, а в ${Math.round(months)} мес. рекомендуется ${recMeals}.`,
      { type:'mealsCount', value: recMeals });
  }
  if (s.walkMin > rec.walkMin * 1.5) {
    add('walk-long', 'Прогулка длиннее возрастной нормы',
      `${s.walkMin} минут структурированной нагрузки для ${Math.round(months)} мес. — много для растущих суставов. Норма — около ${rec.walkMin} минут дважды в день.`,
      { type:'walkMin', value: rec.walkMin });
  } else if (s.walkMin < rec.walkMin * 0.6) {
    add('walk-short', 'Прогулка короче нормы',
      `${s.walkMin} минут для ${Math.round(months)} мес. мало — накопленная энергия уйдёт в порчу вещей и перевозбуждение. Рекомендуем ${rec.walkMin} минут.`,
      { type:'walkMin', value: rec.walkMin });
  }
  if (Math.abs(minutesOf(s.walkPm) - minutesOf(s.walkAm)) < 300) {
    add('walks-close', 'Обе прогулки в одной половине дня',
      'Между выгулами меньше 5 часов. Вечерний выгул важен: он снимает дневное напряжение и помогает спокойной ночи.',
      { type:'walkPm', value: rec.walkPm });
  }
  const last = weights && weights.length ? weights[weights.length - 1] : null;
  if (!last || (now - new Date(last.date + 'T12:00:00')) / DAY > 14) {
    add('weigh', 'Давно не взвешивали',
      'Без свежего веса расчёт порции и нагрузки становится приблизительным. Взвешивайте раз в неделю до 6 месяцев.', null);
  }
  if (dog.neutered === 'yes' && !dog.neuterAdjusted && months >= 6) {
    add('neuter', 'Питание после стерилизации',
      'После стерилизации потребность в калориях падает примерно на 20 %. Приложение уже применило коэффициент 1.6 — проверьте кондицию тела через 2 недели.', null);
  }
  return out;
}

/* ---------- Мелочи ---------- */
export function round1(x) { return Math.round(x * 10) / 10; }
export function clamp(x, a, b) { return Math.min(Math.max(x, a), b); }
