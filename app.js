'use strict';
/* Alkohol Rechner – Logik. $, t(), REDUCED kommen aus i18n.js, die Flüssigkeit aus liquid.js. */
const sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const state = { mode: 'login', period: 'day', drinks: [], mixers: [], kind: 'beer', selected: null, recent: [], rows: null, bac: 0, username: '', cupReady: false,
  loggedIn: false, tab: 'dash', amount: null, custom: false, mixer: null, mixAmt: 200, mixCustom: false, body: { weight: null, sex: null, limit: 0.5 } };
const recovery = location.hash.includes('type=recovery'); // Link aus der "Passwort vergessen"-Mail
const locale = () => (LANG === 'en' ? 'en-GB' : 'de-DE');

const TXT = { // Supabase-Meldungen -> eigene Texte (nichts Internes anzeigen)
  'Invalid login credentials': 'e_login', 'Email not confirmed': 'e_confirm', 'Database error saving new user': 'e_signup',
  'Auth session missing!': 'e_session', 'New password should be different from the old password.': 'e_samepw'
};
function ok(res) {
  if (res.error) { const m = res.error.message || ''; throw new Error(t(TXT[m] || (/rate limit|too many/i.test(m) ? 'e_rate' : 'e_generic'))); }
  return res.data;
}
async function fn(name, body) { // Edge Function aufrufen
  const { data, error } = await sb.functions.invoke(name, { body });
  if (error) { let m = t('e_generic'); try { m = (await error.context.json()).error || m; } catch {} throw new Error(m); }
  return data;
}

/* ---------- Helfer ---------- */
const SVGNS = 'http://www.w3.org/2000/svg';
function ico(name) {
  const s = document.createElementNS(SVGNS, 'svg'); s.setAttribute('class', 'ico'); s.setAttribute('aria-hidden', 'true');
  const u = document.createElementNS(SVGNS, 'use'); u.setAttribute('href', '#i-' + name); s.append(u); return s;
}
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e[k] = v; else e.setAttribute(k, v === true ? '' : v);
  }
  kids.flat().forEach((c) => c != null && e.append(c.nodeType ? c : document.createTextNode(c)));
  return e;
}
const msg = (id, text, good) => { const e = $(id); e.textContent = text || ''; e.className = 'msg ' + (good ? 'ok' : 'err'); };
async function busy(btn, job) {
  btn.classList.add('loading'); btn.disabled = true;
  try { return await job(); } finally { btn.classList.remove('loading'); btn.disabled = false; }
}
function countTo(el, to, dur = 1100, fmt = String) {
  const from = Number(el.dataset.v || 0); el.dataset.v = to;
  if (REDUCED || from === to || !dur) { el.textContent = fmt(to); return; }
  const t0 = performance.now();
  (function tick(now) {
    const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
    el.textContent = fmt(Math.round(from + (to - from) * e));
    if (k < 1) requestAnimationFrame(tick);
  })(t0);
}
function toast(text, kind) {
  const el = h('div', { class: 'toast ' + (kind || ''), role: 'status' });
  const i = ico(kind === 'err' ? 'alert' : 'check'); i.classList.add('t-ico'); if (kind !== 'err') i.classList.add('draw');
  el.append(i, h('span', { text }));
  $('toasts').append(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 350); }, kind === 'err' ? 5000 : 3200);
}

/* ---------- Hintergrund: aufsteigende Bläschen ---------- */
(function floaters() {
  const bg = $('bg');
  // Viele feine Bläschen: kleine steigen schneller, jede schwankt leicht. Auf dem Handy weniger, damit nichts ruckelt.
  for (let i = 0; i < (LITE ? 26 : 54); i++) {
    const b = h('i', { class: 'fb' }), w = 3 + Math.pow(Math.random(), 2) * 11;
    b.style.left = (Math.random() * 100).toFixed(1) + '%';
    b.style.setProperty('--w', w.toFixed(1) + 'px'); b.style.setProperty('--o', (0.25 + Math.random() * 0.5).toFixed(2));
    b.style.setProperty('--t', (9 + w * 0.9 + Math.random() * 8).toFixed(1) + 's'); b.style.setProperty('--d', (-Math.random() * 30).toFixed(1) + 's');
    b.style.setProperty('--sx', (Math.random() * 28 - 14).toFixed(0) + 'px'); b.style.setProperty('--y', (Math.random() * 100).toFixed(0) + '%');
    bg.insertBefore(b, bg.querySelector('.grain'));
  }
})();

/* ---------- Glas (animiertes SVG): Form und Farbe passen zum zuletzt getrunkenen Getränk, sonst eine Halbe ---------- */
let cupN = 0;
const DEFAULT_GLASS = () => glassFor('', 'beer', 500);
function cupEl(spec = DEFAULT_GLASS()) {
  const G = GLASSES[spec.g] || GLASSES.halbe, id = 'cc' + (++cupN), d = document.createElement('div'), y0 = G.top;
  const wave = 'M-20 8q30-8 60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0V260H-20Z';
  const ice = spec.ice ? '<rect class="ice" x="66" y="14" width="28" height="28" rx="5" transform="rotate(-12 80 28)"/><rect class="ice" x="104" y="20" width="26" height="26" rx="5" transform="rotate(16 117 33)"/>' : '';
  const sy = y0 - 14; // Bläschen bzw. Schaumperlen über dem Rand
  d.innerHTML = `<svg class="cup-svg g-${spec.g}${spec.foam ? ' foam' : ''}${spec.sparkle ? '' : ' still'}" viewBox="0 -34 210 244" role="img" aria-hidden="true">
    <defs><clipPath id="${id}"><path d="${G.body}"/></clipPath></defs>
    <ellipse class="saucer" cx="100" cy="174" rx="82" ry="9"/>
    <g class="steam" transform="translate(0 ${sy})"><path d="M74 8a5 5 0 1 0 .1 0Z"/><path d="M101 0a7 7 0 1 0 .1 0Z"/><path d="M127 9a4 4 0 1 0 .1 0Z"/></g>
    <path class="body-fill" d="${G.body}"/>
    <g clip-path="url(#${id})"><g class="liquid"><g class="wave w2"><path d="${wave}"/></g><g class="wave w1"><path d="${wave}" transform="translate(0 ${spec.foam ? 12 : 7})"/></g>${ice}</g></g>
    ${spec.straw ? `<path class="straw" d="M128 ${y0 - 30}L112 ${G.bottom - 24}"/>` : ''}
    ${G.deco ? `<path class="dimples" d="${G.deco}"/>` : ''}
    <path class="outline" d="${G.body}"/>
    <path class="extra" d="${G.extra}"/>
    <path class="shine" d="${G.shine}"/>
    <path class="stream" pathLength="100" d="M100 -34C100 0 100 ${Math.round(G.bottom / 3)} 100 ${G.bottom}"/>
  </svg>`;
  const svg = d.firstElementChild, c = spec.rgb, light = c.map((v) => Math.round(v + (255 - v) * .45));
  // Füllhöhe: leer knapp unter dem Boden, voll knapp unter dem Rand
  svg.style.setProperty('--l0', G.bottom + 5); svg.style.setProperty('--lr', G.bottom + 5 - (G.top - 4));
  svg.style.setProperty('--liq', `rgb(${c.join(',')})`); svg.style.setProperty('--liq2', spec.foam ? '#FFF6E0' : `rgb(${light.join(',')})`);
  svg.dataset.key = spec.g + c.join('-') + (spec.ice ? 'i' : '') + (spec.straw ? 's' : '');
  return svg;
}
function mountCup(host, spec) { host.replaceChildren(cupEl(spec)); return host; }
// Glas zum zuletzt eingetragenen Getränk des Tages
function lastGlass() {
  const last = todays()[0]; if (!last) return DEFAULT_GLASS();
  const d = state.drinks.find((x) => x.name === last.name);
  return glassFor(last.name, d && d.kind, last.amount, last.mixer, last.mixer_amount);
}
function setLevel(p) { $('cup').style.setProperty('--lvl', Math.max(0, Math.min(1, p)).toFixed(3)); }

