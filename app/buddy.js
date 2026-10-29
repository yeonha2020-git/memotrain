// 함께 크는 강아지 친구 '복실이' 그림 (SVG)
const STAGES = [
  { xp: 0, n: '아기' },
  { xp: 80, n: '꼬마' },
  { xp: 200, n: '씩씩한' },
  { xp: 400, n: '의젓한' },
  { xp: 700, n: '늠름한' },
  { xp: 1100, n: '멋쟁이' },
  { xp: 1700, n: '동네 대장' },
];

// slot이 같은 선물은 하나만 입을 수 있어요
const ITEMS = [
  { id: 'ribbon', slot: 'head', n: '빨간 리본' },
  { id: 'flower', slot: 'head', n: '꽃핀' },
  { id: 'gat', slot: 'head', n: '선비 갓' },
  { id: 'jokduri', slot: 'head', n: '족두리' },
  { id: 'glasses', slot: 'face', n: '동그란 안경' },
  { id: 'scarf', slot: 'neck', n: '파란 목도리' },
  { id: 'bowtie', slot: 'neck', n: '나비넥타이' },
  { id: 'medal', slot: 'neck', n: '금메달' },
  { id: 'hanbok', slot: 'body', n: '색동저고리' },
  { id: 'pouch', slot: 'hand', n: '복주머니' },
  { id: 'fan', slot: 'hand', n: '태극 부채' },
];

