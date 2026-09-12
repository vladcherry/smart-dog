// Сборка ленты дня: docs/03-concept-and-screens.md §3.3
import { effectiveSchedule, feedingPlan, holdHours, ageMonths, trainingMinutes,
         minutesOf, timeOf, plural } from './algo.js';
import { sessionSkills } from './training.js';

export function buildDay(dog, skills, dateISO, weightKg, treatsKcal = 0) {
  const now = new Date(dateISO + 'T12:00:00');
  const months = ageMonths(dog.birth, now);
  const s = effectiveSchedule(dog, now);
  const food = feedingPlan(dog, weightKg, treatsKcal, now);
  const trainMin = trainingMinutes(months);
  const ev = [];

  ev.push({
    id:'walk-am', type:'walk', slot:'am', time:s.walkAm, icon:'🐾',
    title:'Утренний выгул', sub:`${s.walkMin} мин · тренировка ${trainMin} мин`,
    minutes:s.walkMin, trainMin, training:sessionSkills(skills, 'am', dateISO)
  });
  ev.push({
    id:'walk-pm', type:'walk', slot:'pm', time:s.walkPm, icon:'🌙',
    title:'Вечерний выгул', sub:`${s.walkMin} мин · закрепление ${trainMin} мин`,
    minutes:s.walkMin, trainMin, training:sessionSkills(skills, 'pm', dateISO)
  });
  s.meals.forEach((t, i) => {
    const names = s.meals.length >= 4 ? ['Завтрак','Второй завтрак','Обед','Ужин','Поздний ужин']
                : s.meals.length === 3 ? ['Завтрак','Обед','Ужин'] : ['Завтрак','Ужин'];
    ev.push({
      id:`meal-${i}`, type:'meal', time:t, icon:'🍽️',
      title:names[i] || `Кормление ${i + 1}`,
      sub:`${food.perMeal} г${treatsKcal > 0 && i === s.meals.length - 1 ? ` · −${Math.round(treatsKcal / food.kcal100 * 100)} г за лакомства` : ''}`,
      grams:food.perMeal
    });
  });

  // Туалетные выходы: по формуле удержания, пока собака младше 8 месяцев
  if (months < 8) {
    const hold = holdHours(months) * 60;
    let t = minutesOf(s.walkAm) + hold;
    const end = minutesOf(s.walkPm);
    let i = 0;
    while (t < end - 60 && i < 6) {
      ev.push({ id:`potty-${i}`, type:'potty', time:timeOf(t), icon:'💧',
        title:'Туалетный выход', sub:'5–10 мин, без нагрузки', minor:true });
      t += hold; i++;
    }
    ev.push({ id:'potty-night', type:'potty', time:timeOf(minutesOf(dog.sleep || '22:30') - 30),
      icon:'💧', title:'Последний выход', sub:'перед сном', minor:true });
  }

  ev.sort((a, b) => minutesOf(a.time) - minutesOf(b.time));
  return { events:ev, food, schedule:s, trainMin, months };
}

export function dayTitle(dateISO) {
  const d = new Date(dateISO + 'T12:00:00');
  const days = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
  const mon = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  return `${days[d.getDay()]}, ${d.getDate()} ${mon[d.getMonth()]}`;
}

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

export { plural };
