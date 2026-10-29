'use strict';

const app = document.getElementById('app');
const KEY = 'memotrain-v1';
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

const GAMES = [
  { id: 'match', icon: '🎴', name: '추억의 물건 짝맞추기', desc: '같은 그림 두 장 찾기', color: '#C0392B', run: () => gameMatch() },
  { id: 'janggu', icon: '🥁', name: '사물놀이 장단 따라치기', desc: '소리 순서 기억하기', color: '#2B5C9E', run: () => gameJanggu() },
  { id: 'market', icon: '🧺', name: '장터 심부름', desc: '살 물건 기억하기', color: '#E8762D', run: () => gameMarket() },
  { id: 'story', icon: '📖', name: '옛날 이야기 기억하기', desc: '읽고 질문에 답하기', color: '#2E7D5B', run: () => gameStory() },
  { id: 'number', icon: '☎️', name: '손주 전화번호 외우기', desc: '숫자 기억하기', color: '#1F3A5F', run: () => gameNumber() },
  { id: 'song', icon: '🎵', name: '노래·속담 퀴즈', desc: '추억의 노래와 속담', color: '#D9A21B', run: () => gameSong() },
];
const MAX_LV = { match: 5, janggu: 6, market: 5, number: 6 };
const DAILY_GOAL = 3;
const DAILY_BONUS = 50;

// ---------- 저장 ----------
const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function freshToday() { return { date: dayKey(), done: [], bonus: false, checkin: false, xp: 0 }; }
function defaultState() {
  return {
    pet: '복실이', xp: 0, streak: 0, lastDay: null, days: 0,
    today: freshToday(), levels: {}, best: {}, plays: {}, history: {},
    items: [], equip: {}, storyIdx: 0,
    settings: { sound: true, voice: true, big: false },
  };
}

let S;
try { S = Object.assign(defaultState(), JSON.parse(localStorage.getItem(KEY) || '{}')); }
catch { S = defaultState(); }
S.settings = Object.assign(defaultState().settings, S.settings);
// 이전 버전(엽전)에서 넘어온 경우: 모은 엽전을 간식으로 바꿔 줍니다
if (S.totalCoins && !S.xp) S.xp = S.totalCoins;
['coins', 'totalCoins', 'tree', 'persimmons'].forEach((k) => delete S[k]);
if (S.today.coins != null) { S.today.xp = S.today.coins; delete S.today.coins; }

function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* 저장 공간 없음 */ } }

function rollDay() {
  if (S.today.date !== dayKey()) { S.today = freshToday(); save(); }
}

// 오늘 처음 활동하면 연속 출석 일수를 갱신
function markActive() {
  rollDay();
  const t = dayKey();
  if (S.lastDay === t) return;
  const y = new Date(); y.setDate(y.getDate() - 1);
  S.streak = S.lastDay === dayKey(y) ? S.streak + 1 : 1;
  S.lastDay = t;
  S.days += 1;
  save();
}

function addXp(n) {
  n = Math.max(0, Math.round(n));
  if (!n) return 0;
  const t = dayKey();
  S.xp += n; S.today.xp += n;
  S.history[t] = (S.history[t] || 0) + n;
  const keys = Object.keys(S.history).sort();
  while (keys.length > 60) delete S.history[keys.shift()];
  save();
  return n;
}

// ---------- 복실이 ----------
function stageOf(xp = S.xp) {
  let s = 0;
  STAGES.forEach((st, i) => { if (xp >= st.xp) s = i; });
  return s;
}
function growth(xp = S.xp) {
  const s = stageOf(xp);
  if (s === STAGES.length - 1) return { s, pct: 100, left: 0 };
  const a = STAGES[s].xp; const b = STAGES[s + 1].xp;
  return { s, pct: Math.round(((xp - a) / (b - a)) * 100), left: b - xp };
}
// 받침 유무에 따라 조사 고르기 (복실이가 / 바둑이가 / 멍멍이가)
function josa(word, withJong, without) {
  const c = word.charCodeAt(word.length - 1);
  const jong = c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 > 0;
  return word + (jong ? withJong : without);
}
const pet = () => S.pet || '복실이';
const stageName = (s = stageOf()) => `${STAGES[s].n} ${pet()}`;
const worn = () => Object.values(S.equip);
const buddySize = (s = stageOf()) => 130 + s * 20;

function buddy(mood = 'happy', { size = buddySize(), items = worn(), stage = stageOf(), cls = '' } = {}) {
  return `<div class="buddy ${mood} ${cls}" style="width:${size}px">${BUDDY.svg({ mood, items, stage })}</div>`;
}

function giveItem() {
  const left = ITEMS.filter((i) => !S.items.includes(i.id));
  if (!left.length) return null;
  const it = pick(left);
  S.items.push(it.id);
  S.equip[it.slot] = it.id;
  save();
  return it;
}

// 놀이 화면 위쪽의 작은 복실이가 맞히면 기뻐하고, 틀리면 다독여 줍니다
function react(mood, msg) {
  const box = $('#mini');
  if (!box) return;
  box.innerHTML = buddy(mood, { size: 58 }) + (msg ? `<div class="bubble mini-bubble">${msg}</div>` : '');
  clearTimeout(react.id);
  react.id = setTimeout(() => { if (box.isConnected) box.innerHTML = buddy('happy', { size: 58 }); }, 1800);
}
function yay(msg) { SFX.good(); react('cheer', msg || pick(['멍멍! 잘했어요!', '최고예요!', '와, 대단해요!', '역시!'])); }
function aww(msg) { SFX.bad(); react('aww', msg || pick(['괜찮아요~', '다시 해 봐요!', '천천히 해요', '아깝다!'])); }

