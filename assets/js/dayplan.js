// Сборка ленты дня: docs/03-concept-and-screens.md §3.3
import { effectiveSchedule, feedingPlan, holdHours, ageMonths, trainingMinutes,
         minutesOf, timeOf } from './algo.js';
import { sessionSkills } from './training.js';
import { t, formatDate } from './i18n/index.js';

export function buildDay(dog, skills, dateISO, weightKg, treatsKcal = 0) {
  const now = new Date(dateISO + 'T12:00:00');
  const months = ageMonths(dog.birth, now);
  const s = effectiveSchedule(dog, now);
  const food = feedingPlan(dog, weightKg, treatsKcal, now);
  const trainMin = trainingMinutes(months);
  const ev = [];

  ev.push({
    id:'walk-am', type:'walk', slot:'am', time:s.walkAm, icon:'🐾',
    title:t('Утренний выгул'), sub:t('{min} мин · тренировка {train} мин', { min:s.walkMin, train:trainMin }),
    minutes:s.walkMin, trainMin, training:sessionSkills(skills, 'am', dateISO)
  });
  ev.push({
    id:'walk-pm', type:'walk', slot:'pm', time:s.walkPm, icon:'🌙',
    title:t('Вечерний выгул'), sub:t('{min} мин · закрепление {train} мин', { min:s.walkMin, train:trainMin }),
    minutes:s.walkMin, trainMin, training:sessionSkills(skills, 'pm', dateISO)
  });
  s.meals.forEach((time, i) => {
    const names = s.meals.length >= 4
      ? [t('Завтрак'), t('Второй завтрак'), t('Обед'), t('Ужин'), t('Поздний ужин')]
      : s.meals.length === 3 ? [t('Завтрак'), t('Обед'), t('Ужин')] : [t('Завтрак'), t('Ужин')];
    const cut = treatsKcal > 0 && i === s.meals.length - 1
      ? t(' · −{g} г за лакомства', { g: Math.round(treatsKcal / food.kcal100 * 100) }) : '';
    ev.push({
      id:`meal-${i}`, type:'meal', time:time, icon:'🍽️',
      title:names[i] || t('Кормление {n}', { n:i + 1 }),
      sub:t('{g} г', { g:food.perMeal }) + cut,
      grams:food.perMeal
    });
  });

  // Туалетные выходы: по формуле удержания, пока собака младше 8 месяцев
  if (months < 8) {
    const hold = holdHours(months) * 60;
    let at = minutesOf(s.walkAm) + hold;
    const end = minutesOf(s.walkPm);
    let i = 0;
    while (at < end - 60 && i < 6) {
      ev.push({ id:`potty-${i}`, type:'potty', time:timeOf(at), icon:'💧',
        title:t('Туалетный выход'), sub:t('5–10 мин, без нагрузки'), minor:true });
      at += hold; i++;
    }
    ev.push({ id:'potty-night', type:'potty', time:timeOf(minutesOf(dog.sleep || '22:30') - 30),
      icon:'💧', title:t('Последний выход'), sub:t('перед сном'), minor:true });
  }

  ev.sort((a, b) => minutesOf(a.time) - minutesOf(b.time));
  return { events:ev, food, schedule:s, trainMin, months };
}

export function dayTitle(dateISO) { return formatDate(dateISO); }

export function mainEvents(day) { return day.events.filter(e => !e.minor); }

export function progressOf(day, log) {
  const main = mainEvents(day);
  const done = main.filter(e => log.done?.[e.id]).length;
  return { done, total:main.length, pct: main.length ? done / main.length : 0 };
}

export function nextEvent(day, log, nowMin) {
  const pending = day.events.filter(e => !log.done?.[e.id]);
  const major = pending.filter(e => !e.minor);
  const pick = list => list.find(e => minutesOf(e.time) >= nowMin - 45) || list[0] || null;
  return pick(major) || pick(pending);
}
