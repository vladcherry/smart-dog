// Мелкие помощники рендеринга
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function esc(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

/** Делегирование: элементы с data-act получают обработчик из карты */
export function bind(root, map) {
  root.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el || !root.contains(el)) return;
    const fn = map[el.dataset.act];
    if (fn) { e.preventDefault(); fn(el, e); }
  });
  root.addEventListener('change', e => {
    const el = e.target.closest('[data-change]');
    if (!el) return;
    const fn = map[el.dataset.change];
    if (fn) fn(el, e);
  });
}

export const ICONS = {
  today:'<path d="M12 3v2M5.6 5.6l1.4 1.4M3 12h2M18.4 5.6 17 7M21 12h-2M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z"/>',
  plan:'<path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/>',
  book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
  profile:'<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0"/>',
  back:'<path d="M19 12H5M12 19l-7-7 7-7"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
  clock:'<path d="M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"/>'
};
export function icon(name, size = 24) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor"
    stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
}

export function ring(pct, size = 56) {
  const r = size / 2 - 4, c = 2 * Math.PI * r;
  return `<div class="ring" style="width:${size}px;height:${size}px">
    <svg width="${size}" height="${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" stroke="var(--surface-2)" stroke-width="6" fill="none"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" stroke="var(--brand)" stroke-width="6" fill="none"
        stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}"
        style="transition:stroke-dashoffset 600ms ease-in-out"/>
    </svg>
    <div class="ring-label">${Math.round(pct * 100)}%</div>
  </div>`;
}

let sheetEl = null;
export function sheet(html, onMount) {
  closeSheet();
  const back = document.createElement('div');
  back.className = 'sheet-back';
  back.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="sheet-handle"></div>${html}</div>`;
  back.addEventListener('click', e => { if (e.target === back) closeSheet(); });
  document.getElementById('overlay').appendChild(back);
  sheetEl = back;
  document.body.style.overflow = 'hidden';
  onMount?.(back.querySelector('.sheet'));
  return back;
}
export function closeSheet() {
  if (sheetEl) { sheetEl.remove(); sheetEl = null; document.body.style.overflow = ''; }
}
export function toast(text) {
  const t = document.createElement('div');
  t.textContent = text;
  t.style.cssText = `position:fixed;left:50%;bottom:86px;transform:translateX(-50%);z-index:60;
    background:var(--stone-800);color:#fff;padding:12px 18px;border-radius:999px;font-size:14px;
    box-shadow:0 8px 24px rgba(0,0,0,.25);max-width:90vw;text-align:center`;
  document.getElementById('overlay').appendChild(t);
  setTimeout(() => t.remove(), 2600);
}