/* ---------- Effekte ---------- */
function burst(x, y, label) {
  const f = $('fx');
  if (!REDUCED) for (let i = 0; i < (LITE ? 7 : 18); i++) {
    const b = h('i', { class: 'bean' }), a = Math.random() * Math.PI * 2, dist = 70 + Math.random() * 140;
    b.style.left = x + 'px'; b.style.top = y + 'px';
    b.style.setProperty('--dx', Math.cos(a) * dist + 'px'); b.style.setProperty('--dy', Math.sin(a) * dist - 40 + 'px');
    b.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
    f.append(b); setTimeout(() => b.remove(), 1100);
  }
  if (label) { const p = h('span', { class: 'plus', text: label }); p.style.left = x + 'px'; p.style.top = y + 'px'; f.append(p); setTimeout(() => p.remove(), 1400); }
}

/* ---------- Ansichten ---------- */
function showAuth(name) {
  ['login', 'forgot', 'reset', 'done'].forEach((n) => {
    const c = $('card-' + n), on = n === name; c.hidden = !on;
    if (on) { c.classList.remove('swap'); void c.offsetWidth; c.classList.add('swap'); }
  });
}
function show(loggedIn, name) {
  state.loggedIn = loggedIn;
  $('auth-view').hidden = loggedIn; $('app-view').hidden = !loggedIn; $('userbox').hidden = !loggedIn;
  $('who').textContent = name || ''; $('who2').textContent = name || '';
  document.body.classList.remove('booting');
  if (!loggedIn) Liquid.set(0, false);
  if (loggedIn) requestAnimationFrame(moveAll);
}
async function enter(user) {
  const p = ok(await sb.from('profiles').select('username').eq('id', user.id).single());
  // Körperwerte stehen in alc_profiles; die Zeile gibt es erst, wenn man sie einmal speichert
  const b = ok(await sb.from('alc_profiles').select('weight_kg,sex,limit_pm').eq('id', user.id).maybeSingle()) || {};
  state.username = p.username; state.bac = 0; state.recent = [];
  state.body = { weight: b.weight_kg || null, sex: b.sex || null, limit: Number(b.limit_pm) || 0.5 }; show(true, p.username); renderBody();
  $('dash').classList.add('is-loading'); $('list').replaceChildren(h('li', { class: 'sk-row' }), h('li', { class: 'sk-row' }));
  await loadDrinks(); await refresh();
}

/* ---------- Tabs mit gleitendem Marker ---------- */
function moveInd(nav) {
  const b = nav.querySelector('[aria-selected="true"]'), ind = nav.querySelector('.tab-ind');
  if (!b || !b.offsetWidth) return;
  ind.style.setProperty('--x', b.offsetLeft + 'px'); ind.style.setProperty('--w', b.offsetWidth + 'px');
}
const moveAll = () => document.querySelectorAll('.tabs').forEach(moveInd);
window.addEventListener('resize', moveAll);
function select(nav, btn) { nav.querySelectorAll('[role="tab"]').forEach((x) => x.setAttribute('aria-selected', String(x === btn))); moveInd(nav); }
document.querySelectorAll('#main-tabs [role="tab"]').forEach((b) => b.onclick = () => {
  select($('main-tabs'), b); state.tab = b.dataset.tab;
  document.querySelectorAll('.tab').forEach((x) => x.hidden = x.id !== 'tab-' + b.dataset.tab);
  moveAll(); if (b.dataset.tab === 'board') loadBoard();
  if (b.dataset.tab === 'toasts') { renderToasts(); if (!tst.last) randomToast(); }
});
document.querySelectorAll('#seg [role="tab"]').forEach((b) => b.onclick = () => { state.period = b.dataset.p; select($('seg'), b); loadBoard(); });

/* ---------- Sprache ---------- */
function applyAuthMode() {
  const reg = state.mode === 'register';
  $('auth-title').dataset.i18n = reg ? 'auth_title_reg' : 'auth_title_login'; $('auth-sub').dataset.i18n = reg ? 'auth_sub_reg' : 'auth_sub_login';
  $('auth-btn-t').dataset.i18n = reg ? 'btn_register' : 'btn_login'; $('toggle').dataset.i18n = reg ? 'toggle_to_login' : 'toggle_to_reg';
  $('user-row').hidden = !reg; $('age-row').hidden = !reg; $('u').required = reg; $('forgot-link').hidden = reg; $('strength').hidden = !reg;
  $('p').autocomplete = reg ? 'new-password' : 'current-password';
}
function rerender() {
  applyAuthMode(); applyStatic();
  document.querySelectorAll('[data-toggle-pw]').forEach((b) => { const shown = $(b.dataset.togglePw).type === 'text'; b.setAttribute('aria-label', t(shown ? 'hide_pw' : 'show_pw')); });
  if (state.loggedIn) { renderBody(); renderKinds(); renderDrinks(); renderDash(); if (state.tab === 'board' && state.rows) renderBoard(state.rows); if (state.tab === 'toasts') { renderToasts(); randomToast(); } requestAnimationFrame(moveAll); }
}
$('lang').onclick = () => { LANG = LANG === 'de' ? 'en' : 'de'; try { localStorage.setItem('ar-lang', LANG); } catch {} rerender(); };

