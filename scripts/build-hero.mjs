#!/usr/bin/env node
// 从 assets/ascii.txt + scripts/stats.json 生成 assets/hero-dark.svg 与 hero-light.svg
// 用法: node scripts/build-hero.mjs
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

const ASCII = fs.readFileSync(path.join(ROOT, 'assets/ascii.txt'), 'utf8')
  .replace(/\r/g, '').replace(/\n+$/, '').split('\n');
const STATS = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/stats.json'), 'utf8'));

const COLS = Math.max(...ASCII.map(l => l.length));
const ROWS = ASCII.length;
const W = 880;
const H = 460;

const PAL = {
  dark: { bg:'#0A0B0A', panel:'#101310', rule:'#232A24', text:'#DDE4DA', mute:'#7C877E',
          phos:'#FFB000', online:'#6FE08A', art:'#FFB000' },
  light: { bg:'#F4F1E8', panel:'#EFEADC', rule:'#CFC8B4', text:'#16241A', mute:'#66715F',
          phos:'#0F5A34', online:'#1F7A46', art:'#0F5A34' },
};

const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const MONO = `ui-monospace,'SF Mono','Cascadia Mono','Roboto Mono',Menlo,Consolas,'Liberation Mono',monospace`;

function star(cx, cy, r, fill) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 === 0 ? r : r * 0.42;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(2)},${(cy + Math.sin(a) * rr).toFixed(2)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}"/>`;
}

function logLine(m) {
  const name = m.name.slice(0, 16).padEnd(16, ' ');
  const num = String(m.stars).padStart(3, ' ');
  return `MOD   ${name}${'.'.repeat(8)} ${num}`;
}

