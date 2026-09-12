// Демонстрационные данные: ?demo=1
import * as store from './state.js';
import { initSkills, unlockNext, rate } from './training.js';
import { todayISO, ageWeeks, DAY } from './algo.js';

export function seed() {
  const birth = new Date(Date.now() - 140 * DAY).toISOString().slice(0, 10);
  const dog = {
    name:'Рекс', emoji:'🦮', birth, breed:'labrador', group:'L', sex:'m', neutered:'no',
    foodType:'dry', foodKcal:380, activity:'mid', wake:'07:00', sleep:'22:30',
    schedule:{}, createdAt:todayISO(), bcs:'ok'
  };
  const weeks = ageWeeks(birth);
  const skills = initSkills(['name', 'place']);
  unlockNext(skills, weeks);                       // откроется «Сидеть»
  const days = [...Array(6)].map((_, i) => new Date(Date.now() - (6 - i) * DAY).toISOString().slice(0, 10));
  // четыре пятёрки подряд: пятая на первой же прогулке откроет новую команду
  days.slice(2).forEach(d => rate(skills, 'sit', 5, weeks, d));
  days.slice(0, 3).forEach(d => rate(skills, 'place', 4, weeks, d));
  const weights = [];
  for (let i = 16; i >= 0; i -= 2) {
    const date = new Date(Date.now() - i * 7 * DAY).toISOString().slice(0, 10);
    const w = ageWeeks(birth, new Date(date + 'T12:00:00'));
    weights.push({ date, kg: Math.round((0.36 * 32 * (w / 20) + 2) * 10) / 10 });
  }
  store.update(s => {
    s.dog = dog; s.skills = skills; s.weights = weights;
    s.walks = days.flatMap(d => [{ date:d, slot:'am', minutes:20 }, { date:d, slot:'pm', minutes:20 }]);
    days.forEach(d => { s.log[d] = { done:{ 'walk-am':true, 'walk-pm':true }, skipped:{}, treatsKcal:48 }; });
  });
  location.reload();
}
