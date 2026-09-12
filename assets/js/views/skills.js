import * as store from '../state.js';
import { SKILLS } from '../data/skills.js';
import { NEW, LEARNING, PRACTICE, MAINTENANCE, MASTERED, MAX_LEARNING, MAX_POOL,
         lockReason, canTake, takeSkill } from '../training.js';
import { ageWeeks } from '../algo.js';
import { bind, esc, icon, toast } from '../ui.js';
import { WEEKS } from '../data/weeks.js';
import { t, tn } from '../i18n/index.js';
import { skillName, stageInfoText } from '../i18n/content.js';

export default function skillsList() {
  const s = store.get(), dog = s.dog;
  const weeks = ageWeeks(dog.birth);
  const at = stage => SKILLS.filter(x => (s.skills[x.id]?.stage ?? NEW) === stage);
  const groups = [
    { title:t('Учим сейчас'),  hint:t('основная работа на прогулках'),  list:at(LEARNING) },
    { title:t('Отрабатываем'), hint:t('закрепляем в отвлечениях'),      list:at(PRACTICE) },
    { title:t('На поддержке'), hint:t('всплывают на проверку по интервалам'), list:at(MAINTENANCE) },
    { title:t('Освоено'),      hint:t('работает надёжно'),              list:at(MASTERED) },
    { title:t('В очереди'),    hint:t('откроются по возрасту и по мере освоения предыдущих'), list:at(NEW) }
  ].filter(g => g.list.length);

  return {
    html: `<div class="screen-head"><div class="over">${t('Все команды')}</div>
      <h1>${tn('навык|навыка|навыков', SKILLS.length)}</h1>
      <div class="cap">${t('Столько всего в программе. На прогулку попадают не все сразу — одновременно учим не больше {learn}, а всего в работе держим до {pool}. Иначе собака путается, а вы не успеваете за день.',
        { learn:MAX_LEARNING, pool:MAX_POOL })}</div></div>
      <div class="screen" style="padding-top:8px">
        <div class="banner banner-info"><div>
          <b>${t('Как открывается новая команда')}</b>${t('Пять оценок «отлично» подряд переводят навык на следующую стадию: повторов становится меньше, а освободившийся слот занимает следующая команда из плана. Если команда открыта по возрасту, её можно взять и вручную.')}</div></div>

        ${groups.map(g => `
          <div class="section-title"><h2>${g.title}</h2>
            <span class="cap">${g.list.length}</span></div>
          <div class="cap" style="margin:-8px 0 12px">${g.hint}</div>
          <div class="stack">${g.list.map(x => row(x, s.skills, weeks)).join('')}</div>`).join('')}
      </div>`,
    mount(root) {
      bind(root, {
        open: el => { location.hash = '#/skill/' + el.dataset.id; },
        take: (el, e) => {
          e.stopPropagation();
          let ok = false;
          store.update(st => { ok = takeSkill(st.skills, el.dataset.id, weeks); });
          toast(ok ? t('«{name}» — в работе с этой прогулки', { name:skillName(el.dataset.id) })
                   : t('Сейчас свободных слотов нет'));
          setTimeout(() => location.reload(), 500);
        }
      });
    }
  };
}

function row(skill, skills, weeks) {
  const p = skills[skill.id] || { stage:NEW, streak:0 };
  const st = stageInfoText(p.stage);
  const lock = lockReason(skills, skill.id, weeks);
  const take = canTake(skills, skill.id, weeks);
  const week = WEEKS.find(w => w.new.includes(skill.id));
  let note = '';
  if (p.stage === NEW && lock) {
    if (lock.type === 'age') note = t('Откроется в {weeks} — сейчас рано по возрасту',
      { weeks: tn('неделю|недели|недель', lock.weeks) });
    else if (lock.type === 'prereq') note = t('Сначала нужно отработать: {list}',
      { list: lock.ids.map(i => esc(skillName(i))).join(', ') });
    else if (lock.type === 'slots') note = t('Открыта по возрасту, но все слоты заняты');
    else note = t('Готова к работе');
  } else {
    note = `${st.label} · ${tn('повтор|повтора|повторов', st.reps)} · ${st.freq}`;
  }
  return `<div class="skill" data-act="open" data-id="${skill.id}">
    <div class="grow">
      <div style="font-weight:600">${esc(skillName(skill.id))}</div>
      <div class="cap">${note}</div>
      ${week ? `<div class="cap">${t('По плану: неделя {n}', { n:week.n })}</div>` : ''}
    </div>
    ${p.stage === LEARNING || p.stage === PRACTICE
      ? `<div class="dots">${[0,1,2,3,4].map(i => `<i class="dot ${i < p.streak ? 'dot-on' : ''}"></i>`).join('')}</div>` : ''}
    ${take ? `<button class="btn btn-sm" data-act="take" data-id="${skill.id}">${t('Взять')}</button>` : ''}
    <span style="color:var(--text-3)">${icon('chevron', 18)}</span>
  </div>`;
}