// ---------- 도우미 ----------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rand = (n) => Math.floor(Math.random() * n);
function shuffle(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const pick = (a) => a[rand(a.length)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let timers = [];
const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };
const every = (fn, ms) => { const id = setInterval(fn, ms); timers.push(id); return id; };
function clearTimers() { timers.forEach((id) => { clearTimeout(id); clearInterval(id); }); timers = []; }

function on(sel, fn, root = document) { $$(sel, root).forEach((el) => el.addEventListener('click', (e) => fn(el, e))); }

function koreanDate(d = new Date()) {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEK[d.getDay()]}요일`;
}
const callName = () => '주인님';

function topBar(back = true) {
  return `<header class="top">
    ${back ? '<button class="btn-back" data-go="home">◀ 처음으로</button>' : `<div class="brand">🐾 기억력 쑥쑥</div>`}
    ${back ? `<div class="mini" id="mini">${buddy('happy', { size: 58 })}</div>` : `<div class="streak-chip">🔥 ${S.streak}일째</div>`}
  </header>`;
}

function render(html) {
  app.innerHTML = html;
  window.scrollTo(0, 0);
  on('[data-go]', (el) => go(el.dataset.go));
}

function go(name, ...args) {
  clearTimers();
  stopSpeak();
  rollDay();
  document.documentElement.classList.toggle('big', !!S.settings.big);
  SCREENS[name](...args);
}

function toast(msg, ms = 1800) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast.id);
  toast.id = setTimeout(() => { t.hidden = true; }, ms);
}

function petals() {
  for (let i = 0; i < 16; i++) {
    const p = document.createElement('span');
    p.className = 'petal';
    p.textContent = pick(['🌸', '🌼', '🦴', '✨']);
    p.style.left = `${Math.random() * 100}vw`;
    p.style.animationDuration = `${2.5 + Math.random() * 2.5}s`;
    p.style.animationDelay = `${Math.random() * 0.8}s`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 6000);
  }
}

// 복실이를 쓰다듬으면 하트가 퐁퐁
function hearts(el) {
  for (let i = 0; i < 5; i++) {
    const h = document.createElement('span');
    h.className = 'heart';
    h.textContent = pick(['❤️', '💕', '💛']);
    h.style.left = `${30 + Math.random() * 40}%`;
    h.style.animationDelay = `${i * 0.08}s`;
    el.appendChild(h);
    setTimeout(() => h.remove(), 1400);
  }
}
const PAT_LINES = () => [
  '헤헤, 간지러워요!', `${callName()} 최고!`, '꼬리가 저절로 흔들려요!', '멍! 멍!',
  '사랑해요 ❤️', '오늘도 같이 놀아요!', '손이 참 따뜻해요~',
];
function bindPat(sel, bubbleSel) {
  on(sel, (el) => {
    SFX.bark();
    const b = el.querySelector('.buddy');
    b.classList.remove('happy'); b.classList.add('cheer');
    b.innerHTML = BUDDY.svg({ mood: 'cheer', items: worn(), stage: stageOf() });
    hearts(el);
    const line = pick(PAT_LINES());
    $(bubbleSel).textContent = line;
    clearTimeout(bindPat.id);
    bindPat.id = setTimeout(() => {
      if (!b.isConnected) return;
      b.classList.remove('cheer'); b.classList.add('happy');
      b.innerHTML = BUDDY.svg({ mood: 'happy', items: worn(), stage: stageOf() });
    }, 1500);
  });
}

// ---------- 소리 (국악기 흉내) ----------
let AC = null;
function ac() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
function tone(freq, dur, type = 'sine', vol = 0.25, when = 0, slideTo = 0) {
  const c = ac(); const t = c.currentTime + when;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t); o.stop(t + dur + 0.05);
}
function noise(dur, vol, freq, when = 0) {
  const c = ac(); const t = c.currentTime + when;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t);
}
const RAW = {
  buk() { tone(120, 0.5, 'sine', 0.7, 0, 50); noise(0.08, 0.3, 250); },
  janggu() { tone(380, 0.18, 'triangle', 0.35, 0, 220); noise(0.12, 0.5, 1800); },
  kkwaenggwari() { [1750, 2330, 3070].forEach((f) => tone(f, 0.4, 'square', 0.045)); noise(0.18, 0.2, 5200); },
  jing() { tone(98, 1.8, 'sine', 0.55); tone(197, 1.6, 'sine', 0.18); tone(99.5, 1.8, 'sine', 0.2); },
  good() { [523, 587, 659, 784].forEach((f, i) => tone(f, 0.25, 'triangle', 0.22, i * 0.09)); },
  bad() { tone(262, 0.3, 'triangle', 0.2); tone(220, 0.45, 'triangle', 0.2, 0.2); },
  snack() { [784, 988, 1175].forEach((f, i) => tone(f, 0.18, 'triangle', 0.15, i * 0.07)); },
  bark() { tone(820, 0.11, 'triangle', 0.3, 0, 420); tone(760, 0.13, 'triangle', 0.28, 0.16, 380); },
  levelup() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.3, 'triangle', 0.2, i * 0.12)); },
  flip() { tone(660, 0.06, 'triangle', 0.12); },
  tap() { tone(500, 0.05, 'triangle', 0.1); },
};
const SFX = new Proxy(RAW, {
  get: (o, k) => () => { if (S.settings.sound) { try { o[k](); } catch { /* 소리 장치 없음 */ } } },
});

// ---------- 음성으로 읽어 주기 ----------
let koVoice = null;
function loadVoices() {
  try { koVoice = speechSynthesis.getVoices().find((v) => /^ko/i.test(v.lang)) || null; } catch { koVoice = null; }
}
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function speak(text) {
  if (!S.settings.voice || !koVoice) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = koVoice; u.lang = koVoice.lang; u.rate = 0.85;
    speechSynthesis.speak(u);
  } catch { /* 음성 기능 없음 */ }
}
function stopSpeak() { try { speechSynthesis.cancel(); } catch { /* 없음 */ } }

function growthBar(pct, id = '') {
  return `<div class="gbar"><i ${id ? `id="${id}"` : ''} style="width:${pct}%"></i></div>`;
}

// ---------- 결과 화면 ----------
function finish(id, r) {
  markActive();
  const g = GAMES.find((x) => x.id === id);
  const before = growth();
  const earned = addXp(r.snack);
  S.plays[id] = (S.plays[id] || 0) + 1;
  S.best[id] = Math.max(S.best[id] || 0, earned);

  let lvMsg = '';
  const lv = S.levels[id] || 1;
  if (MAX_LV[id]) {
    if (r.lv > 0 && lv < MAX_LV[id]) { S.levels[id] = lv + 1; lvMsg = `🎖️ 실력이 늘었어요! 다음에는 <b>${lv + 1}단계</b>로 도전해요.`; }
    else if (r.lv < 0 && lv > 1) { S.levels[id] = lv - 1; lvMsg = `다음에는 조금 쉽게 <b>${lv - 1}단계</b>로 해 볼게요.`; }
  }

  if (!S.today.done.includes(id)) S.today.done.push(id);
  let bonus = 0;
  if (S.today.done.length >= DAILY_GOAL && !S.today.bonus) { S.today.bonus = true; bonus = addXp(DAILY_BONUS); }
  const after = growth();
  const grew = after.s > before.s;
  const ratio = r.ratio ?? 0;
  const gift = grew || bonus || (ratio >= 0.9 && Math.random() < 0.35) ? giveItem() : null;
  save();

  const good = ratio >= 0.6;
  const title =
    ratio >= 0.9 ? pick(['정말 대단하세요!', '최고예요!', '기억력이 젊은이 못지않아요!']) :
    ratio >= 0.6 ? pick(['참 잘하셨어요!', '훌륭해요!', '아주 좋아요!']) :
    ratio >= 0.3 ? '잘하셨어요! 조금씩 늘고 있어요.' :
                   '괜찮아요! 하면 할수록 좋아져요.';
  const petLine = grew ? `${josa(pet(), '이', '가')} 쑥 컸어요!` :
    good ? pick(['간식 냠냠! 고마워요!', '멍멍! 신난다!', '우리 최고의 짝꿍!']) :
           pick(['같이 하니까 좋아요!', '다음엔 더 잘할 거예요!', '간식 잘 먹을게요~']);

  render(`${topBar()}
    <div class="result">
      <div class="hero-stage">
        <div class="bubble">${petLine}</div>
        <div class="pat" id="pat">${buddy(good || grew ? 'cheer' : 'happy', { stage: before.s, size: buddySize(before.s), cls: 'pop' })}</div>
      </div>
      <h2>${title}</h2>
      <p class="detail">${g.icon} ${g.name}<br>${r.detail || ''}</p>
      <div class="gain">🦴 간식 +${earned}</div>
      ${bonus ? `<div class="bonus">🎊 오늘의 훈련 ${DAILY_GOAL}가지 완료! 간식 <b>+${bonus}</b></div>` : ''}
      <div class="grow-box">
        <div class="grow-label"><b>${stageName(after.s)}</b><span>${after.left ? `다음 단계까지 🦴 ${after.left}` : '다 컸어요!'}</span></div>
        ${growthBar(grew ? 0 : before.pct, 'gfill')}
      </div>
      ${gift ? `<div class="gift">
          <div class="gift-pic">${buddy('cheer', { size: 90, items: [gift.id], stage: after.s })}</div>
          <div><b>🎁 새 선물!</b><br>${josa(pet(), '이', '가')} <b>${gift.n}</b>을(를) 받았어요.<br><span class="muted small">바로 입혀 드렸어요</span></div>
        </div>` : ''}
      ${lvMsg ? `<p class="lvmsg">${lvMsg}</p>` : ''}
      <button class="btn primary big" id="again">🔁 한 번 더 하기</button>
      <button class="btn" data-go="home">🏠 처음으로</button>
    </div>`);
  $('#mini').innerHTML = '';
  on('#again', () => go('game', id));
  later(() => { $('#gfill').style.width = `${after.pct}%`; }, 400);
  if (earned) SFX.snack();
  if (grew) {
    later(() => {
      const box = $('#pat');
      box.innerHTML = buddy('cheer', { stage: after.s, size: buddySize(after.s), cls: 'grow' });
      SFX.levelup(); petals();
      toast(`${stageName(before.s)} → ${stageName(after.s)}`, 2600);
    }, 1200);
  } else if (good || bonus) petals();
  bindPat('#pat', '.result .bubble');
  speak(`${title} ${petLine}`);
}

// ---------- 홈 ----------
function homeGreeting() {
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (S.today.done.length) return { mood: 'cheer', line: `오늘도 같이 놀아서 신나요! 멍멍!` };
  if (S.lastDay && S.lastDay < dayKey(y)) return { mood: 'aww', line: `${callName()}, 보고 싶었어요! 오늘은 같이 놀아요~` };
  if (new Date().getHours() < 9) return { mood: 'sleepy', line: `하암~ 좋은 아침이에요, ${callName()}!` };
  return { mood: 'happy', line: `${callName()} 오셨어요? 놀아 주시면 간식 먹고 쑥쑥 클게요!` };
}

function screenHome() {
  const doneCount = Math.min(S.today.done.length, DAILY_GOAL);
  const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);
  const gr = growth();
  const hi = homeGreeting();
  render(`${topBar(false)}
    <section class="hello">
      <div class="date">📅 ${koreanDate()}</div>
      <p>${DATA.sayings[doy % DATA.sayings.length]}</p>
    </section>

    <section class="pet-card">
      <div class="bubble">${hi.line}</div>
      <div class="pat" id="pat">${buddy(hi.mood)}</div>
      <div class="grow-label"><b>${stageName()}</b><span>${gr.left ? `다음 단계까지 🦴 ${gr.left}` : '다 컸어요!'}</span></div>
      ${growthBar(gr.pct)}
      <button class="btn" data-go="room">🏠 ${pet()} 집 · 선물 상자 (${S.items.length}/${ITEMS.length})</button>
    </section>

    ${S.today.checkin ? '' : `
      <button class="checkin" data-go="checkin">
        <span class="ico">🗓️</span>
        <span><b>오늘의 출석 도장 찍기</b><span class="muted">오늘은 무슨 요일일까요? (간식 +10)</span></span>
      </button>`}

    <section class="card-box mission">
      <h3>🎯 오늘의 훈련 ${doneCount} / ${DAILY_GOAL}</h3>
      <div class="dots">${Array.from({ length: DAILY_GOAL }, (_, i) => `<span class="dot ${i < doneCount ? 'on' : ''}">${i < doneCount ? '🐾' : ''}</span>`).join('')}</div>
      <div class="muted">${S.today.bonus ? '오늘 목표를 다 하셨어요! 정말 장하십니다 👍' : `놀이 ${DAILY_GOAL}가지를 하면 간식 ${DAILY_BONUS}개 + 🎁 선물!`}</div>
    </section>

    <div class="section-title">오늘은 어떤 놀이를 해 볼까요?</div>
    <div class="games">
      ${GAMES.map((g) => `
        <button class="tile" data-game="${g.id}" style="--c:${g.color}">
          ${S.today.done.includes(g.id) ? '<span class="done">✔ 오늘 함</span>' : (MAX_LV[g.id] ? `<span class="chip">${S.levels[g.id] || 1}단계</span>` : '')}
          <span class="emo">${g.icon}</span>
          <span class="nm">${g.name}</span>
          <span class="ds">${g.desc}</span>
        </button>`).join('')}
    </div>

    <div class="menu">
      <button data-go="room"><span class="emo">🎁</span>선물 상자</button>
      <button data-go="records"><span class="emo">📒</span>나의 기록</button>
      <button data-go="settings"><span class="emo">⚙️</span>설정</button>
    </div>`);
  on('[data-game]', (el) => { SFX.tap(); go('game', el.dataset.game); });
  bindPat('#pat', '.pet-card .bubble');
}

// ---------- 출석 (요일 맞히기) ----------
function screenCheckin() {
  const now = new Date();
  const order = [1, 2, 3, 4, 5, 6, 0];
  render(`${topBar()}
    <div class="game-title">🗓️ 오늘의 출석</div>
    <p class="guide">오늘은 무슨 요일일까요? 달력을 보지 말고 떠올려 보세요.</p>
    <div class="weekdays">${order.map((d) => `<button data-d="${d}">${WEEK[d]}</button>`).join('')}</div>
    <div id="out"></div>`);
  speak('오늘은 무슨 요일일까요?');
  on('[data-d]', (el) => {
    if (S.today.checkin) return;
    const ok = +el.dataset.d === now.getDay();
    $$('[data-d]').forEach((b) => { if (+b.dataset.d === now.getDay()) b.classList.add('right'); });
    if (!ok) el.classList.add('wrong');
    S.today.checkin = true;
    markActive();
    const got = addXp(ok ? 10 : 5);
    ok ? yay('딩동댕!') : aww('괜찮아요~');
    const msg = ok ? `맞아요! 오늘은 ${WEEK[now.getDay()]}요일입니다.` : `오늘은 ${WEEK[now.getDay()]}요일이에요. 내일도 꼭 맞혀 봐요!`;
    $('#out').innerHTML = `
      <div class="stamp">출석</div>
      <p class="center" style="font-size:1.2rem;font-weight:800">${msg}<br>📅 ${koreanDate(now)}</p>
      <p class="center"><span class="gain">🦴 간식 +${got}</span></p>
      <p class="center muted">🔥 ${S.streak}일째 함께하고 계세요!</p>
      <button class="btn primary big" data-go="home">놀이하러 가기 ▶</button>`;
    on('[data-go]', (b) => go(b.dataset.go), $('#out'));
    speak(msg);
  });
}

// ---------- 놀이 1: 추억의 물건 짝맞추기 ----------
function gameMatch() {
  const lv = S.levels.match || 1;
  const pairs = [3, 4, 6, 8, 10][lv - 1];
  const cols = [3, 4, 3, 4, 4][lv - 1];
  const items = shuffle(DATA.things).slice(0, pairs);
  const deck = shuffle([...items, ...items]);

  render(`${topBar()}
    <div class="game-title">🎴 짝맞추기 <span class="lv">${lv}단계</span></div>
    <p class="guide" id="guide">그림을 잘 보아 두세요! 곧 뒤집힙니다 👀</p>
    <div class="cards cols-${cols}">
      ${deck.map((c, i) => `
        <button class="mcard flipped" data-i="${i}">
          <div class="inner">
            <div class="face back"></div>
            <div class="face front"><span class="e">${c.e}</span><span class="n">${c.n}</span></div>
          </div>
        </button>`).join('')}
    </div>
    <div class="status">찾은 짝 <b id="found">0</b> / ${pairs}</div>`);
  speak('그림을 잘 보아 두세요.');

  let lock = true; let first = null; let found = 0; let misses = 0;
  const guide = $('#guide');
  later(() => {
    $$('.mcard').forEach((c) => c.classList.remove('flipped'));
    lock = false;
    guide.textContent = '같은 그림 두 장을 차례로 눌러 보세요.';
  }, 2500 + pairs * 450);

  on('.mcard', (el) => {
    if (lock || el.classList.contains('flipped')) return;
    el.classList.add('flipped'); SFX.flip();
    const i = +el.dataset.i;
    if (first === null) { first = i; return; }
    const prev = $(`.mcard[data-i="${first}"]`);
    const a = deck[first]; const b = deck[i];
    first = null;
    if (a.n === b.n) {
      found++;
      el.classList.add('matched'); prev.classList.add('matched');
      $('#found').textContent = found;
      guide.textContent = `${a.e} ${a.n}! 잘 찾으셨어요.`;
      yay(); speak(a.n);
      if (found === pairs) {
        lock = true;
        later(() => finish('match', {
          snack: pairs * 5 + (misses <= pairs ? 20 : 0),
          ratio: Math.max(0, 1 - misses / (pairs * 3)),
          lv: misses <= pairs ? 1 : misses > pairs * 3 ? -1 : 0,
          detail: `${pairs}쌍을 모두 찾았어요. (틀린 횟수 ${misses}번)`,
        }), 1100);
      }
    } else {
      misses++; lock = true;
      guide.textContent = '아니네요. 어디 있었는지 떠올려 보세요.';
      react('aww', '어디 있었더라~');
      later(() => { el.classList.remove('flipped'); prev.classList.remove('flipped'); lock = false; }, 1200);
    }
  });
}

// ---------- 놀이 2: 사물놀이 장단 따라치기 ----------
const PADS = [
  { k: 'buk', n: '북', sym: '◎', d: '둥' },
  { k: 'janggu', n: '장구', sym: '⧖', d: '덩' },
  { k: 'kkwaenggwari', n: '꽹과리', sym: '◉', d: '깽' },
  { k: 'jing', n: '징', sym: '◯', d: '징' },
];
function gameJanggu() {
  const lv = S.levels.janggu || 1;
  const step = Math.max(560, 1000 - lv * 70);
  let seq = []; let pos = 0; let lock = true; let started = false; let mistakes = 0; let done = 0;

  render(`${topBar()}
    <div class="game-title">🥁 사물놀이 장단 <span class="lv">${lv}단계</span></div>
    <p class="guide" id="guide">먼저 악기를 눌러 소리를 들어 보세요. 준비되면 [시작하기]를 누르세요.</p>
    <div class="pads">${PADS.map((p, i) => `<button class="pad pad-${p.k}" data-i="${i}"><span class="sym">${p.sym}</span>${p.n}<small>${p.d}~</small></button>`).join('')}</div>
    <div class="hearts" id="hearts">기회 ❤️❤️</div>
    <div class="status">기억한 장단 <b id="len">0</b>개</div>
    <button class="btn primary big" id="start">▶ 시작하기</button>`);

  const guide = $('#guide');
  function hit(i) {
    SFX[PADS[i].k]();
    const el = $(`.pad[data-i="${i}"]`);
    el.classList.add('lit');
    later(() => el.classList.remove('lit'), 380);
  }
  function play() {
    lock = true;
    guide.textContent = `잘 들어 보세요… 🎧 (${seq.length}번 칩니다)`;
    seq.forEach((k, i) => later(() => hit(k), 700 + i * step));
    later(() => { lock = false; pos = 0; guide.textContent = `이제 똑같이 따라 쳐 보세요! (${seq.length}번)`; }, 700 + seq.length * step);
  }
  function end() {
    later(() => finish('janggu', {
      snack: done * 5,
      ratio: Math.min(1, done / 7),
      lv: done >= 6 ? 1 : done <= 2 ? -1 : 0,
      detail: done ? `장단 ${done}개까지 기억하셨어요!` : '처음엔 누구나 어려워요. 다시 해 봐요!',
    }), 1500);
  }
  on('#start', (b) => {
    b.remove(); started = true;
    seq = [rand(4), rand(4)];
    play();
  });
  on('.pad', (el) => {
    const i = +el.dataset.i;
    if (!started) { hit(i); return; }
    if (lock) return;
    hit(i);
    if (i === seq[pos]) {
      pos++;
      if (pos === seq.length) {
        lock = true; done = seq.length;
        $('#len').textContent = done;
        const cheer = pick(['얼쑤!', '좋다!', '잘한다!', '얼씨구!']);
        guide.textContent = `${cheer} 잘하셨어요 👏`;
        later(() => yay(cheer), 350);
        if (seq.length >= 12) { end(); return; }
        later(() => { seq.push(rand(4)); play(); }, 1700);
      }
    } else {
      lock = true; mistakes++;
      later(() => aww(), 300);
      $('#hearts').textContent = `기회 ${'❤️'.repeat(2 - mistakes)}${'🤍'.repeat(mistakes)}`;
      if (mistakes >= 2) { guide.textContent = '여기까지! 수고 많으셨어요.'; end(); }
      else { guide.textContent = '아까워요! 한 번 더 들려 드릴게요.'; later(play, 1800); }
    }
  });
}

// ---------- 놀이 3: 장터 심부름 ----------
function gameMarket() {
  const lv = S.levels.market || 1;
  const n = Math.min(lv + 2, 7);
  const pool = shuffle(DATA.market);
  const list = pool.slice(0, n);
  const extra = pool.slice(n, n + Math.min(12 - n, n + 3));
  const secs = 5 + n * 2;

  render(`${topBar()}
    <div class="game-title">🧺 장터 심부름 <span class="lv">${lv}단계</span></div>
    <p class="guide">"장에 가서 이것 좀 사 오너라~" 쪽지를 잘 외워 두세요!</p>
    <div class="note">
      <h3>📝 심부름 쪽지</h3>
      <ul>${list.map((x) => `<li>${x.e} ${x.n}</li>`).join('')}</ul>
    </div>
    <div class="tbar"><i id="tbar"></i></div>
    <button class="btn primary big" id="ok">다 외웠어요 ▶</button>`);
  speak(`장에 가서 ${list.map((x) => x.n).join(', ')}, 사 오세요.`);

  let left = secs; let moved = false;
  const bar = $('#tbar');
  const choose = () => {
    if (moved) return; moved = true;
    clearTimers(); stopSpeak();
    chooseScreen();
  };
  every(() => { left -= 0.1; bar.style.width = `${Math.max(0, left / secs) * 100}%`; if (left <= 0) choose(); }, 100);
  on('#ok', choose);

  function chooseScreen() {
    const opts = shuffle([...list, ...extra]);
    const sel = new Set();
    render(`${topBar()}
      <div class="game-title">🧺 장터에 왔어요</div>
      <p class="guide">쪽지에 있던 물건 <b>${n}가지</b>를 골라 주세요.</p>
      <div class="choices">${opts.map((x, i) => `<button class="choice" data-i="${i}"><span class="e">${x.e}</span><span class="n">${x.n}</span></button>`).join('')}</div>
      <button class="btn green big" id="submit">다 골랐어요 (<span id="cnt">0</span>개)</button>`);
    speak(`쪽지에 있던 물건 ${n}가지를 골라 주세요.`);
    let checked = false;
    let finishMarket = () => {};
    on('.choice', (el) => {
      if (checked) return;
      const i = +el.dataset.i;
      sel.has(i) ? sel.delete(i) : sel.add(i);
      el.classList.toggle('sel');
      $('#cnt').textContent = sel.size;
      SFX.tap();
    });
    on('#submit', (btn) => {
      if (checked) { finishMarket(); return; }
      checked = true;
      let right = 0; let wrong = 0;
      opts.forEach((x, i) => {
        const el = $(`.choice[data-i="${i}"]`);
        const inList = list.includes(x);
        el.classList.remove('sel');
        if (sel.has(i) && inList) { el.classList.add('ok'); right++; }
        else if (sel.has(i)) { el.classList.add('no'); wrong++; }
        else if (inList) el.classList.add('miss');
      });
      right === n && !wrong ? yay('심부름 완벽해요!') : aww('거의 다 했어요!');
      btn.textContent = '결과 보기 ▶';
      $('.guide').innerHTML = `⭕ 맞힌 물건 <b>${right}</b>개 / ${n}개${wrong ? ` · ✖ 잘못 고른 물건 ${wrong}개` : ''}`;
      finishMarket = () => finish('market', {
        snack: Math.max(0, right * 8 - wrong * 2) + (right === n && !wrong ? 15 : 0),
        ratio: Math.max(0, (right - wrong) / n),
        lv: right === n && !wrong ? 1 : right < n / 2 ? -1 : 0,
        detail: `심부름 물건 ${n}가지 중 ${right}가지를 기억하셨어요.`,
      });
    });
  }
}

// ---------- 공통 퀴즈 진행 ----------
function runQuiz(qs, heading, done) {
  let idx = 0; let correct = 0;
  function show() {
    const q = qs[idx];
    render(`${topBar()}
      <div class="game-title">${heading}</div>
      <div class="progress">문제 ${idx + 1} / ${qs.length}</div>
      ${q.kind ? `<div class="q-kind">${q.kind}</div>` : ''}
      <div class="q-text">${q.q}</div>
      ${q.o.map((o, i) => `<button class="opt" data-i="${i}"><span class="no">${i + 1}</span>${o}</button>`).join('')}
      <div class="feedback" id="fb"></div>
      <div id="next"></div>`);
    speak(q.say || q.q);
    let answered = false;
    on('.opt', (el) => {
      if (answered) return; answered = true;
      const chosen = q.o[+el.dataset.i];
      const ok = chosen === q.a;
      $$('.opt').forEach((b) => { if (q.o[+b.dataset.i] === q.a) b.classList.add('right'); });
      const fb = $('#fb');
      if (ok) { correct++; yay(); fb.className = 'feedback good'; fb.textContent = pick(['딩동댕! 맞았어요 🎉', '정답이에요! 👏', '역시 기억력이 좋으세요!']); }
      else { el.classList.add('wrong'); aww(); fb.className = 'feedback bad'; fb.textContent = `아쉬워요. 정답은 "${q.a}" 이에요.`; }
      speak(ok ? '정답이에요' : `정답은 ${q.a} 입니다`);
      const last = idx === qs.length - 1;
      $('#next').innerHTML = `<button class="btn primary big" id="nx">${last ? '결과 보기 ▶' : '다음 문제 ▶'}</button>`;
      on('#nx', () => { stopSpeak(); if (last) done(correct); else { idx++; show(); } });
    });
  }
  show();
}

// ---------- 놀이 4: 옛날 이야기 기억하기 ----------
function gameStory() {
  const st = DATA.stories[S.storyIdx % DATA.stories.length];
  S.storyIdx++; save();
  const qs = shuffle(st.qs).slice(0, 3).map((q) => ({ q: q.q, a: q.a, o: shuffle([q.a, ...q.w]) }));

  render(`${topBar()}
    <div class="game-title">📖 ${st.title}</div>
    <p class="guide">이야기를 천천히 읽어 보세요. 다 읽으면 질문을 드릴게요.</p>
    <div class="story-box">${st.text}</div>
    <button class="btn primary big" id="ready">다 읽었어요 ▶</button>
    <button class="btn" id="listen">🔊 소리 내어 들려주세요</button>`);
  speak(st.text);
  on('#listen', () => speak(st.text));
  on('#ready', () => {
    stopSpeak();
    runQuiz(qs, `📖 ${st.title}`, (c) => finish('story', {
      snack: c * 10 + (c === qs.length ? 10 : 0),
      ratio: c / qs.length,
      detail: `${qs.length}문제 중 ${c}문제를 맞히셨어요.`,
    }));
  });
}

// ---------- 놀이 5: 손주 전화번호 외우기 ----------
function gameNumber() {
  const lv = S.levels.number || 1;
  const ROUNDS = 5;
  let len = Math.min(lv + 2, 9);
  let round = 0; let correct = 0; let snack = 0; let maxLen = 0;
  const who = ['큰손주', '막내 손주', '손녀', '둘째 아들', '큰딸', '사위', '며느리', '친구 순자'];
  const fmt = (s) => (s.length > 4 ? `${s.slice(0, s.length - 4)}-${s.slice(-4)}` : s);

  function showNum() {
    round++;
    const digits = Array.from({ length: len }, (_, i) => (i === 0 ? 1 + rand(9) : rand(10))).join('');
    const person = pick(who);
    const secs = 2 + len * 0.9;
    render(`${topBar()}
      <div class="game-title">☎️ 전화번호 외우기 <span class="lv">${lv}단계</span></div>
      <div class="progress">${round} / ${ROUNDS} 번째</div>
      <p class="guide">📞 ${person} 전화번호예요. 잘 외워 두세요!</p>
      <div class="phone"><div class="label">${person}</div><div class="num">${fmt(digits)}</div></div>
      <div class="tbar"><i id="tbar"></i></div>
      <button class="btn primary big" id="ok">다 외웠어요 ▶</button>`);
    speak(digits.split('').join(', '));
    let left = secs; let moved = false;
    const go2 = () => { if (moved) return; moved = true; clearTimers(); stopSpeak(); inputNum(digits, person); };
    every(() => { left -= 0.1; $('#tbar').style.width = `${Math.max(0, left / secs) * 100}%`; if (left <= 0) go2(); }, 100);
    on('#ok', go2);
  }

  function inputNum(digits, person) {
    let typed = '';
    render(`${topBar()}
      <div class="game-title">☎️ 전화번호 외우기</div>
      <div class="progress">${round} / ${ROUNDS} 번째</div>
      <p class="guide" id="guide">${person} 번호를 눌러 주세요. (${digits.length}자리)</p>
      <div class="phone"><div class="label">${person}</div><div class="num" id="typed">&nbsp;</div></div>
      <div class="keypad" id="pad">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button data-k="${d}">${d}</button>`).join('')}
        <button class="del" data-k="del">⌫ 지우기</button><button data-k="0">0</button><button class="ok" data-k="ok">확인</button>
      </div>
      <div id="next"></div>`);
    const out = $('#typed');
    let checked = false;
    on('[data-k]', (b) => {
      if (checked) return;
      const k = b.dataset.k;
      if (k === 'del') typed = typed.slice(0, -1);
      else if (k === 'ok') { if (typed.length) check(); return; }
      else if (typed.length < digits.length) typed += k;
      SFX.tap();
      out.innerHTML = typed ? fmt(typed) : '&nbsp;';
    });
    function check() {
      checked = true;
      const ok = typed === digits;
      const guide = $('#guide');
      if (ok) {
        correct++; snack += len * 3; maxLen = Math.max(maxLen, len);
        yay('번호 박사님!'); guide.innerHTML = '딩동댕! 정확해요 🎉';
        len = Math.min(len + 1, 10);
      } else {
        aww(); guide.innerHTML = `아쉬워요. 정답은 <b>${fmt(digits)}</b> 이에요.`;
        len = Math.max(3, len - 1);
      }
      $('#pad').style.opacity = '.4';
      const last = round >= ROUNDS;
      $('#next').innerHTML = `<button class="btn primary big" id="nx">${last ? '결과 보기 ▶' : '다음 번호 ▶'}</button>`;
      on('#nx', () => {
        if (!last) { showNum(); return; }
        finish('number', {
          snack,
          ratio: correct / ROUNDS,
          lv: correct >= 4 ? 1 : correct <= 1 ? -1 : 0,
          detail: `${ROUNDS}번 중 ${correct}번 맞히셨어요.${maxLen ? ` (최고 ${maxLen}자리)` : ''}`,
        });
      });
    }
  }
  showNum();
}

