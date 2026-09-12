import * as store from './state.js';
import { icon } from './ui.js';
import onboarding from './views/onboarding.js';
import today from './views/today.js';
import plan from './views/plan.js';
import book from './views/book.js';
import schedule from './views/schedule.js';
import profile from './views/profile.js';
import skillView from './views/skill.js';
import skillsList from './views/skills.js';
import walk from './views/walk.js';
import * as install from './install.js';

const app = document.getElementById('app');
let current = null;

const TABS = [
  { id:'today',   href:'#/today',   icon:'today',   label:'Сегодня' },
  { id:'plan',    href:'#/plan',    icon:'plan',    label:'План' },
  { id:'book',    href:'#/book',    icon:'book',    label:'Учебник' },
  { id:'profile', href:'#/profile', icon:'profile', label:'Профиль' }
];

function route() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [name, arg] = hash.split('/');
  if (!store.get().dog) return { view: onboarding(), tab: null };
  switch (name) {
    case 'plan':     return { view: plan(), tab:'plan' };
    case 'book':     return { view: book(arg), tab:'book' };
    case 'schedule': return { view: schedule(), tab:'profile' };
    case 'profile':  return { view: profile(), tab:'profile' };
    case 'skills':   return { view: skillsList(), tab:'profile' };
    case 'skill':    return { view: skillView(arg), tab:null };
    case 'walk':     return { view: walk(arg || 'am'), tab:null };
    default:         return { view: today(), tab:'today' };
  }
}

function tabsHtml(active) {
  if (!active) return '';
  return `<nav class="tabs">${TABS.map(t => `<a class="tab" href="${t.href}"
    ${t.id === active ? 'aria-current="page"' : ''}>${icon(t.icon)}<span>${t.label}</span></a>`).join('')}</nav>`;
}

function render() {
  current?.unmount?.();
  const { view, tab } = route();
  app.innerHTML = view.html;
  document.getElementById('overlay').innerHTML = '';
  document.body.style.overflow = '';
  view.mount?.(app);
  app.insertAdjacentHTML('beforeend', tabsHtml(tab));
  current = view;
  window.scrollTo(0, 0);
}

function applyTheme() {
  const pref = store.get().settings.theme || 'auto';
  const dark = pref === 'dark' || (pref === 'auto' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

window.addEventListener('hashchange', render);
install.init();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
applyTheme();
render();

// Service worker: офлайн и установка на домашний экран
if ('serviceWorker' in navigator && window.isSecureContext) {
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;   // первый запуск не перезагружаем
    reloading = true;
    location.reload();
  });
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

// Демо-режим: #/today?demo=1 наполняет приложение примером профиля
if (new URLSearchParams(location.search).get('demo') === '1' && !store.get().dog) {
  import('./demo.js').then(m => m.seed());
}