/* ---------- Anmelden / Registrieren ---------- */
function strength(p) {
  let s = 0; if (p.length >= 10) s++; if (p.length >= 14) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++; if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
  return p ? Math.max(1, s) : 0;
}
$('p').addEventListener('input', () => { $('strength').dataset.s = strength($('p').value); });
document.querySelectorAll('[data-toggle-pw]').forEach((b) => b.onclick = () => {
  const i = $(b.dataset.togglePw), shown = i.type === 'password';
  i.type = shown ? 'text' : 'password'; b.replaceChildren(ico(shown ? 'eye-off' : 'eye')); b.setAttribute('aria-label', t(shown ? 'hide_pw' : 'show_pw'));
});
$('toggle').onclick = () => {
  state.mode = state.mode === 'login' ? 'register' : 'login'; applyAuthMode(); applyStatic(); msg('auth-msg');
  const c = $('card-login'); c.classList.remove('swap'); void c.offsetWidth; c.classList.add('swap');
};
$('auth-form').onsubmit = async (e) => {
  e.preventDefault(); msg('auth-msg');
  const email = $('e').value.trim(), password = $('p').value;
  await busy($('auth-btn'), async () => {
    try {
      if (!email) throw new Error(t('e_email_req'));
      if (state.mode === 'register') {
        const username = $('u').value.trim();
        if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) throw new Error(t('e_username'));
        if (password.length < 10) throw new Error(t('e_pw_len'));
        if (!$('age').checked) throw new Error(t('e_age'));
        if (!$('hp').value) // Honeypot: Bots füllen das versteckte Feld aus und bekommen nur eine Schein-Antwort
          ok(await sb.auth.signUp({ email, password, options: { data: { username }, emailRedirectTo: window.SITE_URL } }));
        $('p').value = ''; showAuth('done');
      } else {
        if (!password) throw new Error(t('e_pw_req'));
        const d = ok(await sb.auth.signInWithPassword({ email, password }));
        $('p').value = ''; await enter(d.user);
      }
    } catch (err) { msg('auth-msg', err.message); }
  });
};
const logout = async () => { await sb.auth.signOut(); show(false); showAuth('login'); toast(t('bye')); };
$('logout').onclick = logout; $('logout2').onclick = logout;

/* ---------- Passwort vergessen / zurücksetzen ---------- */
$('forgot-link').onclick = () => { showAuth('forgot'); msg('forgot-msg'); };
document.querySelectorAll('.back').forEach((b) => b.onclick = () => showAuth('login'));
$('forgot-form').onsubmit = async (e) => {
  e.preventDefault();
  await busy(e.target.querySelector('button[type=submit]'), async () => {
    try { await sb.auth.resetPasswordForEmail($('fe').value.trim(), { redirectTo: window.SITE_URL }); msg('forgot-msg', t('forgot_ok'), true); } // Antwort ist immer gleich
    catch { msg('forgot-msg', t('e_generic')); }
  });
};
$('reset-form').onsubmit = async (e) => {
  e.preventDefault();
  await busy(e.target.querySelector('button[type=submit]'), async () => {
    try {
      const d = ok(await sb.auth.updateUser({ password: $('rp').value }));
      $('rp').value = ''; history.replaceState(null, '', location.pathname); await enter(d.user); toast(t('pw_saved'));
    } catch (err) { msg('reset-msg', err.message); }
  });
};

/* ---------- Konto löschen (Edge Function, prüft das Passwort erneut) ---------- */
$('del-open').onclick = () => { msg('del-msg'); $('del-pw').value = ''; $('del-dialog').showModal(); $('del-pw').focus(); };
$('del-cancel').onclick = () => $('del-dialog').close();
$('del-form').onsubmit = async (e) => {
  e.preventDefault();
  await busy(e.target.querySelector('button[type=submit]'), async () => {
    try {
      await fn('delete-account', { password: $('del-pw').value });
      $('del-pw').value = ''; $('del-dialog').close(); await sb.auth.signOut(); show(false); showAuth('login'); toast(t('del_done'));
    } catch (err) { msg('del-msg', err.message); }
  });
};

/* ---------- Promille (Widmark-Formel) ---------- */
// Gramm Alkohol = ml x Vol.-% / 100 x 0,789. Promille = Gramm / (Gewicht x Faktor). Abbau: 0,15 Promille pro Stunde.
// Für "wieder nüchtern" wird vorsichtiger gerechnet (0,1 pro Stunde). Alles Schätzwerte, kein Messwert.
const RHO = 0.789, ELIM = 0.15, ELIM_SAFE = 0.1, EPS = 0.005, R = { m: 0.68, f: 0.55, x: 0.6 };
const KINDS = ['beer', 'wine', 'spirit', 'mixed'], KIND_ICON = { beer: 'beer', wine: 'wine', spirit: 'shot', mixed: 'martini' };
const nf = (v, min, max) => Number(v).toLocaleString(locale(), { minimumFractionDigits: min, maximumFractionDigits: max == null ? min : max });
const fmtP = (v) => nf(v, 2), fmtG = (g) => nf(g, 0, 1), fmtL = (v) => nf(v, 1);
const hasBody = () => !!(state.body.weight && state.body.sex);
const factor = () => (hasBody() ? state.body.weight * R[state.body.sex] : 70 * R.x);
const limit = () => state.body.limit || 0.5;
const gramsFor = (d, ml) => Math.round(ml * d.abv / 100 * RHO * 10) / 10;
// Jeder Eintrag hebt den Wert sofort (vorsichtig gerechnet), dazwischen sinkt er gleichmäßig. Der Server rechnet für die Rangliste genauso.
function bacNow(list, now, elim) {
  const rows = list.map((i) => ({ g: Number(i.grams), t: new Date(i.ts).getTime() })).sort((a, b) => a.t - b.t), f = factor();
  let bac = 0, prev = null;
  for (const r of rows) { if (prev != null) bac = Math.max(0, bac - elim * Math.max(0, r.t - prev) / 3600e3); bac += r.g / f; prev = r.t; }
  if (prev != null) bac = Math.max(0, bac - elim * Math.max(0, now - prev) / 3600e3);
  return bac;
}
// Ein "Tag" geht von 6 Uhr bis 6 Uhr, damit ein Abend nicht um Mitternacht zerschnitten wird
const dayStart = () => { const s = new Date(); if (s.getHours() < 6) s.setDate(s.getDate() - 1); s.setHours(6, 0, 0, 0); return s.getTime(); };
const todays = () => { const from = dayStart(); return (state.recent || []).filter((i) => new Date(i.ts).getTime() >= from); };

