// ── REGISTER SERVICE WORKER ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.log('SW error:', err));
  });
}

// ── STATE ──
let state = {};
try { state = JSON.parse(localStorage.getItem('bloom_state') || '{}'); } catch(e) {}
if (!state.pills)     state.pills     = [{ name: 'PCOS Pill', dose: '1 tablet', time: '08:00', type: '💊' }];
if (!state.taken)     state.taken     = {};
if (!state.notes)     state.notes     = [];
if (!state.moods)     state.moods     = {};
if (!state.cycleDay)  state.cycleDay  = 1;
if (!state.symptoms)  state.symptoms  = {};

function save() {
  try { localStorage.setItem('bloom_state', JSON.stringify(state)); } catch(e) {}
}

// ── DATE ──
const now = new Date();
const todayKey = now.toISOString().slice(0,10);
const MONTHS   = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS     = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
document.getElementById('todayDate').textContent = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;

// ── INSTALL BANNER ──
const isStandalone = window.navigator.standalone === true ||
  window.matchMedia('(display-mode: standalone)').matches;
const bannerDismissed = localStorage.getItem('bloom_banner_dismissed');
if (!isStandalone && !bannerDismissed) {
  document.getElementById('installBanner').style.display = 'flex';
}
function dismissBanner() {
  document.getElementById('installBanner').style.display = 'none';
  localStorage.setItem('bloom_banner_dismissed', '1');
}

// ── PANEL SWITCH ──
function switchPanel(id, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
  btn.classList.add('active');
  if (id === 'calendar') renderCalendar();
  if (id === 'notes')    renderNotes();
  if (id === 'schedule') renderPills();
  if (id === 'home')     { updateHome(); renderSymptoms(); }
}

// ── HOME ──
function updateHome() {
  // Streak
  let streak = 0;
  const d = new Date(now);
  while (true) {
    const k = d.toISOString().slice(0,10);
    if (state.taken[k]) { streak++; d.setDate(d.getDate()-1); }
    else break;
  }
  document.getElementById('streakCount').textContent = streak;

  // Month stats
  const ym = todayKey.slice(0,7);
  let taken = 0, missed = 0;
  for (let i = 1; i <= now.getDate(); i++) {
    const k = `${ym}-${String(i).padStart(2,'0')}`;
    if (state.taken[k]) taken++;
    else if (k < todayKey) missed++;
  }
  document.getElementById('takenThisMonth').textContent  = taken;
  document.getElementById('missedThisMonth').textContent = missed;

  // Pill button
  const taken_today = state.taken[todayKey];
  const pillBtn  = document.getElementById('todayPillBtn');
  const pillRing = document.getElementById('pillCheckRing');
  const pillTxt  = document.getElementById('pillBtnText');
  if (taken_today) {
    pillBtn.classList.add('taken');
    pillRing.textContent = '✓';
    pillTxt.textContent  = 'Taken today! Great job 💕';
  } else {
    pillBtn.classList.remove('taken');
    pillRing.textContent = '💊';
    pillTxt.textContent  = "Mark today's pill as taken";
  }

  // Mood restore
  document.querySelectorAll('.mood-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.m === state.moods[todayKey]);
  });

  updateCycleRing();
}

function toggleTodayPill() {
  state.taken[todayKey] = !state.taken[todayKey];
  save(); updateHome();
  if (state.taken[todayKey]) {
    showToast('💊 Pill logged! Keep it up 🌸', 'pink');
    confettiPop();
  } else {
    showToast('Pill unmarked for today.');
  }
}

function selectMood(btn, key) {
  const emojis = { happy:'😊', calm:'😌', tired:'😴', low:'😢', irritable:'😤' };
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  state.moods[todayKey] = key;
  save();
  showToast(`Mood logged: ${emojis[key]}`);
}

