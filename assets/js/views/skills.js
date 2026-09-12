import * as store from '../state.js';
import { SKILLS, STAGES } from '../data/skills.js';
import { NEW, LEARNING, PRACTICE, MAINTENANCE, MASTERED, MAX_LEARNING, MAX_POOL,
         activeSkills, learningSkills, lockReason, canTake, takeSkill, skillById } from '../training.js';
import { ageWeeks, plural } from '../algo.js';
import { bind, esc, icon, toast } from '../ui.js';
import { WEEKS } from '../data/weeks.js';

export default function skillsList() {
  const s = store.get(), dog = s.dog;
  const weeks = ageWeeks(dog.birth);
  const groups = [
    { title:'Учим сейчас',  hint:'основная работа на прогулках', list: SKILLS.filter(x => s.skills[x.id]?.stage === LEARNING) },
    { title:'Отрабатываем', hint:'закрепляем в отвлечениях',     list: SKILLS.filter(x => s.skills[x.id]?.stage === PRACTICE) },
    { title:'На поддержке', hint:'всплывают на проверку по интервалам', list: SKILLS.filter(x => s.skills[x.id]?.stage === MAINTENANCE) },
    { title:'Освоено',      hint:'работает надёжно',             list: SKILLS.filter(x => s.skills[x.id]?.stage === MASTERED) },
    { title:'В очереди',    hint:'откроются по возрасту и по мере освоения предыдущих',
      list: SKILLS.filter(x => (s.skills[x.id]?.stage ?? NEW) === NEW) }
  ].filter(g => g.list.length);

  return {
    html: `<div class="screen-head"><div class="over">Все команды</div>
      <h1>${SKILLS.length} ${plural(SKILLS.length, 'навык', 'навыка', 'навыков')}</h1>
      <div class="cap">Столько всего в программе. На прогулку попадают не все сразу —
        одновременно учим не больше ${MAX_LEARNING}, а всего в работе держим до ${MAX_POOL}.
        Иначе собака путается, а вы не успеваете за день.</div></div>
      <div class="screen" style="padding-top:8px">
        <div class="banner banner-info"><div>
          <b>Как открывается новая команда</b>Пять оценок «отлично» подряд переводят навык
          на следующую стадию: повторов становится меньше, а освободившийся слот занимает
          следующая команда из плана. Если команда открыта по возрасту, её можно взять и вручную.</div></div>

        ${groups.map(g => `
          <div class="section-title"><h2>${esc(g.title)}</h2>
            <span class="cap">${g.list.length}</span></div>
          <div class="cap" style="margin:-8px 0 12px">${esc(g.hint)}</div>
          <div class="stack">${g.list.map(x => row(x, s.skills, weeks)).join('')}</div>`).join('')}
      </div>`,
    mount(root) {
      bind(root, {
        open: el => { location.hash = '#/skill/' + el.dataset.id; },
        take: (el, e) => {
          e.stopPropagation();
          let ok = false;
          store.update(st => { ok = takeSkill(st.skills, el.dataset.id, weeks); });
          toast(ok ? `«${skillById(el.dataset.id).name}» — в работе с этой прогулки`
                   : 'Сейчас свободных слотов нет');
          setTimeout(() => location.reload(), 500);
        }
      });
    }
  };
}

function row(skill, skills, weeks) {
  const p = skills[skill.id] || { stage:NEW, streak:0 };
  const st = STAGES[p.stage];
  const lock = lockReason(skills, skill.id, weeks);
  const take = canTake(skills, skill.id, weeks);
  const week = WEEKS.find(w => w.new.includes(skill.id));
  let note = '';
  if (p.stage === NEW && lock) {
    if (lock.type === 'age') note = `Откроется в ${lock.weeks} ${plural(lock.weeks, 'неделю', 'недели', 'недель')} — сейчас рано по возрасту`;
    else if (lock.type === 'prereq') note = 'Сначала нужно отработать: ' + lock.ids.map(i => esc(skillById(i).name)).join(', ');
    else if (lock.type === 'slots') note = 'Открыта по возрасту, но все слоты заняты';
    else note = 'Готова к работе';
  } else {
    note = `${st.label} · ${st.reps} ${plural(st.reps, 'повтор', 'повтора', 'повторов')} · ${st.freq}`;
  }
  return `<div class="skill" data-act="open" data-id="${skill.id}">
    <div class="grow">
      <div style="font-weight:600">${esc(skill.name)}</div>
      <div class="cap">${note}</div>
      ${week ? `<div class="cap">По плану: неделя ${week.n}</div>` : ''}
    </div>
    ${p.stage === LEARNING || p.stage === PRACTICE
      ? `<div class="dots">${[0,1,2,3,4].map(i => `<i class="dot ${i < p.streak ? 'dot-on' : ''}"></i>`).join('')}</div>` : ''}
    ${take ? `<button class="btn btn-sm" data-act="take" data-id="${skill.id}">Взять</button>` : ''}
    <span style="color:var(--text-3)">${icon('chevron', 18)}</span>
  </div>`;
}