/* ---------- Deine Werte: Gewicht, Rechenfaktor, Limit ---------- */
function renderBody() {
  const b = state.body, has = hasBody();
  $('body-card').hidden = has;
  $('body-sum').textContent = has ? t('body_sum', { w: b.weight, r: nf(R[b.sex], 2), lim: fmtL(limit()) }) : t('body_none');
  const ls = $('b-l'), cur = ls.value || String(limit()); ls.replaceChildren();
  for (let v = 2; v <= 10; v++) { const o = document.createElement('option'); o.value = String(v / 10); o.textContent = fmtL(v / 10) + ' ‰'; ls.append(o); }
  ls.value = String(Number(cur));
}
function openBody() {
  msg('body-msg'); $('b-w').value = state.body.weight || ''; $('b-s').value = state.body.sex || ''; $('b-l').value = String(limit());
  $('body-dialog').showModal();
}
$('body-open').onclick = openBody; $('body-edit').onclick = openBody;
$('body-cancel').onclick = () => $('body-dialog').close();
$('body-form').onsubmit = async (e) => {
  e.preventDefault();
  await busy(e.target.querySelector('button[type=submit]'), async () => {
    try {
      const w = Number($('b-w').value), s = $('b-s').value, l = Number($('b-l').value);
      if (!Number.isInteger(w) || w < 30 || w > 250) throw new Error(t('e_weight'));
      if (!R[s]) throw new Error(t('e_sex'));
      ok(await sb.rpc('alc_set_body', { p_weight: w, p_sex: s, p_limit: l }));
      state.body = { weight: w, sex: s, limit: l }; $('body-dialog').close();
      renderBody(); renderSizes(false); renderMix(); renderSelection(); renderDash(null, true); toast(t('body_saved'));
    } catch (err) { msg('body-msg', err.message); }
  });
};

/* ---------- Limit-Check: ein paar Fragen, daraus ein vorsichtiger Vorschlag (höchstens 0,5 Promille) ---------- */
// Wer fährt oder aus gesundheitlichen Gründen nicht trinken sollte, bekommt keinen Wert, sondern "heute besser nichts".
const LC = [
  { k: 'drive', stop: true, o: [['yes', null], ['no', 0]] },
  { k: 'health', stop: true, o: [['yes', null], ['no', 0]] },
  { k: 'often', o: [['rare', 0.3], ['some', 0.4], ['much', 0.5]] },
  { k: 'after', o: [['good', 0], ['mid', -0.1], ['bad', -0.2]] },
  { k: 'tomorrow', o: [['free', 0], ['busy', -0.1]] }
];
const lc = { i: 0, base: 0.5, adj: 0, result: null };
function lcShow() {
  const q = LC[lc.i], box = $('lc-opts'); msg('lc-msg'); box.replaceChildren(); $('lc-list').hidden = true; $('lc-apply').hidden = true;
  if (!q) return lcResult(Math.round(Math.min(0.5, Math.max(0.2, lc.base + lc.adj)) * 10) / 10);
  $('lc-step').textContent = t('lc_step', { n: lc.i + 1, of: LC.length });
  $('lc-dlg-title').textContent = t('lc_q_' + q.k); $('lc-text').textContent = t('lc_h_' + q.k);
  q.o.forEach(([key, val]) => {
    const b = h('button', { class: 'chip-opt', type: 'button' }, h('span', { text: t(`lc_${q.k}_${key}`) }));
    b.onclick = () => {
      if (val === null) return lcResult(null, q.k);
      if (q.k === 'often') lc.base = val; else lc.adj += val;
      lc.i++; lcShow();
    };
    box.append(b);
  });
}
function lcResult(v, why) {
  lc.result = v; $('lc-opts').replaceChildren(); $('lc-step').textContent = t('lc_result');
  const list = $('lc-list'); list.replaceChildren(); list.hidden = false;
  if (v === null) {
    $('lc-dlg-title').textContent = t('lc_zero_t'); $('lc-text').textContent = t('lc_zero_' + why);
    list.append(h('li', { text: t('lc_tip_zero') }));
    $('lc-apply').hidden = true; return;
  }
  $('lc-dlg-title').replaceChildren(h('span', { class: 'lc-big', text: fmtL(v) + ' ‰' })); $('lc-text').textContent = t('lc_res_text');
  if (hasBody()) { // was der Wert ungefähr bedeutet: kleine Bier (0,33 l, 4,9 %) kurz hintereinander
    const beers = v * factor() / (330 * 0.049 * RHO);
    list.append(h('li', { text: t('lc_res_beer', { n: nf(Math.max(0.5, Math.round(beers * 2) / 2), 0, 1) }) }));
  }
  [t('lc_tip_slow'), t('lc_tip_water'), t('lc_tip_feel')].forEach((x) => list.append(h('li', { text: x })));
  $('lc-apply-t').textContent = t('lc_apply', { v: fmtL(v) }); $('lc-apply').hidden = false;
}
function openLC() {
  if ($('body-dialog').open) $('body-dialog').close();
  lc.i = 0; lc.base = 0.5; lc.adj = 0; lc.result = null; lcShow(); $('lc-dialog').showModal();
}
$('lc-open').onclick = openLC; $('lc-open2').onclick = openLC;
$('lc-close').onclick = () => $('lc-dialog').close();
$('lc-apply').onclick = async () => {
  const v = lc.result; if (!v) return;
  if (!hasBody()) { $('lc-dialog').close(); openBody(); $('b-l').value = String(v); return; } // Gewicht fehlt noch: dort gleich mit eintragen
  await busy($('lc-apply'), async () => {
    try {
      ok(await sb.rpc('alc_set_body', { p_weight: state.body.weight, p_sex: state.body.sex, p_limit: v }));
      state.body.limit = v; $('lc-dialog').close(); $('b-l').value = String(v); renderBody(); renderSelection(); renderDash(null, true); toast(t('lc_saved', { v: fmtL(v) }));
    } catch (err) { msg('lc-msg', err.message); }
  });
};

