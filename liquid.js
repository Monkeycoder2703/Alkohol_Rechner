'use strict';
/* Flüssigkeit im Hintergrund, gezeichnet in ein Canvas. Je näher der Promillewert am eigenen Limit ist, desto höher steht sie.
   Das Handy ist das Glas: Dreht man es, bleibt die Oberfläche waagerecht, schwappt nach und wirft Wellen,
   die an den Bildschirmrändern zurücklaufen. Antippen oder die Maus über die Oberfläche ziehen macht ebenfalls Wellen.
   Wellen: eine Reihe gekoppelter Federn (Höhe und Tempo je Spalte). Bei "weniger Bewegung" steht alles still. */
// Farben der Getränke (R, G, B). Unbekannte Namen bekommen die Farbe ihrer Art.
const GOLD = [242, 182, 50], CLEAR = [221, 232, 245], BROWN = [181, 101, 29], DARK = [74, 42, 22], RED = [155, 27, 48], PALE = [243, 227, 160], ORANGE = [255, 122, 47];
const DRINK_RGB = (() => {
  const m = {}, put = (c, names) => names.split(',').forEach((n) => { m[n.trim().toLowerCase()] = c; });
  put(GOLD, 'Pils,Helles,Export,Kellerbier,Festbier,Alkoholfreies Bier,Mexikanisches Lager,Pale Ale,IPA,Biermischgetränk'); put([245, 200, 96], 'Weizenbier,Kölsch,Berliner Weiße,Whisky Sour');
  put([247, 220, 111], 'Radler,Cider,Apfelwein,Apfelkorn'); put(DARK, 'Schwarzbier,Stout,Altbier,Bockbier,Colabier,Kräuterlikör,Kaffeelikör,Espresso Martini,Cuba Libre,Longdrink aus der Dose');
  put(RED, 'Rotwein,Glühwein,Lambrusco,Sangria,Portwein,Feuerzangenbowle'); put([244, 166, 160], 'Rosé,Bowle,Bellini'); put(PALE, 'Weißwein,Sekt,Prosecco,Champagner,Weinschorle,Federweißer,Sake,Hugo,Martini');
  put([201, 138, 43], 'Sherry,Met,Wermut,Old Fashioned,Mai Tai'); put(BROWN, 'Whisky,Bourbon,Rum,Rum 80 %,Weinbrand,Cognac,Amaretto,Haselnussschnaps,Long Island Iced Tea');
  put(CLEAR, 'Vodka,Gin,Korn,Doppelkorn,Obstler,Ouzo,Tequila,Grappa,Raki,Sambuca,Aquavit,Williamsbirne,Kirschwasser,Zwetschgenwasser,Cachaça,Mezcal,Hard Seltzer,Gin Tonic');
  put([79, 214, 160], 'Pfefferminzlikör'); put([155, 227, 107], 'Absinth,Saurer Apfel,Mojito,Caipirinha,Margarita'); put([241, 223, 184], 'Sahnelikör,Kokoslikör,Piña Colada,Moscow Mule');
  put([246, 208, 77], 'Eierlikör,Limoncello,Limoncello Spritz,Mimosa'); put(ORANGE, 'Orangenlikör,Aperitif-Bitter,Aperol Spritz,Tequila Sunrise,Sex on the Beach,Zombie,Pfirsichlikör');
  put([209, 31, 58], 'Bitterlikör,Negroni,Bloody Mary'); put([224, 90, 138], 'Feigenlikör,Cosmopolitan,Wild Berry Spritz'); put([92, 200, 240], 'Alkopop,Swimming Pool');
  // Marken zum Selbermischen
  put(BROWN, "Asbach Uralt,Mariacron,Chantré,Wilthener Goldkrone,Metaxa 5 Sterne,Bacardi Spiced,Captain Morgan Spiced Gold,Captain Morgan Dark Rum,Jack Daniel's,Jim Beam");
  put(CLEAR, "Bacardi Carta Blanca,Malibu,Pitú,Wodka Gorbatschow,Smirnoff,Eristoff,Puschkin,Three Sixty,Gordon's Gin");
  put(DARK, 'Jägermeister,Fernet Branca'); put([224, 90, 138], 'Bacardi Razz'); put([241, 223, 184], 'Baileys'); put([230, 60, 60], 'Passoa');
  return m;
})();
const MIXER_RGB = (() => {
  const m = {}, put = (c, names) => names.split(',').forEach((n) => { m[n.trim().toLowerCase()] = c; });
  put([59, 30, 14], 'Cola,Cola Zero'); put([232, 212, 74], 'Energy Drink'); put([234, 244, 242], 'Tonic Water,Sprudelwasser,Zitronenlimo'); put([242, 240, 176], 'Bitter Lemon,Ginger Beer');
  put([230, 195, 106], 'Ginger Ale,Apfelsaft'); put([255, 154, 31], 'Orangenlimo,Orangensaft,Maracujasaft'); put([194, 24, 58], 'Cranberrysaft'); put(BROWN, 'Eistee');
  return m;
})();
const KIND_RGB = { beer: GOLD, wine: PALE, spirit: CLEAR, mixed: ORANGE };
// Farbe eines Eintrags: Getränk, bei einem Mischgetränk nach Menge mit dem Mixer gemischt
function drinkRGB(name, kind, amount, mixer, mixAmt) {
  const d = DRINK_RGB[String(name).toLowerCase()] || KIND_RGB[kind] || GOLD, m = mixer && MIXER_RGB[String(mixer).toLowerCase()];
  if (!m || !mixAmt) return d;
  const w = Math.max(.25, amount / (amount + mixAmt)); // der Schnaps bleibt sichtbar, auch bei viel Mixer
  return d.map((v, i) => Math.round(v * w + m[i] * (1 - w)));
}
const Liquid = (() => {
  const bg = $('bg'), cv = document.createElement('canvas'); cv.className = 'liq'; bg.insertBefore(cv, bg.firstChild);
  const ctx = cv.getContext('2d');
  const N = LITE ? 44 : 72, hgt = new Float32Array(N), spd = new Float32Array(N), lD = new Float32Array(N), rD = new Float32Array(N);
  const K = .022, DAMP = .009, SPREAD = .24, MAXH = 70; // Federhärte, Dämpfung (wenig = Wasser), Ausbreitung, größte Welle in px
  let W = 0, H = 0, dpr = 1, fill = 0, fillTarget = 0, over = false, layers = [{ rgb: GOLD, share: 1 }];
  let ang = 0, angV = 0, angT = 0, raf = 0, last = 0, acc = 0, frame = 0, nextDrip = 0, listening = false, t0 = performance.now();
  function size() {
    dpr = Math.min(devicePixelRatio || 1, LITE ? 1 : 1.5); W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); draw();
  }
  addEventListener('resize', size);
  const col = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const xs = (i) => i / (N - 1) * W;
  // Höhe der Oberfläche an Spalte i (Bildschirm-y): Ruhelinie, gekippt um ang, plus Welle
  const surf = (i, k) => H * (1 - fill) + (xs(i) - W / 2) * Math.tan(ang) + hgt[i] * k;
  function splash(x, v) { const i = Math.max(1, Math.min(N - 2, Math.round(x / W * (N - 1)))); spd[i] += v; spd[i - 1] += v * .5; spd[i + 1] += v * .5; }
  function physics() {
    for (let i = 0; i < N; i++) { spd[i] += -K * hgt[i] - DAMP * spd[i]; hgt[i] += spd[i]; }
    for (let p = 0; p < 6; p++) {
      for (let i = 0; i < N; i++) { lD[i] = i > 0 ? SPREAD * (hgt[i] - hgt[i - 1]) : 0; rD[i] = i < N - 1 ? SPREAD * (hgt[i] - hgt[i + 1]) : 0; }
      for (let i = 0; i < N; i++) { if (i > 0) { spd[i - 1] += lD[i]; hgt[i - 1] += lD[i]; } if (i < N - 1) { spd[i + 1] += rD[i]; hgt[i + 1] += rD[i]; } }
    }
    for (let i = 0; i < N; i++) hgt[i] = Math.max(-MAXH, Math.min(MAXH, hgt[i]));
  }
  // ein Schritt mit 60 Hz: Kippwinkel federt nach (das ist das Nachschwappen), seine Drehung wirft Wellen
  function tick() {
    const prev = ang; angV += ((angT - ang) * 90 - angV * 7) / 60; ang += angV / 60;
    const turn = ang - prev; // Drehung in diesem Schritt: auf der einen Seite schwappt es hoch, auf der anderen runter
    if (Math.abs(turn) > 1e-5) for (let i = 0; i < N; i++) spd[i] += -turn * (xs(i) - W / 2) * .9;
    if (performance.now() > nextDrip) { splash(Math.random() * W, (Math.random() - .5) * 3); nextDrip = performance.now() + 900 + Math.random() * 1600; } // ruhiges Eigenleben
    fill += (fillTarget - fill) * .03; physics();
  }
  function path(k, off) { // Linie parallel zur Oberfläche, k = wie stark sie die Welle mitmacht
    ctx.moveTo(-2, surf(0, k) + off);
    for (let i = 1; i < N - 1; i++) { const x = xs(i), y = surf(i, k) + off, nx = xs(i + 1), ny = surf(i + 1, k) + off; ctx.quadraticCurveTo(x, y, (x + nx) / 2, (y + ny) / 2); }
    ctx.lineTo(W + 2, surf(N - 1, k) + off);
  }
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    if (fill < .002) return;
    const depth = fill * H, ls = layers.slice(-12), sum = ls.reduce((s, l) => s + Math.max(.06, l.share), 0), deep = H * 1.6;
    // Schichten von oben (zuletzt getrunken) nach unten; innere Grenzen machen die Welle abgeschwächt mit
    let y = 0;
    for (let j = ls.length - 1; j >= 0; j--) {
      const hgtL = j === 0 ? deep : Math.max(.06, ls[j].share) / sum * depth, k1 = Math.pow(.55, ls.length - 1 - j), k2 = k1 * .55;
      ctx.beginPath(); path(k1, y); ctx.lineTo(W + 2, H + deep); ctx.lineTo(-2, H + deep); ctx.closePath();
      if (j > 0) { ctx.save(); ctx.beginPath(); path(k1, y); const yb = y + hgtL; ctx.lineTo(W + 2, surf(N - 1, k2) + yb); for (let i = N - 2; i >= 0; i--) ctx.lineTo(xs(i), surf(i, k2) + yb); ctx.closePath(); }
      ctx.fillStyle = col(ls[j].rgb, j === ls.length - 1 ? .40 : .34); ctx.fill(); if (j > 0) ctx.restore();
      y += hgtL;
    }
    // Tiefe: nach unten dunkler, wie in einem vollen Glas
    const top = H * (1 - fill) - Math.abs(Math.tan(ang)) * W / 2 - MAXH;
    const g = ctx.createLinearGradient(0, top, 0, H); g.addColorStop(0, 'rgba(4,6,16,0)'); g.addColorStop(1, 'rgba(4,6,16,.42)');
    ctx.beginPath(); path(1, 0); ctx.lineTo(W + 2, H + 2); ctx.lineTo(-2, H + 2); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
    // Lichtbänder im Wasser (Kaustik): langsam wandernde, helle Wellenlinien unter der Oberfläche
    if (!LITE || frame % 2 === 0) {
      const tt = (performance.now() - t0) / 1000; ctx.save(); ctx.beginPath(); path(1, 0); ctx.lineTo(W + 2, H + 2); ctx.lineTo(-2, H + 2); ctx.closePath(); ctx.clip();
      ctx.lineWidth = 2; for (let c = 0; c < 4; c++) {
        ctx.beginPath(); const base = 26 + c * 38;
        for (let x = -10; x <= W + 10; x += 14) { const yy = H * (1 - fill) + (x - W / 2) * Math.tan(ang) + base + Math.sin(x / (60 + c * 17) + tt * (.7 + c * .23)) * (7 + c * 2); x < 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); }
        ctx.strokeStyle = `rgba(255,255,255,${.07 - c * .012})`; ctx.stroke();
      }
      ctx.restore();
    }
    // Oberfläche: helle Kante (bei Überschreitung rot), darunter ein weicher Lichtschimmer
    ctx.beginPath(); path(1, 5); ctx.lineWidth = 10; ctx.strokeStyle = over ? 'rgba(255,77,106,.20)' : 'rgba(255,255,255,.07)'; ctx.stroke();
    ctx.beginPath(); path(1, 0); ctx.lineWidth = over ? 3 : 2; ctx.strokeStyle = over ? 'rgba(255,77,106,.9)' : 'rgba(255,245,220,.62)'; ctx.stroke();
    // Glanzpunkte auf den Wellenkämmen
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    for (let i = 2; i < N - 2; i += 3) if (hgt[i] < -6 && hgt[i] <= hgt[i - 1] && hgt[i] <= hgt[i + 1]) { ctx.beginPath(); ctx.arc(xs(i), surf(i, 1) + 2, 1.8, 0, 7); ctx.fill(); }
  }
  function loop(ts) {
    raf = 0; if (document.hidden) return;
    acc += Math.min(.1, (ts - last) / 1000); last = ts;
    while (acc >= 1 / 60) { tick(); acc -= 1 / 60; }
    frame++; if (!LITE || frame % 2 === 0) draw(); // Handy: 30 Bilder pro Sekunde reichen und sparen Akku
    if (fillTarget > 0 || fill > .002) raf = requestAnimationFrame(loop); else draw();
  }
  const run = () => { if (!raf && !REDUCED && !document.hidden) { last = performance.now(); acc = 0; raf = requestAnimationFrame(loop); } };
  document.addEventListener('visibilitychange', run);
  // Lage des Handys -> Winkel der Oberfläche. Schwerkraft aus beta/gamma, damit es auch im Hochformat stimmt.
  function onTilt(e) {
    if (e.beta == null || e.gamma == null) return;
    const b = e.beta * Math.PI / 180, g = e.gamma * Math.PI / 180, ux = -Math.sin(g) * Math.cos(b), uy = Math.sin(b), m = Math.hypot(ux, uy);
    const o = ((screen.orientation && screen.orientation.angle) || window.orientation || 0) * Math.PI / 180;
    let roll = Math.atan2(ux, uy) - o; while (roll > Math.PI) roll -= 2 * Math.PI; while (roll < -Math.PI) roll += 2 * Math.PI;
    const w = Math.max(0, Math.min(1, (m - .15) / .45)); // flach liegendes Handy: Oberfläche bleibt eher gerade
    angT = Math.max(-.85, Math.min(.85, roll * w)); run();
  }
  // Mit der Maus über die Oberfläche fahren oder antippen: Wellen
  let px = null;
  addEventListener('pointermove', (e) => {
    if (fill < .01) return; const i = Math.round(e.clientX / W * (N - 1)), near = Math.abs(e.clientY - surf(Math.max(0, Math.min(N - 1, i)), 1)) < 60;
    if (near && px !== null) splash(e.clientX, Math.max(-6, Math.min(6, (e.clientX - px) * .25 + 1.5))); px = e.clientX; run();
  }, { passive: true });
  addEventListener('pointerdown', (e) => { if (fill > .01 && e.clientY > surf(0, 0) - 80) { splash(e.clientX, 9); run(); } }, { passive: true });
  const supported = 'DeviceOrientationEvent' in window && !REDUCED;
  const canAsk = supported && typeof DeviceOrientationEvent.requestPermission === 'function';
  const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const needsAsk = canAsk && IOS; // nur das iPhone zeigt dabei eine Rückfrage, deshalb dort erst per Knopf im Konto
  function listen() { if (listening) return; listening = true; addEventListener('deviceorientation', onTilt, { passive: true }); }
  async function enable() {
    if (!supported) return false;
    if (canAsk) { try { if (await DeviceOrientationEvent.requestPermission() !== 'granted') return false; } catch { return false; } }
    if (needsAsk) { try { localStorage.setItem('ar-tilt', 'on'); } catch { /* egal */ } }
    listen(); return true;
  }
  if (supported) {
    listen(); // schadet nie: ohne Freigabe kommen einfach keine Werte
    let on = !needsAsk; if (needsAsk) { try { on = localStorage.getItem('ar-tilt') === 'on'; } catch { /* egal */ } }
    if (canAsk && on) addEventListener('pointerup', () => { enable(); }, { once: true }); // Freigabe braucht eine Berührung
  }
  // p = Anteil am Limit (1 = Limit erreicht). Am Limit steht die Flüssigkeit bei 70 % der Höhe, mehr als 90 % werden es nie, damit man die Oberfläche noch sieht.
  // layers = die getrunkenen Getränke von unten (zuerst getrunken) nach oben, jeweils { rgb: [r, g, b], share: Anteil }.
  // p = Anteil am Limit (1 = Limit erreicht): am Limit 70 % der Höhe, mehr als 90 % werden es nie.
  function set(p, ov, ls) {
    const f = Math.max(0, Math.min(.9, p * .7)), rose = f - fillTarget;
    fillTarget = f; over = !!ov; if (ls && ls.length) layers = ls; else if (f <= 0) layers = [{ rgb: GOLD, share: 1 }];
    if (rose > .01 && fill > .002) for (let k = 0; k < 3; k++) splash(W * (.3 + Math.random() * .4), 10 + Math.random() * 8); // neues Getränk: es plätschert
    if (REDUCED) { fill = fillTarget; draw(); } else run();
  }
  size();
  return { set, enable, needsAsk, supported };
})();
