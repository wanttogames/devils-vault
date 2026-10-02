/** Local, scalable artwork. No remote assets or font requests. */
let serial = 0;
const svg = (body: string, viewBox = '0 0 24 24', cls = 'ui-icon') => `<svg class="${cls}" viewBox="${viewBox}" fill="none" aria-hidden="true" focusable="false">${body}</svg>`;
export function icon(name: string): string {
  const paths: Record<string, string> = {
    coin: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6"/><path d="m12 7 3 5-3 5-3-5Z"/>',
    arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
    settings: '<path d="m10 3-.7 3-2.8 1-2.8-1-2 3 2.2 2v3L2 16l2 3 2.8-1 2.8 1 .7 3h4l.7-3 2.8-1 2.8 1 2-3-2.2-2v-3L22 9l-2-3-2.8 1-2.8-1L14 3Z"/><circle cx="12" cy="13" r="3"/>',
    upgrade: '<path d="m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3Z"/><path d="M12 8v8m-4-4h8"/>',
    records: '<path d="M5 3h14v18H5zM9 7h6M9 11h6M9 15h4"/>',
    shield: '<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
    eye: '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    lock: '<path d="M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5zM12 14v3"/>',
    flame: '<path d="M12 2c2 7 8 8 8 14a8 8 0 0 1-16 0c0-4 3-7 4-9 0 4 2 4 3 5 2-3 2-6 1-10Z"/>',
    exit: '<path d="M10 3H4v18h6M9 12h12m-5-5 5 5-5 5"/>',
    skull: '<path d="M5 15c-3-2-3-6-1-9 4-5 12-5 16 0 2 3 2 7-1 9l-2 1v5H7v-5Z"/><circle cx="8" cy="10" r="2"/><circle cx="16" cy="10" r="2"/><path d="m12 13-1 3h2ZM10 18v3m4-3v3"/>',
    crown: '<path d="m3 6 5 4 4-7 4 7 5-4-3 13H6ZM7 22h10"/>',
    card: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="m12 7 3 5-3 5-3-5Z"/>',
  };
  return svg(`<g stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">${paths[name] ?? paths.upgrade}</g>`);
}
export function sigil(): string {
  return svg('<circle cx="100" cy="100" r="91"/><circle cx="100" cy="100" r="78"/><path d="m100 24 23 53 58 23-58 23-23 53-23-53-58-23 58-23Z"/><path d="m100 59 14 27 27 14-27 14-14 27-14-27-27-14 27-14Z"/><circle cx="100" cy="100" r="13"/><path d="M100 6v12m0 164v12M6 100h12m164 0h12m-160-68 8 8m120 120 8 8m0-136-8 8M40 160l-8 8"/>', '0 0 200 200', 'sigil-art');
}
export function vaultArt(): string {
  const id = `vault-${++serial}`;
  const rivets = Array.from({ length: 24 }, (_, i) => {
    const a = i * Math.PI / 12;
    return `<circle cx="${260 + 147 * Math.cos(a)}" cy="${267 + 147 * Math.sin(a)}" r="3.5" fill="#bd9252" stroke="#251c12" stroke-width="2"/>`;
  }).join('');
  return svg(`<defs>
    <radialGradient id="${id}-metal"><stop stop-color="#4d4738"/><stop offset=".56" stop-color="#272924"/><stop offset="1" stop-color="#141a18"/></radialGradient>
    <linearGradient id="${id}-gold" x2=".9" y2="1"><stop stop-color="#e9d5a0"/><stop offset=".4" stop-color="#987944"/><stop offset=".65" stop-color="#493a25"/><stop offset="1" stop-color="#b49458"/></linearGradient>
    <linearGradient id="${id}-stone" x2="1" y2="1"><stop stop-color="#31342d"/><stop offset="1" stop-color="#111816"/></linearGradient>
    <radialGradient id="${id}-glow"><stop stop-color="#c44d33" stop-opacity=".65"/><stop offset="1" stop-color="#8e3325" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse cx="260" cy="470" rx="210" ry="24" fill="#050807" opacity=".7"/>
  <path d="M43 474V243C43 109 121 31 260 31s217 78 217 212v231Z" fill="url(#${id}-stone)" stroke="#495044" stroke-width="2"/>
  <path d="M71 458V248c0-118 69-188 189-188s189 70 189 188v210Z" fill="#0c1210" stroke="#4c4b3b" stroke-width="5"/>
  <g stroke="#060c09" stroke-width="3" opacity=".8"><path d="M44 225h33m-34 71h36m-36 73h36m-34 68h37m-19-292 36 17m3-67 32 23m24-68 16 31m83-52v34m87-19-12 33m75 12-22 24m71 35-31 17m32 58h-30m33 71h-33m33 71h-33m34 71h-34"/></g>
  <path d="M96 445V248c0-101 58-160 164-160s164 59 164 160v197Z" fill="url(#${id}-metal)" stroke="#706347" stroke-width="2"/>
  <g stroke="#63604c" stroke-opacity=".45"><path d="M108 391h304M108 417h304M119 179h282M106 354h309"/><path d="M140 118v297M380 118v297M260 93v339"/></g>
  <circle cx="260" cy="267" r="167" fill="#121a16" stroke="url(#${id}-gold)" stroke-width="8"/>
  <circle cx="260" cy="267" r="154" fill="url(#${id}-metal)" stroke="#665d43" stroke-width="2"/>
  <circle cx="260" cy="267" r="129" fill="none" stroke="#a1844e" stroke-width="2"/>
  <circle cx="260" cy="267" r="121" fill="#151d18" stroke="#3d4436" stroke-width="2"/>
  ${rivets}
  <g stroke="url(#${id}-gold)" stroke-width="9" stroke-linecap="square"><path d="m163 170 28 28m138 138 28 28M123 267h40m194 0h40m-137-137v40m0 194v40m-97-40 28-28m138-138 28-28"/></g>
  <circle cx="260" cy="267" r="110" fill="url(#${id}-glow)"/>
  <g class="vault-rune" stroke="#be543c" fill="none" stroke-width="2"><circle cx="260" cy="267" r="91"/><circle cx="260" cy="267" r="78" stroke-dasharray="3 8"/><path d="m260 185 25 57 57 25-57 25-25 57-25-57-57-25 57-25Z"/><path d="m260 222 14 31 31 14-31 14-14 31-14-31-31-14 31-14Z"/><circle cx="260" cy="267" r="12"/></g>
  <g fill="#272f25" stroke="#b19054" stroke-width="2"><path d="M93 222h23v28H93zM93 295h23v28H93zM404 222h23v28h-23zM404 295h23v28h-23z"/></g>
  <g class="vault-chain" stroke="#847154" stroke-width="3" fill="none">${Array.from({ length: 9 }, (_, i) => `<ellipse cx="${100 + i * 39}" cy="${380 + Math.sin(i / 8 * Math.PI) * 30}" rx="22" ry="8" transform="rotate(${12 - i * 3} ${100 + i * 39} ${380 + Math.sin(i / 8 * Math.PI) * 30})"/>`).join('')}</g>
  <path d="M241 408v-13a19 19 0 0 1 38 0v13" stroke="#c2a56b" stroke-width="5"/><path d="m239 406 42 0 5 44-52 0Z" fill="#4b3527" stroke="#ba9053" stroke-width="2"/><circle cx="260" cy="422" r="5" fill="#b65137"/><path d="M260 426v11" stroke="#b65137" stroke-width="3"/>
  <g fill="#88784e"><circle cx="54" cy="449" r="4"/><circle cx="467" cy="449" r="4"/></g>
  `,'0 0 520 500','vault-art');
}
export function chestArt(type = 'sealed', opened = false): string {
  const id = `chest-${++serial}`;
  const ruin = type === 'ruin' || type === 'curse';
  const accent = ruin ? '#bc5144' : type === 'relic' ? '#8bb6a1' : '#d1ac69';
  return svg(`<defs><linearGradient id="${id}-wood" x2=".3" y2="1"><stop stop-color="#4c4031"/><stop offset="1" stop-color="#201e18"/></linearGradient><linearGradient id="${id}-metal" x2=".6" y2="1"><stop stop-color="#c4ad76"/><stop offset=".3" stop-color="#7a6b45"/><stop offset=".6" stop-color="#3c392a"/><stop offset="1" stop-color="#a99360"/></linearGradient><radialGradient id="${id}-glow"><stop stop-color="${accent}" stop-opacity=".65"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="140" cy="196" rx="107" ry="13" fill="#030706" opacity=".7"/>
    ${opened ? `<ellipse cx="140" cy="123" rx="105" ry="87" fill="url(#${id}-glow)"/>` : ''}
    <path d="m40 97 199 0 0 83-14 13H54l-14-13Z" fill="url(#${id}-wood)" stroke="#151911" stroke-width="3"/>
    <g stroke="#786c4d" stroke-opacity=".35"><path d="M45 125h190M45 156h190M45 178h190M94 107v76M184 107v76"/></g>
    <g class="chest-lid ${opened ? 'is-open' : ''}" ${opened ? 'transform="translate(0 -22) scale(1 .78)"' : ''}><path d="M38 99V80q5-44 33-47h139q30 3 33 47v19Z" fill="url(#${id}-wood)" stroke="#161b13" stroke-width="3"/><path d="M38 99h205M47 61h186M52 45h176" stroke="#85764b" stroke-opacity=".4"/><path d="M71 34h17v63H71ZM192 34h17v63h-17Z" fill="url(#${id}-metal)" stroke="#2f3523" stroke-width="2"/><path d="M38 93h205v11H38Z" fill="url(#${id}-metal)"/>
      ${!opened ? '<path d="m140 42 19 17-5 23-14 11-14-11-5-23Z" fill="#532f27" stroke="#bf7453"/><path d="m140 50 4 12 12 4-12 4-4 12-4-12-12-4 12-4Z" fill="#d27c59"/>' : ''}</g>
    <path d="M72 106h16v80H72ZM192 106h16v80h-16Z" fill="url(#${id}-metal)" stroke="#2f3523" stroke-width="2"/>
    <path d="M40 178h199v11H40Z" fill="url(#${id}-metal)"/>
    <g fill="#d2b67c" stroke="#302c1e"><circle cx="79" cy="116" r="3"/><circle cx="79" cy="166" r="3"/><circle cx="200" cy="116" r="3"/><circle cx="200" cy="166" r="3"/></g>
    <path d="m120 102 40 0-4 43-16 14-16-14Z" fill="#292d22" stroke="${accent}" stroke-width="2"/><circle cx="140" cy="120" r="6" fill="${accent}"/><path d="M140 124v12" stroke="${accent}" stroke-width="4"/>
    ${opened && !ruin ? `<g fill="${accent}" stroke="#5d4b29"><ellipse cx="114" cy="105" rx="12" ry="5"/><ellipse cx="165" cy="99" rx="12" ry="5"/><ellipse cx="140" cy="108" rx="15" ry="5"/></g><g class="reward-sparks" fill="${accent}"><path d="m104 61 3 6 6 3-6 3-3 6-3-6-6-3 6-3ZM175 44l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/></g>` : ''}
  `,'0 0 280 215','chest-art');
}