// ---------- 놀이 6: 노래·속담 퀴즈 ----------
function gameSong() {
  const qs = [];
  const singers = [...new Set(DATA.songs.map((x) => x.s))];
  shuffle(DATA.songs).slice(0, 3).forEach((s, i) => {
    if (i % 2 === 0) {
      qs.push({
        kind: '🎵 추억의 노래', q: `「${s.t}」\n이 노래를 부른 가수는 누구일까요?`, say: `${s.t}, 이 노래를 부른 가수는 누구일까요?`,
        a: s.s, o: shuffle([s.s, ...shuffle(singers.filter((x) => x !== s.s)).slice(0, 3)]),
      });
    } else {
      const others = [...new Set(DATA.songs.filter((x) => x.s !== s.s).map((x) => x.t))];
      qs.push({
        kind: '🎵 추억의 노래', q: `가수 ${s.s} 님이 부른 노래는\n무엇일까요?`,
        a: s.t, o: shuffle([s.t, ...shuffle(others).slice(0, 3)]),
      });
    }
  });
  const fill = (kind, pair, pool, intro) => ({
    kind, q: `${intro}\n"${pair[0]} ○○○"`, say: `${pair[0]}, 다음에 올 말은?`,
    a: pair[1], o: shuffle([pair[1], ...shuffle(pool.filter((x) => x !== pair[1])).slice(0, 3)]),
  });
  const pBacks = DATA.proverbs.map((p) => p[1]);
  const fBacks = DATA.folk.map((f) => f[1]);
  shuffle(DATA.proverbs).slice(0, 3).forEach((p) => qs.push(fill('📜 속담 이어 말하기', p, pBacks, '빈칸에 들어갈 말은?')));
  shuffle(DATA.folk).slice(0, 2).forEach((f) => qs.push(fill('🎶 민요 이어 부르기', f, fBacks, '흥얼흥얼 이어 불러 보세요~')));

  const list = shuffle(qs);
  runQuiz(list, '🎵 노래·속담 퀴즈', (c) => finish('song', {
    snack: c * 10,
    ratio: c / list.length,
    detail: `${list.length}문제 중 ${c}문제를 맞히셨어요.`,
  }));
}

