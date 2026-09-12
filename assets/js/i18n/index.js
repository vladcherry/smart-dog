// Локализация. Ключ перевода — сама русская строка: так не нужно выдумывать
// идентификаторы, а отсутствие перевода деградирует до понятного текста, а не до «ui.foo.bar».
export const LANGS = [
  { code:'ru', name:'Русский',    flag:'🇷🇺' },
  { code:'uk', name:'Українська', flag:'🇺🇦' },
  { code:'en', name:'English',    flag:'🇬🇧' },
  { code:'es', name:'Español',    flag:'🇪🇸' }
];

const KEY = 'smartdog.lang';
const PLURAL_ORDER = { ru:['one','few','many'], uk:['one','few','many'], en:['one','other'], es:['one','other'] };

let lang = 'ru';
let dict = { ui:{} };
let fallback = null;          // русский контент как запасной вариант

export function getLang() { return lang; }
export function langInfo(code = lang) { return LANGS.find(l => l.code === code) || LANGS[0]; }

export function savedLang() {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

/** Язык из настроек браузера: ru, uk, en, es — иначе английский */
export function detectLang() {
  const list = navigator.languages?.length ? navigator.languages : [navigator.language || 'en'];
  for (const raw of list) {
    const code = String(raw).toLowerCase().split('-')[0];
    if (LANGS.some(l => l.code === code)) return code;
    if (code === 'be' || code === 'kk' || code === 'ky') return 'ru';  // ближайший понятный
    if (code === 'ca' || code === 'gl') return 'es';
  }
  return 'en';
}

export async function initI18n() {
  fallback = (await import('./content-ru.js')).default;
  await apply(savedLang() || detectLang());
}

export async function setLang(code) {
  try { localStorage.setItem(KEY, code); } catch {}
  await apply(code);
}

async function apply(code) {
  if (!LANGS.some(l => l.code === code)) code = 'en';
  const mod = await import(`./${code}.js`);
  dict = mod.default;
  lang = code;
  document.documentElement.lang = code;
}

/** Перевод строки. Ключ — русский текст. {n} и другие переменные подставляются. */
export function t(key, vars) {
  const line = (dict.ui && dict.ui[key]) || key;
  return vars ? interpolate(line, vars) : line;
}

/**
 * Множественные формы. Ключ — формы через «|» на русском: 'день|дня|дней'.
 * В словаре лежит та же строка с формами нужного языка: 'day|days'.
 */
export function tp(key, n, vars) {
  const line = (dict.ui && dict.ui[key]) || key;
  const forms = line.split('|');
  const cat = new Intl.PluralRules(lang).select(n);
  const order = PLURAL_ORDER[lang] || ['one', 'other'];
  const idx = Math.max(0, order.indexOf(cat));
  return interpolate(forms[Math.min(idx, forms.length - 1)], { n, ...vars });
}

/** Число вместе с формой: «3 месяца», «3 months» */
export function tn(key, n, vars) { return n + ' ' + tp(key, n, vars); }

function interpolate(line, vars) {
  return String(line).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

/** Контент: если перевода нет, берём русский, чтобы экран не ломался */
export function c(path, id, field) {
  const from = src => {
    let node = src?.[path];
    if (!node) return undefined;
    node = field ? node[field] : node;
    return node?.[id];
  };
  const v = from(dict);
  return v !== undefined ? v : from(fallback);
}

/** Дата по правилам языка: «суббота, 12 сентября» */
export function formatDate(dateISO) {
  const d = new Date(dateISO + 'T12:00:00');
  return new Intl.DateTimeFormat(lang, { weekday:'long', day:'numeric', month:'long' }).format(d);
}
