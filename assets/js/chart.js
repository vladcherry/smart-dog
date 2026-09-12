// Мини-график веса с коридором нормы
import { ageWeeks, pctOfAdult, predictAdultWeight } from './algo.js';

export function weightChart(dog, weights, { h = 180, months = 12 } = {}) {
  const pred = predictAdultWeight(dog, weights);
  if (!pred || !weights.length) return '<div class="empty"><div class="big">⚖️</div>Добавьте вес, чтобы увидеть кривую роста</div>';
  const w = 320, pad = { l:28, r:8, t:10, b:20 };
  const startW = ageWeeks(dog.birth, new Date(weights[0].date + 'T12:00:00'));
  const lastW = ageWeeks(dog.birth, new Date(weights[weights.length - 1].date + 'T12:00:00'));
  const maxW = Math.max(lastW + 8, 20), minW = Math.max(6, Math.floor(startW) - 1);
  const maxKg = Math.max(...weights.map(p => p.kg), pred.value * pctOfAdult(maxW, dog.group)) * 1.12;
  const x = wk => pad.l + (wk - minW) / (maxW - minW) * (w - pad.l - pad.r);
  const y = kg => h - pad.b - (kg / maxKg) * (h - pad.t - pad.b);

  const band = [], bandLow = [];
  for (let wk = minW; wk <= maxW; wk += 1) {
    const e = pred.value * pctOfAdult(wk, dog.group);
    band.push(`${x(wk)},${y(e * 1.15)}`);
    bandLow.unshift(`${x(wk)},${y(e * 0.85)}`);
  }
  const mid = [];
  for (let wk = minW; wk <= maxW; wk += 1) mid.push(`${x(wk)},${y(pred.value * pctOfAdult(wk, dog.group))}`);
  const pts = weights.map(p => {
    const wk = ageWeeks(dog.birth, new Date(p.date + 'T12:00:00'));
    return { x:x(wk), y:y(p.kg), kg:p.kg };
  });

  return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img"
      aria-label="График веса с коридором нормы">
    <polygon points="${band.join(' ')} ${bandLow.join(' ')}" fill="var(--moss-100)"/>
    <polyline points="${mid.join(' ')}" fill="none" stroke="var(--moss-300)" stroke-width="1.5" stroke-dasharray="4 4"/>
    <polyline points="${pts.map(p => p.x + ',' + p.y).join(' ')}" fill="none" stroke="var(--brand)"
      stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="var(--brand)"/>`).join('')}
    <text x="2" y="${y(maxKg * 0.9) + 4}" font-size="9" fill="var(--text-3)">${Math.round(maxKg * 0.9)} кг</text>
    <text x="2" y="${h - pad.b + 2}" font-size="9" fill="var(--text-3)">0</text>
    <text x="${pad.l}" y="${h - 4}" font-size="9" fill="var(--text-3)">${Math.round(minW)} нед.</text>
    <text x="${w - 46}" y="${h - 4}" font-size="9" fill="var(--text-3)">${Math.round(maxW)} нед.</text>
  </svg>`;
}