// ---------- 복실이 집 (선물 입히기) ----------
function screenRoom() {
  const gr = growth();
  const next = STAGES[gr.s + 1];
  render(`${topBar()}
    <div class="game-title">🏠 ${pet()} 집</div>
    <div class="yard">
      <span class="sun">☀️</span><span class="house">🏡</span>
      <div class="bubble yard-bubble">${pick(PAT_LINES())}</div>
      <div class="pat" id="pat">${buddy('happy', { size: Math.min(buddySize(), 230) })}</div>
    </div>
    <section class="card-box" style="margin-top:1rem">
      <div class="grow-label"><b>${stageName()}</b><span>${next ? `다음: ${next.n} ${pet()} (🦴 ${gr.left})` : '다 컸어요! 🏆'}</span></div>
      ${growthBar(gr.pct)}
      <div class="stage-row">${STAGES.map((st, i) => `<span class="${i <= gr.s ? 'on' : ''}">${i < gr.s ? '🐾' : i === gr.s ? '🐶' : '·'}</span>`).join('')}</div>
    </section>

    <div class="section-title">🎁 선물 상자 <span class="muted small">(${S.items.length} / ${ITEMS.length}) 눌러서 입히고 벗기기</span></div>
    <div class="wardrobe">
      ${ITEMS.map((it) => {
        const own = S.items.includes(it.id);
        const on = S.equip[it.slot] === it.id;
        return own
          ? `<button class="ward ${on ? 'wearing' : ''}" data-item="${it.id}">
              ${buddy('happy', { size: 76, items: [it.id], stage: gr.s })}
              <span>${it.n}</span>${on ? '<em>입는 중</em>' : ''}
            </button>`
          : `<div class="ward locked"><span class="q">?</span><span>아직 몰라요</span></div>`;
      }).join('')}
    </div>
    <p class="muted small center">놀이를 아주 잘하거나, 하루 목표를 채우거나, ${josa(pet(), '이', '가')} 클 때 선물을 받아요.</p>`);
  bindPat('#pat', '.yard-bubble');
  on('[data-item]', (el) => {
    const it = ITEMS.find((x) => x.id === el.dataset.item);
    if (S.equip[it.slot] === it.id) delete S.equip[it.slot];
    else S.equip[it.slot] = it.id;
    save(); SFX.bark();
    go('room');
  });
}

