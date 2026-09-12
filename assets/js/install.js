// Предложение установить приложение на домашний экран
import * as store from './state.js';
import { sheet, closeSheet, toast } from './ui.js';

const DAY = 86400000;
const SHOW_AFTER_MS = 8000;      // не лезем в первую секунду знакомства
const REPEAT_AFTER_DAYS = 7;     // повтор не раньше чем через неделю
const MAX_SHOWS = 3;             // и не больше трёх раз в принципе

let deferred = null;             // системное событие Chrome
let bar = null;
let armed = false;

export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: fullscreen)').matches ||
         navigator.standalone === true;
}
export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
function isIOSSafari() {
  return isIOS() && !/crios|fxios|edgios|opios/i.test(navigator.userAgent);
}
export function canInstall() { return !isStandalone() && (!!deferred || isIOS()); }

function cfg() {
  const s = store.get();
  if (!s.settings.install) s.settings.install = { dismissedAt:null, shows:0, never:false };
  return s.settings.install;
}

export function init() {
  if (isStandalone()) return;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e;
    maybeShowBar();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    hideBar();
    toast('Готово — приложение на домашнем экране');
  });
  window.addEventListener('hashchange', () => {
    if (location.hash.startsWith('#/walk')) hideBar();
  });
  setTimeout(maybeShowBar, SHOW_AFTER_MS);
}

function maybeShowBar() {
  if (armed || bar || isStandalone()) return;
  if (!store.get().dog) return;                       // сначала пусть заведут профиль
  if (location.hash.startsWith('#/walk')) return;     // не мешаем на прогулке
  if (!deferred && !isIOS()) return;                  // браузер установку не умеет
  const c = cfg();
  if (c.never || c.shows >= MAX_SHOWS) return;
  if (c.dismissedAt && Date.now() - c.dismissedAt < REPEAT_AFTER_DAYS * DAY) return;
  armed = true;
  showBar();
  store.update(s => { s.settings.install.shows = (s.settings.install.shows || 0) + 1; });
}

function showBar() {
  bar = document.createElement('div');
  bar.className = 'install-bar';
  bar.innerHTML = `
    <img src="assets/icons/icon-192.png" alt="" width="40" height="40" class="install-icon">
    <div class="grow">
      <div class="install-title">На экран «Домой»</div>
      <div class="cap">Работает без сети</div>
    </div>
    <button class="btn btn-sm" data-i="go">Установить</button>
    <button class="install-x" data-i="close" aria-label="Закрыть">✕</button>`;
  bar.addEventListener('click', e => {
    const b = e.target.closest('[data-i]');
    if (!b) return;
    if (b.dataset.i === 'go') { hideBar(); openInstall(); }
    else { dismiss(); }
  });
  document.body.appendChild(bar);
}

function hideBar() { bar?.remove(); bar = null; }

function dismiss() {
  hideBar();
  store.update(s => { s.settings.install.dismissedAt = Date.now(); });
}

/** Точка входа из плашки и из настроек профиля */
export function openInstall() {
  if (isStandalone()) { toast('Приложение уже установлено'); return; }
  if (deferred) return systemPrompt();
  if (isIOS()) return iosSheet();
  androidSheet();
}

async function systemPrompt() {
  const e = deferred;
  deferred = null;
  e.prompt();
  const { outcome } = await e.userChoice;
  if (outcome === 'dismissed') {
    deferred = e;   // вернём — вдруг передумает и нажмёт из настроек
    store.update(s => { s.settings.install.dismissedAt = Date.now(); });
  }
}

function iosSheet() {
  const chrome = !isIOSSafari();
  sheet(`
    <div class="row" style="margin-bottom:16px">
      <img src="assets/icons/icon-192.png" alt="" width="56" height="56" class="install-icon">
      <div class="grow"><h2 style="font-size:20px;line-height:26px">Установить на iPhone</h2>
        <div class="cap">Займёт 15 секунд</div></div>
    </div>
    ${chrome ? `<div class="banner" style="margin-bottom:16px"><div>
      <b>Нужен Safari</b>Из этого браузера на iPhone установить нельзя — такой кнопки в нём нет.
      Откройте ссылку в Safari и повторите.</div></div>` : ''}
    <div class="stack">
      <div class="step"><b>1. Нажмите «Поделиться»</b>
        <div class="row" style="gap:8px;margin-top:6px">
          <span class="share-ico">${shareIcon()}</span>
          <span class="cap grow">Квадрат со стрелкой вверх — в нижней панели Safari,
            на iPad — в верхней</span>
        </div></div>
      <div class="step"><b>2. Пролистайте список вниз</b>
        <div class="cap" style="margin-top:4px">Пункт «На экран «Домой»» прячется ниже строки с приложениями</div></div>
      <div class="step"><b>3. Нажмите «На экран «Домой»»</b>
        <div class="cap" style="margin-top:4px">Имя уже подставлено — Smart Dog</div></div>
      <div class="step"><b>4. «Добавить» в правом верхнем углу</b>
        <div class="cap" style="margin-top:4px">Значок появится на домашнем экране, дальше открывайте приложение с него</div></div>
    </div>
    <div class="banner banner-info" style="margin-top:16px"><div>
      <b>Зачем это нужно</b>Без браузерной обвязки приложение занимает весь экран,
      работает без интернета и не теряет данные при очистке вкладок Safari.</div></div>
    <div class="btn-row" style="margin-top:20px">
      <button class="btn btn-sec" data-i="later">Позже</button>
      <button class="btn" data-i="ok">Понятно</button>
    </div>`, el => {
    el.querySelector('[data-i="ok"]').onclick = () => closeSheet();
    el.querySelector('[data-i="later"]').onclick = () => {
      store.update(s => { s.settings.install.dismissedAt = Date.now(); });
      closeSheet();
    };
  });
}

function androidSheet() {
  sheet(`
    <h2>Установить приложение</h2>
    <p class="cap" style="margin:8px 0 16px">Откройте меню браузера (три точки) и выберите
      «Установить приложение» или «Добавить на главный экран».</p>
    <button class="btn" data-i="ok">Понятно</button>`,
    el => { el.querySelector('[data-i="ok"]').onclick = closeSheet; });
}

function shareIcon() {
  return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
    stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 15V3m0 0L8 7m4-4 4 4"/>
    <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/></svg>`;
}