/* ---------- Dashboard: Getränk, Menge, Mixer ---------- */
const sel = () => state.drinks.find((x) => x.id === state.selected);
const mixer = () => (state.mixer == null ? null : state.mixers.find((x) => x.id === state.mixer) || null);
// Suche geht über alle Arten, sonst zeigt die Liste nur die gewählte Art
const norm = (x) => String(x).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const shown = () => { const q = norm($('drink-q').value.trim()); return q ? state.drinks.filter((d) => norm(d.name).includes(q) || norm(drinkName(d.name)).includes(q)) : state.drinks.filter((d) => d.kind === state.kind); };
$('drink-q').oninput = () => { if (sel() && !shown().includes(sel())) { state.selected = null; state.amount = null; state.custom = false; state.mixer = null; } renderDrinks(); };
async function loadDrinks() {
  state.drinks = ok(await sb.from('alc_drinks').select('id,name,abv,portion,sizes,kind,caffeine_mg_100').order('sort'));
  state.mixers = ok(await sb.from('alc_mixers').select('id,name,caffeine_mg_100').order('sort'));
  state.selected = null; state.amount = null; state.custom = false; state.mixer = null; state.mixAmt = 200; state.mixCustom = false;
  renderKinds(); renderDrinks();
}
function renderKinds() {
  const nav = $('kinds'); nav.replaceChildren(h('span', { class: 'tab-ind', 'aria-hidden': 'true' }));
  KINDS.forEach((k) => {
    const b = h('button', { role: 'tab', type: 'button', 'aria-selected': String(k === state.kind) }, ico(KIND_ICON[k]), h('span', { text: t('kind_' + k) }));
    b.onclick = () => {
      state.kind = k; select(nav, b); $('drink-q').value = '';
      if (sel() && sel().kind !== k) { state.selected = null; state.amount = null; state.custom = false; state.mixer = null; }
      renderDrinks();
    };
    nav.append(b);
  });
  requestAnimationFrame(() => moveInd(nav));
}
function renderDrinks() {
  const box = $('drinks'), list = shown(); box.replaceChildren();
  list.forEach((d, i) => {
    const on = d.id === state.selected;
    const tile = h('button', { class: 'drink', type: 'button', role: 'radio', 'aria-checked': String(on), tabindex: on || (!sel() && i === 0) ? '0' : '-1' },
      h('span', { class: 'd-ico' }, ico(KIND_ICON[d.kind])), h('span', { class: 'd-name', text: drinkName(d.name) }), h('span', { class: 'd-sub', text: d.portion + ' ml' }),
      h('span', { class: 'd-mg' }, nf(d.abv, 0, 1), ' ', h('small', { text: '% vol' })));
    tile.style.setProperty('--i', i);
    tile.onclick = () => pick(d.id);
    tile.onkeydown = (ev) => {
      const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key]; if (!k) return;
      ev.preventDefault(); pick(list[(i + k + list.length) % list.length].id, true);
    };
    box.append(tile);
  });
  if (!list.length) box.append(h('p', { class: 'hint', text: t($('drink-q').value.trim() ? 'search_none' : 'no_drinks') }));
  renderSizes(false); renderMix(); renderSelection();
}
const validAmount = (v) => Number.isInteger(v) && v >= 1 && v <= 2000;
function pick(id, focus) {
  state.selected = id; const d = sel(); state.amount = d ? d.portion : null; state.custom = false;
  const list = shown();
  $('drinks').querySelectorAll('.drink').forEach((tile, i) => {
    const on = list[i].id === id; tile.setAttribute('aria-checked', String(on)); tile.tabIndex = on ? 0 : -1; if (on && focus) tile.focus();
  });
  renderSizes(true); renderMix(); renderSelection();
}
// Mengenauswahl: drei feste Größen plus freies Feld. Wird für das Getränk und für den Mixer benutzt.
function amountGrid(grid, o) {
  grid.replaceChildren();
  const mark = () => {
    const s = o.get();
    grid.querySelectorAll('button.size-opt').forEach((b, i) => b.setAttribute('aria-checked', String(!s.custom && o.amounts[i] === s.amount)));
    grid.querySelector('.custom').setAttribute('aria-checked', String(s.custom));
  };
  const s0 = o.get();
  const inp = h('input', { type: 'number', min: '1', max: '2000', step: '1', inputmode: 'numeric', 'aria-label': `${t('size_custom')} (ml)`, placeholder: t('size_custom_ph') });
  if (s0.custom && s0.amount) inp.value = s0.amount;
  const subEl = h('span', { class: 'so-mg', text: s0.custom && s0.amount ? o.sub(s0.amount) : t('size_custom') });
  o.amounts.forEach((amt, i) => {
    const b = h('button', { class: 'size-opt', type: 'button', role: 'radio' },
      h('span', { class: 'so-ico s' + i }, ico(o.icon)),
      h('span', { class: 'so-amt' }, String(amt), ' ', h('small', { text: 'ml' })),
      h('span', { class: 'so-mg', text: o.sub(amt) }), amt === o.std ? h('span', { class: 'tag', text: t('size_std') }) : null);
    b.style.setProperty('--i', i);
    b.onclick = () => { inp.value = ''; subEl.textContent = t('size_custom'); o.set(amt, false); mark(); };
    grid.append(b);
  });
  const cust = h('label', { class: 'size-opt custom' }, h('span', { class: 'so-ico s3' }, ico('plus')), h('span', { class: 'so-in' }, inp, h('em', { text: 'ml' })), subEl);
  cust.style.setProperty('--i', 3);
  const read = () => {
    const v = inp.value === '' ? NaN : Number(inp.value), a = validAmount(v) ? v : null;
    o.set(a, true); subEl.textContent = a ? o.sub(a) : t('size_custom'); mark();
  };
  inp.oninput = read; inp.onfocus = () => { if (inp.value !== '') read(); };
  grid.append(cust); mark();
}
function renderSizes(animate) {
  const d = sel(), box = $('sizes'); box.hidden = !d; if (!d) return;
  $('size-name').textContent = drinkName(d.name);
  amountGrid($('size-grid'), {
    amounts: d.sizes, std: d.portion, icon: KIND_ICON[d.kind], get: () => ({ amount: state.amount, custom: state.custom }),
    sub: (a) => `≈ ${fmtG(gramsFor(d, a))} g` + (d.kind === 'spirit' && a % 10 === 0 ? ` · ${a / 10} cl` : ''),
    set: (a, c) => { state.amount = a; state.custom = c; renderMixAmounts(); renderSelection(); }
  });
  if (animate) { box.classList.remove('in'); void box.offsetWidth; box.classList.add('in'); }
}
/* Mischgetränk: nach der Getränkewahl optional einen Mixer dazu. Der Mixer ändert die Alkoholmenge nicht, nur Name, Glasgröße und Stärke. */
function renderMix() {
  const d = sel(), box = $('mixbox'); box.hidden = !d; if (!d) return;
  const grid = $('mix-grid'); grid.replaceChildren();
  const chip = (id, label, icon) => {
    const b = h('button', { class: 'chip-opt', type: 'button', role: 'radio', 'aria-checked': String(state.mixer === id) }, ico(icon), h('span', { text: label }));
    b.onclick = () => {
      state.mixer = id; grid.querySelectorAll('.chip-opt').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
      renderMixAmounts(); renderSelection();
    };
    grid.append(b);
  };
  chip(null, t('mix_none'), KIND_ICON[d.kind]);
  state.mixers.forEach((m) => chip(m.id, mixName(m.name), 'soda'));
  renderMixAmounts();
}
function renderMixAmounts() {
  const d = sel(), m = mixer(), grid = $('mixamt-grid'); grid.hidden = !d || !m; if (!d || !m) return;
  amountGrid(grid, {
    amounts: [100, 200, 300], std: 200, icon: 'soda', get: () => ({ amount: state.mixAmt, custom: state.mixCustom }),
    sub: (a) => (state.amount ? t('mix_strength', { p: nf(d.abv * state.amount / (state.amount + a), 0, 1) }) : ''),
    set: (a, c) => { state.mixAmt = a; state.mixCustom = c; renderSelection(); }
  });
}
// Koffein (mg) dieses Getränks samt Mixer – wird automatisch im Koffein Rechner eingetragen
const cafFor = (d, amount, m, mixAmt) => Math.round(amount * Number(d.caffeine_mg_100 || 0) / 100) + (m ? Math.round(mixAmt * Number(m.caffeine_mg_100 || 0) / 100) : 0);
function renderSelection() {
  const d = sel(), m = mixer(), sum = $('preview'); sum.replaceChildren();
  const okAmt = !!(d && state.amount && (!m || state.mixAmt));
  if (!d) sum.textContent = t('pick_hint');
  else if (!okAmt) sum.append(h('b', { text: drinkName(d.name) }), h('small', { text: t('amount_invalid') }));
  else {
    const g = gramsFor(d, state.amount), add = g / factor();
    const parts = [m ? `${state.amount} ml + ${state.mixAmt} ml` : `${state.amount} ml`, t('sum_g', { g: fmtG(g) })];
    if (hasBody()) parts.push(`+${fmtP(add)} ‰`);
    sum.append(h('b', { text: m ? `${drinkName(d.name)} + ${mixName(m.name)}` : drinkName(d.name) }), h('small', { text: parts.join(' · ') }));
    const caf = cafFor(d, state.amount, m, state.mixAmt);
    if (caf > 0) sum.append(h('small', { class: 'caf', text: t('sum_caf', { mg: caf }) }));
    if (!hasBody()) sum.append(h('small', { class: 'need', text: t('need_body') }));
    else if (bacNow(state.recent || [], Date.now(), ELIM) + add > limit() + EPS) sum.append(h('small', { class: 'warnline', text: t('sum_over') }));
  }
  $('add').disabled = !okAmt || !hasBody();
}
async function refresh(newest) {
  const since = new Date(Date.now() - 48 * 3600e3).toISOString(); // der Abend von gestern zählt noch mit
  state.recent = ok(await sb.from('alc_intakes').select('id,name,grams,amount,mixer,mixer_amount,ts').gte('ts', since).order('ts', { ascending: false }));
  renderDash(newest, true);
}
function statusFor(bac, p, any) {
  if (bac >= 1.5) return ['alert', t('s_high')];
  if (p > 1) return ['alert', t('sover')];
  if (bac <= 0) return any ? ['sun', t('s_zero')] : ['sun', t('status0')];
  if (p < .5) return ['beer', t('s50')]; if (p < .8) return ['drop', t('s80')];
  return ['alert', t('s100')];
}
// Stufen nach geschätztem Promillewert: nüchtern, kaum spürbar, spürbar, angetrunken, Rausch, komplett dicht, Lebensgefahr
const LEVELS = [0.01, 0.3, 0.5, 1, 2, 3];
const levelOf = (bac) => LEVELS.filter((x) => bac >= x).length;
function renderStage(bac) {
  const l = levelOf(bac); $('lvl').dataset.l = l; $('lvl').hidden = !hasBody();
  $('lvl-t').textContent = t('lvl_' + l); $('lvl-x').textContent = t('lvl_x' + l);
}
// Wann bist du wieder nüchtern? Vorsichtig gerechnet mit 0,1 Promille pro Stunde.
function renderClear(list, now) {
  const box = $('clear');
  if (!list.length || !hasBody()) { box.hidden = true; return; }
  const left = bacNow(list, now, ELIM_SAFE); box.hidden = false;
  if (left <= 0) { $('cl-v').textContent = t('clear_free'); $('cl-s').textContent = t('clear_free_s'); box.classList.add('free'); return; }
  box.classList.remove('free');
  const hrs = left / ELIM_SAFE, at = new Date(now + hrs * 3600e3), mins = Math.max(1, Math.round(hrs * 60));
  const d = mins >= 60 ? `${Math.floor(mins / 60)} ${t('hr')} ${mins % 60} ${t('min')}` : `${mins} ${t('min')}`;
  const time = at.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }), days = Math.round((new Date(at).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 864e5);
  $('cl-v').textContent = `${t(days >= 2 ? 'clear_at_later' : days === 1 ? 'clear_at_tm' : 'clear_at', { time })} (${t('clear_in', { d })})`;
  $('cl-s').textContent = t('clear_s');
}
// Der Promillewert sinkt mit der Zeit: Anzeige jede Minute neu rechnen
function renderLevel(animate) {
  const now = Date.now(), list = state.recent || [], lim = limit(), bac = hasBody() ? bacNow(list, now, ELIM) : 0;
  const over = bac > lim + EPS, p = bac / lim, prev = state.bac;
  const spec = lastGlass(), cur = $('cup').firstElementChild, fresh = cupEl(spec);
  if (!cur || cur.dataset.key !== fresh.dataset.key) { // anderes Glas: austauschen, kurz wippen lassen
    $('cup').replaceChildren(fresh); if (cur && animate) { $('cup').classList.remove('swap'); void $('cup').offsetWidth; $('cup').classList.add('swap'); }
  }
  const hund = (v) => fmtP(v / 100);
  countTo($('total'), Math.round(bac * 100), animate ? 1100 : 0, hund); countTo($('remaining'), Math.round(Math.abs(lim - bac) * 100), animate ? 1100 : 0, hund);
  $('ll-pre').textContent = t(over ? 'over_pre' : 'left_pre'); $('ll-post').textContent = t(over ? 'over_post' : 'left_post', { lim: fmtL(lim) });
  const run = () => { setLevel(p); $('track').style.setProperty('--p', Math.min(1, p)); };
  if (state.cupReady) run(); else { requestAnimationFrame(() => requestAnimationFrame(run)); state.cupReady = true; }
  $('track').classList.toggle('over', over); $('track').setAttribute('aria-valuenow', Math.round(Math.min(1, p) * 100)); $('cup').classList.toggle('over', over);
  const [ic, text] = statusFor(bac, over ? Math.max(p, 1.01) : Math.min(p, 1), list.length > 0), pill = $('pill');
  pill.querySelector('svg').replaceWith(ico(ic)); $('warn').textContent = text; pill.classList.toggle('over', over || bac >= 1.5);
  if (animate) { pill.classList.remove('pop'); void pill.offsetWidth; pill.classList.add('pop'); }
  if (animate && over && prev <= lim + EPS) { $('cup').classList.remove('shake'); void $('cup').offsetWidth; $('cup').classList.add('shake'); }
  const day = todays().slice().sort((a, b) => new Date(a.ts) - new Date(b.ts)), gsum = day.reduce((s, i) => s + Number(i.grams), 0) || 1;
  const layers = day.map((i) => { const d = state.drinks.find((x) => x.name === i.name); return { rgb: drinkRGB(i.name, d && d.kind, i.amount, i.mixer, i.mixer_amount), share: Number(i.grams) / gsum }; });
  state.bac = bac; Liquid.set(p, over, layers); renderStage(bac); renderClear(list, now);
}
setInterval(() => { if (state.loggedIn) { renderLevel(false); renderSelection(); } }, 60000);
function renderDash(newest, animate) {
  const items = todays();
  $('dash').classList.remove('is-loading');
  renderLevel(animate);
  const grams = items.reduce((s, i) => s + Number(i.grams), 0);
  $('day-sum').textContent = items.length ? t('day_sum', { g: fmtG(grams) }) : '';
  $('count').textContent = items.length ? `${items.length} ${t(items.length === 1 ? 'count_one' : 'count_many')}` : '';
  const ul = $('list'); ul.replaceChildren();
  if (!items.length) {
    const art = document.createElement('div');
    art.innerHTML = '<svg class="art" viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="st" d="M30 30h50v54a8 8 0 0 1-8 8H38a8 8 0 0 1-8-8Z"/><path d="M80 44h6a10 10 0 0 1 10 10v14a10 10 0 0 1-10 10h-6"/><path d="M44 44v34M56 44v34M68 44v34"/></svg>';
    ul.append(h('li', { class: 'empty' }, art.firstElementChild, h('h3', { text: t('empty_title') }), h('p', { text: t('empty_text') })));
  }
  items.forEach((i) => {
    const label = i.mixer ? `${drinkName(i.name)} + ${mixName(i.mixer)}` : drinkName(i.name);
    const x = h('button', { class: 'icon-btn', type: 'button', 'aria-label': `${label} ${t('remove')}`, title: t('remove') }, ico('x'));
    const li = h('li', { class: i.id === newest ? 'new' : '' },
      h('span', { class: 'time', text: new Date(i.ts).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) }),
      h('span', { class: 'nm' }, label, h('small', { class: 'amt', text: i.mixer ? ` · ${i.amount} + ${i.mixer_amount} ml` : ` · ${i.amount} ml` })),
      h('span', { class: 'mg', text: fmtG(i.grams) + ' g' }), x);
    x.onclick = async () => {
      try { ok(await sb.from('alc_intakes').delete().eq('id', i.id)); li.classList.add('leaving'); await sleep(280); await refresh(); renderSelection(); toast(t('removed')); }
      catch (err) { toast(err.message, 'err'); }
    };
    ul.append(li);
  });
}
$('add').onclick = async () => {
  const d = sel(), m = mixer(); if (!d || !state.amount || (m && !state.mixAmt) || !hasBody()) return;
  const btn = $('add'), amount = state.amount, g = gramsFor(d, amount); btn.disabled = true;
  try {
    const id = ok(await sb.rpc('alc_add_intake', { p_drink_id: Number(d.id), p_amount: amount, p_mixer_id: m ? Number(m.id) : null, p_mixer_amount: m ? state.mixAmt : null }));
    await playLoader(glassFor(d.name, d.kind, amount, m ? m.name : null, m ? state.mixAmt : null));
    await refresh(id);
    const r = $('cup').getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height * .35, `+${fmtG(g)} g`);
    const caf = cafFor(d, amount, m, state.mixAmt), nm = m ? `${drinkName(d.name)} + ${mixName(m.name)}` : drinkName(d.name);
    toast(caf > 0 ? t('added_caf', { name: nm, mg: caf }) : t('added', { name: nm }));
  } catch (err) { $('loader').classList.remove('on'); toast(err.message, 'err'); }
  finally { renderSelection(); }
};
// Zufällig, aber ohne Wiederholung: erst wenn alle durch sind, wird neu gemischt; der erste der neuen Runde ist nie der letzte alte
let factBag = [], lastFact = -1; try { lastFact = Number(localStorage.getItem('ar-lastfact')); if (!Number.isInteger(lastFact)) lastFact = -1; } catch { lastFact = -1; }
function nextFact() {
  const list = FACTS[LANG];
  if (!factBag.length) {
    factBag = list.map((_, i) => i);
    for (let i = factBag.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [factBag[i], factBag[k]] = [factBag[k], factBag[i]]; }
    if (factBag[factBag.length - 1] === lastFact && factBag.length > 1) { const k = Math.floor(Math.random() * (factBag.length - 1)); [factBag[factBag.length - 1], factBag[k]] = [factBag[k], factBag[factBag.length - 1]]; }
  }
  lastFact = factBag.pop(); try { localStorage.setItem('ar-lastfact', String(lastFact)); } catch { /* egal */ }
  return list[lastFact];
}
async function playLoader(spec) {
  const f = nextFact(), L = $('loader');
  $('ld-fact').replaceChildren(h('span', { class: 'ld-ico' }, ico(f.i)), h('h3', { text: f.t }), h('p', { text: f.x }));
  mountCup($('ld-cup'), spec); L.setAttribute('aria-hidden', 'false'); L.classList.add('on');
  // Anzeigedauer richtet sich nach der Länge des Spruchs (ca. 7 bis 12 Sekunden); Tippen beendet früher
  const ms = Math.min(12000, Math.max(7000, 3500 + (f.t.length + f.x.length) * 45));
  L.style.setProperty('--ld', ms + 'ms');
  await Promise.race([sleep(ms), new Promise((res) => { setTimeout(() => { L.onclick = res; }, 2500); })]);
  L.onclick = null;
  L.classList.remove('on'); L.setAttribute('aria-hidden', 'true'); await sleep(REDUCED ? 0 : 450);
}