// ---------- 나의 기록 ----------
function screenRecords() {
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
  const vals = days.map((d) => S.history[dayKey(d)] || 0);
  const max = Math.max(50, ...vals);
  render(`${topBar()}
    <div class="game-title">📒 나의 기록</div>
    <section class="card-box">
      <h3>최근 7일 동안 ${josa(pet(), '이', '가')} 먹은 간식</h3>
      <div class="bars">${days.map((d, i) => `
        <div class="bar ${i === 6 ? 'today' : ''}">
          <em>${vals[i] || ''}</em>
          <i style="height:${(vals[i] / max) * 100}%"></i>
          <span>${i === 6 ? '오늘' : WEEK[d.getDay()]}</span>
        </div>`).join('')}</div>
    </section>
    <section class="card-box">
      <div class="list-row"><span>🔥 연속 훈련</span><span>${S.streak}일</span></div>
      <div class="list-row"><span>📅 함께한 날</span><span>모두 ${S.days}일</span></div>
      <div class="list-row"><span>🦴 지금까지 준 간식</span><span>${S.xp.toLocaleString()}개</span></div>
      <div class="list-row"><span>🐶 ${pet()}</span><span>${stageName()}</span></div>
      <div class="list-row"><span>🎁 받은 선물</span><span>${S.items.length} / ${ITEMS.length}</span></div>
    </section>
    <section class="card-box">
      <h3>놀이별 기록</h3>
      ${GAMES.map((g) => `<div class="list-row"><span>${g.icon} ${g.name}</span><span class="small">${MAX_LV[g.id] ? `${S.levels[g.id] || 1}단계 · ` : ''}${S.plays[g.id] || 0}번</span></div>`).join('')}
    </section>`);
}