function build(mode) {
  const p = PAL[mode];
  const isDark = mode === 'dark';
  const o = [];

  o.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="ttl dsc">`);
  o.push(`<title id="ttl">550C operator console — yannicksong0106</title>`);
  o.push(`<desc id="dsc">Phosphor terminal profile card: ambient ASCII portrait, cold boot log, system readout and five counters.</desc>`);
  o.push(`<defs>`);
  if (isDark) {
    o.push(`<pattern id="grain" width="3" height="3" patternUnits="userSpaceOnUse"><rect y="0" width="3" height="1" fill="#000" opacity="0.5"/></pattern>`);
  } else {
    o.push(`<pattern id="grain" width="24" height="24" patternUnits="userSpaceOnUse"><rect y="23" width="24" height="1" fill="${p.rule}" opacity="0.5"/></pattern>`);
  }
  o.push(`<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="0.45" stop-color="#fff" stop-opacity="0.4"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`);
  o.push(`<mask id="fadeMask"><rect x="24" y="80" width="300" height="300" fill="url(#fade)"/></mask>`);
  o.push(`</defs>`);
  o.push(`<style>
text{font-family:${MONO}}
.k{font-size:10px;letter-spacing:2.2px;fill:${p.mute}}
.v{font-size:11px;fill:${p.text}}
.lbl{font-size:9px;letter-spacing:2.4px;fill:${p.mute}}
.num{font-size:17px;font-weight:700;letter-spacing:1px;fill:${p.phos}}
.cur{animation:blink 1.06s steps(2,start) infinite}
@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.cur{animation:none}}
</style>`);

  o.push(`<rect width="${W}" height="${H}" rx="12" fill="${p.bg}"/>`);
  o.push(`<rect width="${W}" height="${H}" rx="12" fill="url(#grain)" opacity="${isDark ? 0.34 : 0.18}"/>`);

  o.push(`<text x="24" y="45" font-size="26" font-weight="700" letter-spacing="3" fill="${p.phos}">550C</text>`);
  o.push(`<rect x="112" y="24" width="1" height="30" fill="${p.rule}"/>`);
  o.push(`<text x="126" y="37" class="k">OPERATOR CONSOLE</text>`);
  o.push(`<text x="126" y="52" class="k" opacity="0.7">REV 0.4.0 / COLD BOOT</text>`);
  o.push(`<text x="856" y="43" text-anchor="end" class="k" fill="${p.online}">READY</text>`);
  o.push(`<circle cx="800" cy="39" r="3.5" fill="${p.online}"/>`);
  o.push(`<rect x="24" y="66" width="832" height="1" fill="${p.rule}"/>`);

  o.push(`<rect x="24" y="80" width="300" height="300" fill="${p.panel}"/>`);
  o.push(`<g mask="url(#fadeMask)" opacity="0.3">`);
  const cellH = 300 / ROWS;
  const fsArt = Math.min(cellH * 0.96, 300 / COLS / 0.6);
  for (let i = 0; i < ROWS; i++) {
    const line = ASCII[i].padEnd(COLS, ' ').slice(0, COLS);
    const y = 80 + (i + 1) * cellH - cellH * 0.24;
    o.push(`<text x="24" y="${y.toFixed(2)}" font-size="${fsArt.toFixed(2)}" fill="${p.art}" textLength="300" lengthAdjust="spacing">${esc(line)}</text>`);
  }
  o.push(`</g>`);

  const bk = (x, y, sx, sy) => `<path d="M${x} ${y + sy * 14} L${x} ${y} L${x + sx * 14} ${y}" fill="none" stroke="${p.mute}" stroke-width="1" opacity="0.55"/>`;
  o.push(bk(32, 88, 1, 1), bk(316, 88, -1, 1), bk(32, 372, 1, -1), bk(316, 372, -1, -1));

  o.push(`<rect x="42" y="150" width="264" height="88" rx="3" fill="${p.bg}" opacity="0.94"/>`);
  o.push(`<rect x="42" y="150" width="264" height="88" rx="3" fill="none" stroke="${p.rule}"/>`);
  o.push(`<text x="174" y="204" text-anchor="middle" font-size="38" font-weight="700" letter-spacing="6" fill="${p.phos}">550C</text>`);
  o.push(`<text x="174" y="224" text-anchor="middle" class="lbl">OPERATOR 0106</text>`);

  [['ID','yannicksong0106'],['ROLE','SHITCODE PRODUCER'],['BASE','CHANGSHA / CN'],['STATUS','SHIPPING']]
    .forEach(([k, v], i) => {
      const y = 268 + i * 21;
      o.push(`<text x="42" y="${y}" class="k" opacity="0.75">${k}</text>`);
      o.push(`<text x="112" y="${y}" class="v">${esc(v)}</text>`);
    });
  o.push(`<rect x="42" y="342" width="264" height="1" fill="${p.rule}"/>`);
  o.push(`<text x="42" y="364" class="lbl" opacity="0.65">BUILD ${esc((STATS.updated || '').slice(5).replace('-', ''))} / PHOSPHOR</text>`);
  o.push(`<rect x="24" y="80" width="300" height="300" fill="none" stroke="${p.rule}"/>`);

  o.push(`<text x="344" y="97" class="k">POST / COLD BOOT</text>`);
  o.push(`<rect x="344" y="106" width="280" height="1" fill="${p.rule}"/>`);
  const mods = (STATS.modules || []).slice(0, 3).map(logLine);
  const log = [
    ['550C BIOS v0.4.0', p.phos, 1],
    ['CPU   human / 1 core', p.text, 0.88],
    ['MEM   check .......... OK', p.text, 0.88],
    ['SKIN  phosphor-amber .. OK', p.text, 0.88],
    ...mods.map(l => [l, p.text, 0.88]),
    ['NET   changsha.cn . LINKED', p.text, 0.88],
    ['BUS   dsh-plugins ..... ON', p.text, 0.88],
  ];
  log.forEach(([txt, color, op], i) => {
    o.push(`<text x="344" y="${130 + i * 23}" class="v" fill="${color}" opacity="${op}">${esc(txt)}</text>`);
  });
  o.push(`<text x="344" y="366" class="v" fill="${p.phos}">&#62; operator ready&#160;<tspan class="cur">_</tspan></text>`);

  o.push(`<text x="644" y="97" class="k">SYSTEM</text>`);
  o.push(`<rect x="644" y="106" width="212" height="1" fill="${p.rule}"/>`);
  [['OS','WIN 11 / 64'],['STACK','JS / PY / C++'],['FOCUS','DSH PLUGINS'],['EDITOR','VSCODE'],['SHELL','POWERSHELL'],['WEB','HNCSUT.CN']]
    .forEach(([k, v], i) => {
      const y = 132 + i * 26;
      o.push(`<text x="644" y="${y}" class="k" opacity="0.75">${k}</text>`);
      o.push(`<text x="716" y="${y}" class="v">${esc(v)}</text>`);
    });

  const wx = 644, wy = 296, ww = 212, wh = 46;
  o.push(`<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="none" stroke="${p.rule}"/>`);
  let d = '';
  for (let i = 0; i <= 44; i++) {
    const t = i / 44;
    const amp = Math.sin(t * Math.PI * 3.4) * (0.14 + 0.52 * Math.abs(Math.sin(t * 8.3)));
    const x = wx + 2 + t * (ww - 4);
    const y = wy + wh / 2 - amp * (wh / 2 - 7);
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)} `;
  }
  o.push(`<path d="${d.trim()}" fill="none" stroke="${p.phos}" stroke-width="1" opacity="0.7"/>`);
  o.push(`<text x="644" y="362" class="lbl" opacity="0.65">PHOSPHOR TRACE</text>`);

  o.push(`<rect x="24" y="400" width="832" height="44" fill="${p.panel}"/>`);
  [190.4, 356.8, 523.2, 689.6].forEach(x => o.push(`<rect x="${x.toFixed(1)}" y="400" width="1" height="44" fill="${p.rule}"/>`));
  o.push(`<rect x="24" y="400" width="832" height="44" fill="none" stroke="${p.rule}"/>`);

  const stats = [
    ['REPOS', String(STATS.repos ?? '—'), false],
    ['STARS', String(STATS.stars ?? '—'), true],
    ['FORKS', String(STATS.forks ?? '—'), true],
    ['FOLLOWERS', String(STATS.followers ?? '—'), false],
  ];
  stats.forEach(([k, v, withStar], i) => {
    const cx = 107.2 + i * 166.4;
    o.push(`<text x="${cx.toFixed(1)}" y="417" text-anchor="middle" class="lbl">${k}</text>`);
    o.push(`<text x="${(cx + (withStar ? -5 : 0)).toFixed(1)}" y="436" text-anchor="middle" class="num">${v}</text>`);
    if (withStar) o.push(star(cx + 18, 431, 5, p.phos));
  });

  const cx5 = 107.2 + 4 * 166.4;
  o.push(`<text x="${cx5.toFixed(1)}" y="417" text-anchor="middle" class="lbl">STATUS</text>`);
  o.push(`<circle cx="${(cx5 - 26).toFixed(1)}" cy="432" r="3.5" fill="${p.online}"/>`);
  o.push(`<text x="${(cx5 - 16).toFixed(1)}" y="436" font-size="11" letter-spacing="1.5" fill="${p.online}">ONLINE</text>`);

  o.push(`<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="12" fill="none" stroke="${p.rule}"/>`);
  o.push(`</svg>`);
  return o.join('\n') + '\n';
}

fs.writeFileSync(path.join(ROOT, 'assets/hero-dark.svg'), build('dark'));
fs.writeFileSync(path.join(ROOT, 'assets/hero-light.svg'), build('light'));
console.log(`built hero svg: ${ROWS}x${COLS} grid, stats ${JSON.stringify({repos:STATS.repos,stars:STATS.stars,forks:STATS.forks,followers:STATS.followers})}`);
