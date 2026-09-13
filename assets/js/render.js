// Мостик к перерисовке текущего экрана без перезагрузки страницы.
// Нужен, чтобы вид прогулки мог обновиться из общего модуля, не завязываясь на main.js.
let fn = null;
export function setRenderer(f) { fn = f; }
export function rerender() { if (fn) fn(); }