// ---------- 설정 ----------
function screenSettings() {
  const sw = (v) => `<span class="sw ${v ? 'on' : ''}">${v ? '켜짐' : '꺼짐'}</span>`;
  render(`${topBar()}
    <div class="game-title">⚙️ 설정</div>
    <section class="card-box field">
      <label for="pet">강아지 이름</label>
      <input id="pet" maxlength="8" placeholder="복실이" value="${esc(S.pet)}">
    </section>
    <button class="toggle" data-t="big">🔠 글씨 크게 보기 ${sw(S.settings.big)}</button>
    <button class="toggle" data-t="sound">🔔 효과음 ${sw(S.settings.sound)}</button>
    <button class="toggle" data-t="voice">🗣️ 음성으로 읽어 주기 ${sw(S.settings.voice)}</button>
    ${koVoice ? '' : '<p class="muted small">※ 이 기기에는 한국어 음성이 설치되어 있지 않아 읽어 주기가 동작하지 않을 수 있어요.</p>'}
    <section class="card-box small">
      <b>👨‍👩‍👧 보호자분께</b>
      <p style="margin:.3rem 0">하루 10~20분, 매일 꾸준히 하시도록 곁에서 응원해 주세요. 점수보다 "매일 하는 습관"이 중요합니다.</p>
      <p style="margin:.3rem 0">이 앱은 놀이용이며 의료 진단을 대신하지 않습니다. 기억력 저하가 걱정되시면 가까운 보건소 <b>치매안심센터</b>나 <b>치매상담콜센터(1899-9988)</b>에 문의해 주세요.</p>
    </section>
    <button class="btn" id="reset" style="color:var(--red)">기록 모두 지우기</button>`);

  $('#pet').addEventListener('input', (e) => { S.pet = e.target.value.trim() || '복실이'; save(); });
  on('[data-t]', (el) => {
    const k = el.dataset.t;
    S.settings[k] = !S.settings[k]; save();
    if (k === 'sound') SFX.tap();
    go('settings');
  });
  on('#reset', () => {
    if (!confirm(`${pet()} 성장, 선물, 기록이 모두 지워집니다. 정말 지울까요?`)) return;
    const keep = { pet: S.pet, settings: S.settings };
    S = Object.assign(defaultState(), keep); save();
    toast('기록을 모두 지웠어요');
    go('home');
  });
}

const SCREENS = {
  home: screenHome,
  checkin: screenCheckin,
  room: screenRoom,
  records: screenRecords,
  settings: screenSettings,
  game: (id) => GAMES.find((g) => g.id === id).run(),
};

// 웹앱(휴대폰)으로 열었을 때만 오프라인 저장 사용
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  // 새 버전이 설치되면 한 번 새로고침해서 바로 새 화면을 보여 줍니다
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloaded) return;
    reloaded = true;
    location.reload();
  });
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

go('home');