/* ---------- Trinksprüche ---------- */
const tst = { cat: 'classic', last: '' };
function toastPool() { // für den Zufallsknopf: alle eigenen Sprüche der Sprache
  const T = TOASTS[LANG]; return ['classic', 'rhyme', 'funny', 'calm'].flatMap((c) => T[c].map((x) => [c, ...(Array.isArray(x) ? x : [x, ''])]));
}
function showToast(cat, text, sub) {
  $('tc-cat').textContent = t('tc_' + cat); const q = $('tc-text'); q.replaceChildren(h('span', { text })); if (sub) q.append(h('small', { text: sub }));
  tst.last = text + (sub ? ' (' + sub + ')' : ''); q.classList.remove('in'); void q.offsetWidth; q.classList.add('in');
}
function randomToast() {
  const pool = toastPool(); let pick; do { pick = pool[Math.floor(Math.random() * pool.length)]; } while (pool.length > 1 && tst.last.startsWith(pick[1]));
  showToast(pick[0], pick[1], pick[2]);
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast(t('toasts_copied')); }
  catch { toast(t('toasts_copy_fail'), 'err'); }
}
function renderToasts() {
  const ul = $('toast-list'); ul.replaceChildren();
  const items = tst.cat === 'world'
    ? CHEERS.map((c) => ({ main: c[0], sub: [LANG === 'de' ? c[2] : c[3], c[1] && LANG === 'de' ? t('toasts_say', { p: c[1] }) : ''].filter(Boolean).join(' · ') }))
    : TOASTS[LANG][tst.cat].map((x) => (Array.isArray(x) ? { main: x[0], sub: x[1] } : { main: x, sub: '' }));
  items.forEach((it, i) => {
    const cp = h('button', { class: 'icon-btn', type: 'button', 'aria-label': t('toasts_copy'), title: t('toasts_copy') }, ico('copy'));
    cp.onclick = () => copyText(tst.cat === 'classic' && it.sub ? `${it.main} (${it.sub})` : it.main);
    const li = h('li', {}, h('span', { class: 'tx' }, h('b', { text: it.main }), it.sub ? h('small', { text: it.sub }) : null), cp);
    li.style.setProperty('--i', i); li.onclick = (e) => { if (!e.target.closest('button')) showToast(tst.cat, it.main, it.sub); };
    ul.append(li);
  });
}
document.querySelectorAll('#tseg [role="tab"]').forEach((b) => b.onclick = () => { tst.cat = b.dataset.c; select($('tseg'), b); renderToasts(); });
$('tc-next').onclick = randomToast;
$('tc-copy').onclick = () => { if (tst.last) copyText(tst.last); };

