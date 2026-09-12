// Доступ к переведённому контенту. Views не знают, из какого языка он пришёл.
import { c } from './index.js';
import { STAGES, RATINGS } from '../data/skills.js';
import { ARTICLES } from '../data/articles.js';

export const skillName = id => c('skills', id, 'name') || id;
export const skillWhat = id => c('skills', id, 'what') || '';
export const skillGear = id => c('skills', id, 'gear') || '';
export const skillCriterion = id => c('skills', id, 'criterion') || '';
export const skillSteps = id => c('skills', id, 'steps') || [];

export const stageLabel = i => c('stages', STAGES[i]?.id)?.label ?? '';
export const stageFreq  = i => c('stages', STAGES[i]?.id)?.freq ?? '';
export const ratingLabel = v => c('ratings', v)?.label ?? String(v);
export const ratingHint  = v => c('ratings', v)?.hint ?? '';

export const weekTheme = n => c('weeks', n)?.theme ?? '';
export const weekGoal  = n => c('weeks', n)?.goal ?? '';
export const phase = id => c('phases', id) ?? { title:'', age:'', task:'', risk:'' };

export const breedName = id => c('breeds', id) ?? id;
export const group = k => c('groups', k) ?? { label:k, hint:'' };
export const foodLabel = k => c('foods', k) ?? k;
export const categoryName = k => c('categories', k) ?? k;

/** Статья: структура из данных, текст из словаря */
export function article(id) {
  const meta = ARTICLES.find(a => a.id === id);
  if (!meta) return null;
  const text = c('articles', id) || {};
  return { ...meta, ...text };
}
export function articlesAll() { return ARTICLES.map(a => article(a.id)); }

/** Стадия навыка с числом повторов — для подписей */
export function stageInfoText(i) {
  return { label: stageLabel(i), freq: stageFreq(i), reps: STAGES[i]?.reps ?? 0 };
}
export { STAGES, RATINGS };