// ── CYCLE RING ──
const PHASES = [
  { days:[1,5],   name:'Menstrual Phase',  desc:'Rest and be gentle. Light movement like walking or yoga can help ease cramps.',        chip:'Day 1–5'   },
  { days:[6,13],  name:'Follicular Phase', desc:'Energy rising! Great time for cardio, new projects, and social activities.',           chip:'Day 6–13'  },
  { days:[14,16], name:'Ovulation Phase',  desc:'Peak energy and confidence. Great for intense workouts and important plans.',          chip:'Day 14–16' },
  { days:[17,28], name:'Luteal Phase',     desc:'Wind down gradually. Focus on rest, self-care, and gentler exercise.',                 chip:'Day 17–28' },
];
function getPhase(d) { return PHASES.find(p => d >= p.days[0] && d <= p.days[1]) || PHASES[0]; }
function updateCycleRing() {
  const cd = state.cycleDay || 1;
  document.getElementById('cycleDayNum').textContent   = cd;
  document.getElementById('cycleRingFill').style.strokeDashoffset = 226.2 * (1 - cd / 28);
  const ph = getPhase(cd);
  document.getElementById('cyclePhaseTitle').textContent = ph.name;
  document.getElementById('cyclePhaseDesc').textContent  = ph.desc;
  document.getElementById('phasechip').textContent       = ph.chip;
}
function cycleDayAdj(d) {
  state.cycleDay = Math.max(1, Math.min(28, (state.cycleDay || 1) + d));
  save(); updateCycleRing();
}

// ── PILLS ──
function renderPills() {
  const list = document.getElementById('pillList');
  if (!state.pills.length) {
    list.innerHTML = '<p style="font-size:13px;color:var(--soft)">No pills added yet.</p>';
    return;
  }
  list.innerHTML = state.pills.map((p, i) => `
    <div class="pill-item">
      <div class="pill-icon">${esc(p.type)}</div>
      <div class="pill-info">
        <div class="pill-name">${esc(p.name)}</div>
        <div class="pill-dose">${esc(p.dose)}</div>
      </div>
      <div class="pill-right">
        <div class="pill-time">${fmtTime(p.time)}</div>
        <button class="del-btn pill-del" data-index="${i}" aria-label="Remove pill">✕</button>
      </div>
    </div>
  `).join('');
}
// Event delegation — no inline onclick, safe index via data attribute
document.getElementById('pillList').addEventListener('click', e => {
  const btn = e.target.closest('.pill-del');
  if (!btn) return;
  const i = parseInt(btn.dataset.index, 10);
  if (isNaN(i) || i < 0 || i >= state.pills.length) return;
  showConfirm(`Remove "${esc(state.pills[i].name)}"?`, () => {
    state.pills.splice(i, 1);
    save(); renderPills();
    showToast('Pill removed.');
  });
});
function fmtTime(t) {
  const [h, m] = t.split(':');
  const hh = parseInt(h);
  return `${hh > 12 ? hh - 12 : hh || 12}:${m} ${hh >= 12 ? 'PM' : 'AM'}`;
}
function openAddPill() { document.getElementById('addPillModal').classList.add('open'); }
function closeAddPill() { document.getElementById('addPillModal').classList.remove('open'); }
function closeModalBg(e) { if (e.target.classList.contains('modal-overlay')) closeAddPill(); }
function addPill() {
  const name = document.getElementById('newPillName').value.trim();
  if (!name) { showToast('Please enter a pill name.'); return; }
  // Validate time format
  const time = document.getElementById('newPillTime').value;
  if (!/^\d{2}:\d{2}$/.test(time)) { showToast('Invalid time format.'); return; }
  // Sanitize type to allowed values only
  const allowedTypes = ['💊','🌿','💉','🍵'];
  const rawType = document.getElementById('newPillType').value;
  const type = allowedTypes.includes(rawType) ? rawType : '💊';
  state.pills.push({
    name,
    dose: document.getElementById('newPillDose').value.trim() || '—',
    time,
    type
  });
  save(); renderPills(); closeAddPill();
  showToast(`💊 ${name} added!`, 'pink');
  document.getElementById('newPillName').value = '';
  document.getElementById('newPillDose').value = '';
}