/* ---------- Rangliste: wer hält am besten Maß? Oben steht, wer im eigenen Limit bleibt und am wenigsten trinkt. ---------- */
async function loadBoard() {
  const box = $('board'), token = ++loadBoard.n;
  box.replaceChildren(...[0, 1, 2, 3, 4].map(() => h('div', { class: 'sk-row' })));
  let rows;
  try { rows = ok(await sb.rpc('alc_leaderboard', { p_period: state.period })); }
  catch (err) {
    if (token === loadBoard.n) box.replaceChildren(h('div', { class: 'empty' }, h('h3', { text: t('board_err') }), h('p', { text: err.message }),
      h('button', { class: 'btn ghost', type: 'button', onclick: loadBoard }, h('span', { text: t('retry') }))));
    return;
  }
  if (token !== loadBoard.n) return;
  state.rows = rows; renderBoard(rows);
}
loadBoard.n = 0;
const stEl = (r) => (r.over_days > 0
  ? h('span', { class: 'st over' }, ico('alert'), t(state.period === 'day' ? 'st_over' : 'st_over_n', { n: r.over_days }))
  : h('span', { class: 'st' }, ico('check'), t('st_ok')));
function renderBoard(rows) {
  const box = $('board'); box.replaceChildren();
  if (!rows.length) {
    const e = h('div', { class: 'empty' }, ico('trophy'), h('h3', { text: t('board_empty_t') }), h('p', { text: t('board_empty_x') })); e.firstChild.classList.add('art'); box.append(e); return;
  }
  const max = Math.max(...rows.map((r) => r.total), 1), top = rows.slice(0, 3), pod = h('div', { class: 'podium' }), names = ['first', 'second', 'third'];
  [1, 0, 2].forEach((idx) => {
    const r = top[idx]; if (!r) { pod.append(h('div')); return; }
    const el = h('div', { class: `pod ${names[idx]}${r.username === state.username ? ' me' : ''}` },
      idx === 0 ? h('span', { class: 'crown' }, ico('crown')) : null, h('span', { class: 'av', text: r.username.charAt(0) }),
      h('span', { class: 'nm', text: r.username }), h('span', { class: 'mgv', text: r.total + ' g' }), stEl(r), h('span', { class: 'bar', text: String(idx + 1) }));
    el.style.setProperty('--i', idx === 0 ? 2 : idx === 1 ? 1 : 0); pod.append(el);
  });
  box.append(pod);
  const ol = h('ol', { class: 'rank' });
  rows.slice(3).forEach((r, i) => {
    const me = r.username === state.username, fb = h('i'); fb.style.setProperty('--p', (r.total / max).toFixed(3));
    const li = h('li', { class: me ? 'me' : '' }, h('span', { class: 'n', text: String(i + 4) }),
      h('span', { class: 'who' }, h('b', { text: r.username }, me ? h('span', { class: 'badge', text: t('you') }) : null), h('span', { class: 'fb' }, fb)),
      h('span', { class: 'v' }, r.total + ' g', stEl(r)));
    li.style.setProperty('--i', i); ol.append(li);
  });
  if (rows.length > 3) box.append(ol);
  box.append(h('p', { class: 'board-note', text: t('board_note') }));
}