const BUDDY = (() => {
  const FUR = '#FFF7EA';
  const LINE = '#5B4636';
  const EAR = '#E9C49A';
  const sw = `stroke="${LINE}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;

  const eyesOpen = `<g class="eyes">
    <circle cx="78" cy="84" r="7.5" fill="${LINE}"/><circle cx="122" cy="84" r="7.5" fill="${LINE}"/>
    <circle cx="75.5" cy="81.5" r="2.6" fill="#fff"/><circle cx="119.5" cy="81.5" r="2.6" fill="#fff"/></g>`;
  const FACE = {
    happy: eyesOpen + `<path d="M88 104 q6 7 12 0 q6 7 12 0" fill="none" ${sw}/>`,
    cheer: `<path d="M69 88 q9 -13 18 0 M113 88 q9 -13 18 0" fill="none" ${sw} stroke-width="4.5"/>
      <path d="M85 103 q15 26 30 0 z" fill="#7A2E2E" ${sw} stroke-width="3"/>
      <ellipse cx="100" cy="115" rx="7.5" ry="5" fill="#FF8FA3"/>`,
    aww: eyesOpen + `<path d="M66 72 l18 -5 M134 72 l-18 -5" fill="none" ${sw}/>
      <path d="M91 110 q9 -6 18 0" fill="none" ${sw}/>`,
    sleepy: `<path d="M70 87 h16 M114 87 h16" fill="none" ${sw}/>
      <ellipse cx="100" cy="109" rx="4" ry="5" fill="#7A2E2E"/>
      <text x="150" y="40" font-size="22" font-weight="900" fill="#7C8DB5">z</text>
      <text x="164" y="24" font-size="16" font-weight="900" fill="#7C8DB5">z</text>`,
  };

  function flowerPin(x, y) {
    const petals = [0, 72, 144, 216, 288].map((a) => {
      const r = (a * Math.PI) / 180;
      return `<circle cx="${(x + Math.cos(r) * 8).toFixed(1)}" cy="${(y + Math.sin(r) * 8).toFixed(1)}" r="7" fill="#FF9EC4" stroke="${LINE}" stroke-width="2"/>`;
    }).join('');
    return petals + `<circle cx="${x}" cy="${y}" r="5" fill="#FFD54F" stroke="${LINE}" stroke-width="2"/>`;
  }

  const DRAW = {
    ribbon: `<g transform="translate(134 40) rotate(15)">
      <path d="M0 0 L-19 -12 L-19 12 Z M0 0 L19 -12 L19 12 Z" fill="#E53950" ${sw} stroke-width="2.5"/>
      <circle r="5.5" fill="#C2185B" stroke="${LINE}" stroke-width="2"/></g>`,
    flower: flowerPin(68, 42),
    gat: `<g>
      <path d="M44 44 q6 58 42 84 M156 44 q-6 58 -42 84" stroke="#2A2A2A" stroke-width="2" fill="none"/>
      <ellipse cx="100" cy="40" rx="66" ry="11" fill="#2A2A2A" fill-opacity=".72" stroke="#111" stroke-width="2"/>
      <path d="M80 40 v-26 q20 -8 40 0 v26 z" fill="#2A2A2A" fill-opacity=".9" stroke="#111" stroke-width="2"/></g>`,
    jokduri: `<g transform="translate(100 34)">
      <path d="M-18 6 L-13 -10 L-5 -2 L0 -15 L5 -2 L13 -10 L18 6 Z" fill="#2A2A2A" stroke="#111" stroke-width="2" stroke-linejoin="round"/>
      <circle cy="-15" r="4" fill="#E53950"/><circle cx="-13" cy="-10" r="3.2" fill="#2E7D5B"/>
      <circle cx="13" cy="-10" r="3.2" fill="#2B5C9E"/><circle cy="1" r="3.2" fill="#F2C14E"/></g>`,
    glasses: `<g fill="rgba(255,255,255,.25)" stroke="#3B2A20" stroke-width="3.5">
      <circle cx="78" cy="84" r="14"/><circle cx="122" cy="84" r="14"/></g>
      <path d="M92 83 q8 -6 16 0" stroke="#3B2A20" stroke-width="3.5" fill="none"/>`,
    scarf: `<path d="M58 124 q42 22 84 0 l2 14 q-44 24 -88 0 z" fill="#2B5C9E" ${sw} stroke-width="3"/>
      <path d="M112 134 l8 30 l14 -4 l-6 -28 z" fill="#2B5C9E" ${sw} stroke-width="3"/>
      <path d="M115 146 l14 -4 M118 156 l14 -4" stroke="#fff" stroke-width="3"/>`,
    bowtie: `<g transform="translate(100 135)">
      <path d="M0 0 L-17 -10 L-17 10 Z M0 0 L17 -10 L17 10 Z" fill="#7B3FA0" ${sw} stroke-width="2.5"/>
      <circle r="5" fill="#5E2B7E" stroke="${LINE}" stroke-width="2"/></g>`,
    medal: `<path d="M84 126 l16 22 l16 -22" fill="none" stroke="#E53950" stroke-width="6" stroke-linejoin="round"/>
      <circle cx="100" cy="153" r="13" fill="#F2C14E" stroke="#B8860B" stroke-width="3"/>
      <text x="100" y="158.5" text-anchor="middle" font-size="14" font-weight="900" fill="#8B5A00">1</text>`,
    hanbok: `<path d="M58 140 q42 -22 84 0 q4 18 -2 30 q-40 10 -80 0 q-6 -12 -2 -30 z" fill="#FFE6EE" ${sw} stroke-width="3"/>
      <path d="M86 128 l14 22 l14 -22" fill="none" stroke="#2B5C9E" stroke-width="5"/>
      <path d="M104 152 q12 4 8 24 M104 152 q2 9 -7 22" stroke="#E53950" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    pouch: `<path d="M130 160 v8" stroke="${LINE}" stroke-width="2.5"/>
      <path d="M121 174 q-7 22 14 24 q21 -2 14 -24 q-14 -6 -28 0 z" fill="#D7263D" ${sw} stroke-width="2.5"/>
      <rect x="120" y="169" width="30" height="7" rx="3.5" fill="#F2C14E" stroke="${LINE}" stroke-width="2"/>
      <text x="135" y="193" text-anchor="middle" font-size="12" font-weight="900" fill="#F2C14E">福</text>`,
    fan: `<g transform="rotate(-18 60 152)">
      <path d="M60 152 v20" stroke="#8B5A2B" stroke-width="4" stroke-linecap="round"/>
      <path d="M60 152 L35 152 A25 25 0 0 1 60 127 Z" fill="#D7263D"/>
      <path d="M60 152 L60 127 A25 25 0 0 1 85 152 Z" fill="#2B5C9E"/>
      <path d="M35 152 A25 25 0 0 1 85 152 Z" fill="none" stroke="${LINE}" stroke-width="2.5"/></g>`,
  };

  const SPARKLE = (x, y, s) =>
    `<path d="M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s} Z" fill="#F2C14E"/>`;

  // items: 입고 있는 선물 id 목록, stage: 0~6
  function svg({ mood = 'happy', items = [], stage = 0 } = {}) {
    const has = (k) => items.includes(k);
    const armFill = has('hanbok') ? 'url(#saekdong)' : FUR;
    return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="saekdong" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#E53950"/><stop offset=".2" stop-color="#E53950"/>
          <stop offset=".2" stop-color="#F2C14E"/><stop offset=".4" stop-color="#F2C14E"/>
          <stop offset=".4" stop-color="#2E7D5B"/><stop offset=".6" stop-color="#2E7D5B"/>
          <stop offset=".6" stop-color="#2B5C9E"/><stop offset=".8" stop-color="#2B5C9E"/>
          <stop offset=".8" stop-color="#FF9EC4"/><stop offset="1" stop-color="#FF9EC4"/>
        </linearGradient>
        <radialGradient id="glow"><stop offset="0" stop-color="#FFE08A" stop-opacity=".9"/><stop offset="1" stop-color="#FFE08A" stop-opacity="0"/></radialGradient>
      </defs>
      ${stage >= 6 ? '<circle cx="100" cy="110" r="96" fill="url(#glow)"/>' : ''}
      <ellipse cx="100" cy="193" rx="52" ry="7" fill="rgba(0,0,0,.12)"/>
      <path class="tail" d="M136 160 q32 -6 28 -38 q-2 -7 -9 -2 q2 24 -22 28 z" fill="${FUR}" ${sw} stroke-width="3"/>
      <ellipse cx="100" cy="152" rx="44" ry="38" fill="${FUR}" ${sw}/>
      ${has('hanbok') ? DRAW.hanbok : `<ellipse cx="100" cy="162" rx="25" ry="21" fill="#fff"/>`}
      <ellipse cx="80" cy="187" rx="14" ry="9" fill="${FUR}" ${sw} stroke-width="3"/>
      <ellipse cx="120" cy="187" rx="14" ry="9" fill="${FUR}" ${sw} stroke-width="3"/>
      <ellipse cx="68" cy="160" rx="11" ry="15" fill="${armFill}" ${sw} stroke-width="3"/>
      <ellipse cx="132" cy="160" rx="11" ry="15" fill="${armFill}" ${sw} stroke-width="3"/>
      ${has('pouch') ? DRAW.pouch : ''}${has('fan') ? DRAW.fan : ''}
      <ellipse cx="100" cy="82" rx="58" ry="50" fill="${FUR}" ${sw}/>
      ${stage <= 1 ? `<path d="M96 34 q4 -13 13 -7 q-9 0 -7 9" fill="none" ${sw} stroke-width="3"/>` : ''}
      <path d="M48 60 q-26 8 -20 50 q16 8 28 -16 z" fill="${EAR}" ${sw}/>
      <path d="M152 60 q26 8 20 50 q-16 8 -28 -16 z" fill="${EAR}" ${sw}/>
      <ellipse cx="66" cy="101" rx="9" ry="5.5" fill="#FFB3B3" opacity=".75"/>
      <ellipse cx="134" cy="101" rx="9" ry="5.5" fill="#FFB3B3" opacity=".75"/>
      ${FACE[mood] || FACE.happy}
      <ellipse cx="100" cy="96" rx="8.5" ry="6.5" fill="#3B2A20"/>
      <ellipse cx="97.5" cy="94" rx="2.6" ry="1.6" fill="#fff" opacity=".8"/>
      ${['scarf', 'bowtie', 'medal'].filter(has).map((k) => DRAW[k]).join('')}
      ${has('glasses') ? DRAW.glasses : ''}
      ${['ribbon', 'flower', 'gat', 'jokduri'].filter(has).map((k) => DRAW[k]).join('')}
      ${stage >= 5 ? SPARKLE(26, 40, 9) + SPARKLE(178, 70, 7) + SPARKLE(20, 140, 6) : ''}
    </svg>`;
  }

  return { svg };
})();