// ── CALENDAR ──
let calYear = now.getFullYear(), calMonth = now.getMonth();
function changeMonth(d) {
  calMonth += d;
  if (calMonth < 0)  { calMonth = 11; calYear--; }
  if (calMonth > 11) { calMonth = 0;  calYear++; }
  renderCalendar();
}
function renderCalendar() {
  document.getElementById('calMonthLabel').textContent = `${MONTHS[calMonth]} ${calYear}`;
  const grid  = document.getElementById('daysGrid');
  const first = new Date(calYear, calMonth, 1).getDay();
  const days  = new Date(calYear, calMonth + 1, 0).getDate();
  const ym    = `${calYear}-${String(calMonth + 1).padStart(2,'0')}`;
  let html = '';
  for (let i = 0; i < first; i++) html += '<div class="day-cell empty"></div>';
  for (let d = 1; d <= days; d++) {
    const k        = `${ym}-${String(d).padStart(2,'0')}`;
    const isToday  = k === todayKey;
    const isFuture = k > todayKey;
    const isTaken  = !!state.taken[k];
    const isMissed = !isTaken && !isFuture && k < todayKey;
    let cls = 'day-cell';
    if (isTaken)  cls += ' taken';
    if (isMissed) cls += ' missed';
    if (isFuture) cls += ' future';
    if (isToday)  cls += ' today';
    html += `<button class="${cls}" data-date="${k}" ${isFuture ? 'disabled' : ''}>${d}</button>`;
  }
  grid.innerHTML = html;
}
function toggleDay(k) {
  if (k > todayKey) return;
  state.taken[k] = !state.taken[k];
  save(); renderCalendar(); updateHome();
  showToast(state.taken[k] ? '✓ Marked as taken' : 'Unmarked');
}

// ── NOTES ──
function saveNote() {
  const text = document.getElementById('noteInput').value.trim();
  if (!text) { showToast('Write something first 💕'); return; }
  state.notes.unshift({ date: new Date().toLocaleString(), text });
  save();
  document.getElementById('noteInput').value = '';
  renderNotes();
  showToast('Note saved 🌸', 'pink');
}
function renderNotes() {
  const el = document.getElementById('notesList');
  if (!state.notes.length) {
    el.innerHTML = '<p style="font-size:13px;color:var(--soft)">No notes yet. Start journaling above 💕</p>';
    return;
  }
  el.innerHTML = state.notes.slice(0, 30).map((n, i) => `
    <div class="note-entry">
      <div class="note-header">
        <span class="note-date">${esc(n.date)}</span>
        <button class="del-btn note-del" data-index="${i}" aria-label="Delete note">✕</button>
      </div>
      <div class="note-text">${esc(n.text)}</div>
    </div>
  `).join('');
}
// Event delegation for notes — no inline onclick
document.getElementById('notesList').addEventListener('click', e => {
  const btn = e.target.closest('.note-del');
  if (!btn) return;
  const i = parseInt(btn.dataset.index, 10);
  if (isNaN(i) || i < 0 || i >= state.notes.length) return;
  state.notes.splice(i, 1);
  save(); renderNotes();
});