/* ---------- Vorschlag ---------- */
$('sg-form').onsubmit = async (e) => {
  e.preventDefault(); msg('sg-msg');
  await busy(e.target.querySelector('button[type=submit]'), async () => {
    try {
      const abv = $('sg-abv').value === '' ? null : Number($('sg-abv').value);
      if ($('sg-name').value.trim().length < 2) throw new Error(t('e_sg_name'));
      if (abv !== null && !(abv >= 0 && abv <= 80)) throw new Error(t('e_sg_abv'));
      ok(await sb.rpc('alc_suggest_drink', { p_name: $('sg-name').value, p_portion: $('sg-portion').value, p_abv: abv }));
      msg('sg-msg'); e.target.reset(); toast(t('sg_ok'));
    }
    catch (err) { msg('sg-msg', err.message); }
  });
};

addEventListener('offline', () => toast(t('offline'), 'err'));
addEventListener('online', () => toast(t('online')));

/* ---------- Start ---------- */
applyAuthMode(); applyStatic(); mountCup($('hero-cup')); renderSelection();
(async () => {
  try {
    if (recovery) { show(false); return showAuth('reset'); }
    const { data: { session } } = await sb.auth.getSession();
    if (session) await enter(session.user).catch(() => show(false)); else show(false);
  } catch { show(false); }
})();
setTimeout(() => document.body.classList.remove('booting'), 6000);

// iPhone: Bewegungssensor braucht eine Erlaubnis, deshalb gibt es dort einen Knopf
(() => {
  if (!Liquid.needsAsk) return; $('tilt-box').hidden = false;
  $('tilt-on').onclick = async () => { const okk = await Liquid.enable(); toast(t(okk ? 'tilt_ok' : 'tilt_no'), okk ? '' : 'err'); };
})();
// Schalter für Effekte trotz "weniger Bewegung" im System
(() => {
  const box = $('fx-box'), b = $('fx-toggle'); if (!box || !SYSTEM_REDUCED) return;
  box.hidden = false;
  const label = () => { b.textContent = t(FX_FORCE ? 'fx_off' : 'fx_on'); };
  label(); b.onclick = () => { try { if (FX_FORCE) localStorage.removeItem('ar-fx'); else localStorage.setItem('ar-fx', 'on'); } catch { /* egal */ } location.reload(); };
})();