// ── INFO ──
function switchInfo(id, btn) {
  document.querySelectorAll('.info-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.info-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('info-' + id).classList.add('active');
  btn.classList.add('active');
}

// ── TOAST ──
let toastTimer;
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ── CUSTOM CONFIRM (replaces native confirm() — broken in iOS standalone PWA) ──
let _confirmCallback = null;
function showConfirm(msg, onYes) {
  document.getElementById('confirmMsg').textContent = msg;
  _confirmCallback = onYes;
  document.getElementById('confirmModal').classList.add('open');
}
document.getElementById('confirmYes').addEventListener('click', () => {
  document.getElementById('confirmModal').classList.remove('open');
  if (typeof _confirmCallback === 'function') _confirmCallback();
  _confirmCallback = null;
});
document.getElementById('confirmNo').addEventListener('click', () => {
  document.getElementById('confirmModal').classList.remove('open');
  _confirmCallback = null;
});

// ── CONFETTI ──
function confettiPop() {
  const emojis = ['🌸','💗','✨','💊','🌷','🎀'];
  for (let i = 0; i < 12; i++) {
    const el = document.createElement('div');
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    const delay = Math.random() * 0.4;
    el.style.cssText = `
      position:fixed;top:45%;left:${15+Math.random()*70}%;
      font-size:${14+Math.random()*16}px;
      pointer-events:none;z-index:999;
      opacity:1;
      animation:cfly ${0.9+Math.random()*0.5}s ease forwards;
      animation-delay:${delay}s;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }
}
const cStyle = document.createElement('style');
cStyle.textContent = `@keyframes cfly{0%{transform:translateY(0) scale(1) rotate(0deg);opacity:1}100%{transform:translateY(-170px) scale(0.4) rotate(${Math.random()*360}deg);opacity:0}}`;
document.head.appendChild(cStyle);

// ── UTILS ──
function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ── SYMPTOM CHECKLIST ──
const SYMPTOMS = [
  { id:'cramps',       label:'Cramps',           icon:'🤕' },
  { id:'bloating',     label:'Bloating',          icon:'🫧' },
  { id:'headache',     label:'Headache',          icon:'💆' },
  { id:'fatigue',      label:'Fatigue',           icon:'😮‍💨' },
  { id:'nausea',       label:'Nausea',            icon:'🤢' },
  { id:'acne',         label:'Acne flare',        icon:'😣' },
  { id:'hairloss',     label:'Hair loss',         icon:'🪮' },
  { id:'backpain',     label:'Back pain',         icon:'🦴' },
  { id:'insomnia',     label:'Insomnia',          icon:'🌙' },
  { id:'anxiety',      label:'Anxiety',           icon:'😰' },
  { id:'moodswing',    label:'Mood swings',       icon:'🎢' },
  { id:'spotting',     label:'Spotting',          icon:'🩸' },
  { id:'brainfog',     label:'Brain fog',         icon:'🌫️' },
  { id:'weightgain',   label:'Weight gain',       icon:'⚖️' },
  { id:'hotflash',     label:'Hot flashes',       icon:'🔥' },
  { id:'skindark',     label:'Skin darkening',    icon:'🎨' },
];



function renderSymptoms() {
  const grid = document.getElementById('symptomGrid');
  const todaySx = state.symptoms[todayKey] || [];
  grid.innerHTML = SYMPTOMS.map(s => {
    const checked = todaySx.includes(s.id);
    return `
      <div class="symptom-item${checked ? ' checked' : ''}" data-sx="${s.id}">
        <div class="symptom-check">${checked ? '✓' : ''}</div>
        <span class="symptom-label">${s.icon} ${s.label}</span>
      </div>
    `;
  }).join('');
}

// Event delegation for symptom checklist
document.getElementById('symptomGrid').addEventListener('click', e => {
  const item = e.target.closest('.symptom-item');
  if (!item) return;
  const sid = item.dataset.sx;
  if (!sid) return;
  if (!state.symptoms[todayKey]) state.symptoms[todayKey] = [];
  const arr = state.symptoms[todayKey];
  const idx = arr.indexOf(sid);
  if (idx === -1) arr.push(sid);
  else arr.splice(idx, 1);
  save();
  renderSymptoms();
  // Regenerate report if visible
  if (document.getElementById('reportBox').style.display !== 'none') {
    generateReport();
  }
});

function generateReport() {
  const moodMap = { happy:'😊 Happy', calm:'😌 Calm', tired:'😴 Tired', low:'😢 Low', irritable:'😤 Grumpy' };
  const mood   = state.moods[todayKey];
  const todaySx = (state.symptoms[todayKey] || [])
    .map(id => SYMPTOMS.find(s => s.id === id))
    .filter(Boolean);
  const pillTaken = state.taken[todayKey];
  const date = now.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  let lines = [];
  lines.push(`🌸 BLOOM — Daily Health Report`);
  lines.push(`📅 ${date}`);
  lines.push(`──────────────────────────`);
  lines.push(`💊 Pill taken: ${pillTaken ? 'Yes ✓' : 'No ✗'}`);
  lines.push(`🌸 Mood: ${mood ? moodMap[mood] : 'Not logged'}`);
  lines.push(`──────────────────────────`);
  if (todaySx.length > 0) {
    lines.push(`🩺 Symptoms today (${todaySx.length}):`);
    todaySx.forEach(s => lines.push(`   • ${s.icon} ${s.label}`));
  } else {
    lines.push(`🩺 Symptoms today: None reported ✨`);
  }
  lines.push(`──────────────────────────`);
  lines.push(`📊 This month: ${document.getElementById('takenThisMonth').textContent} taken, ${document.getElementById('missedThisMonth').textContent} missed`);
  lines.push(`🔥 Current streak: ${document.getElementById('streakCount').textContent} day(s)`);
  lines.push(`──────────────────────────`);
  lines.push(`Generated by Bloom PCOS Tracker`);

  const reportText = lines.join('\n');
  document.getElementById('reportText').textContent = reportText;
  document.getElementById('reportBox').style.display = 'block';
  document.getElementById('reportBox').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function copyReport() {
  const text = document.getElementById('reportText').textContent;
  const btn  = document.getElementById('copyReportBtn');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = 'Copied ✓';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
    }).catch(() => fallbackCopy(text, btn));
  } else {
    fallbackCopy(text, btn);
  }
}

function fallbackCopy(text, btn) {
  // iOS Safari fallback — select text inside the pre element
  const pre = document.getElementById('reportText');
  const range = document.createRange();
  range.selectNodeContents(pre);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  try {
    document.execCommand('copy');
    btn.textContent = 'Copied ✓';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
  } catch(e) {
    showToast('Long-press the report text to copy manually.');
  }
  sel.removeAllRanges();
}

// ── EVENT DELEGATION (CSP-safe: replaces all inline onclick handlers) ──
// Static UI buttons declare intent via data-action; this single listener
// dispatches to the right function. Allows CSP script-src without 'unsafe-inline'.
const ACTIONS = {
  dismissBanner,
  switchPanel:  (el) => switchPanel(el.dataset.target, el),
  toggleTodayPill,
  selectMood:   (el) => selectMood(el, el.dataset.mood),
  copyReport,
  generateReport,
  cycleDayAdj:  (el) => cycleDayAdj(parseInt(el.dataset.delta, 10)),
  openAddPill,
  changeMonth:  (el) => changeMonth(parseInt(el.dataset.delta, 10)),
  saveNote,
  switchInfo:   (el) => switchInfo(el.dataset.target, el),
  closeAddPill,
  addPill,
  // Modal overlay: only fire if click was on the overlay itself, not children
  closeModalBg: (el, e) => { if (e.target === el) closeAddPill(); }
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const fn = ACTIONS[el.dataset.action];
  if (typeof fn === 'function') fn(el, e);
});

// Calendar day delegation — no inline onclick, safe date via data attribute
document.getElementById('daysGrid').addEventListener('click', e => {
  const btn = e.target.closest('button[data-date]');
  if (!btn || btn.disabled) return;
  const d = btn.dataset.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return;  // validate format
  toggleDay(d);
});

// ── INIT ──
updateHome();
renderCalendar();
renderSymptoms();
