'use strict';
/* Flüssigkeit im Hintergrund: Je näher der Promillewert am eigenen Limit ist, desto höher steht sie.
   Auf dem Handy bleibt die Oberfläche waagerecht, wenn man das Gerät kippt, und schwappt kurz nach (gedämpfte Feder).
   Gerechnet wird nur, solange sich etwas bewegt. Bei "weniger Bewegung" steht die Flüssigkeit still. */
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
  const bg = $('bg'), el = document.createElement('i'), wave = document.createElement('i');
  el.className = 'liq empty'; wave.className = 'liq-wave'; el.append(wave); bg.insertBefore(el, bg.firstChild);
  let ang = 0, vel = 0, target = 0, raf = 0, last = 0, listening = false;
  function step(ts) {
    const dt = Math.min(.05, Math.max(.001, (ts - last) / 1000)); last = ts;
    vel += ((target - ang) * 70 - vel * 5) * dt; ang += vel * dt; // Feder: zieht zur Waagerechten, schwingt etwas über
    el.style.setProperty('--tilt', ang.toFixed(2) + 'deg');
    if (Math.abs(target - ang) < .05 && Math.abs(vel) < .05) { raf = 0; return; }
    raf = requestAnimationFrame(step);
  }
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); } };
  function onTilt(e) {
    if (e.gamma == null || e.beta == null) return;
    const o = (screen.orientation && screen.orientation.angle) || 0;
    const g = o === 90 ? e.beta : o === 270 ? -e.beta : e.gamma; // Querformat: andere Achse
    target = Math.max(-40, Math.min(40, -g)); kick();
  }
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
  // Jede Schicht bekommt die Farbe ihres Getränks; die Dicke richtet sich nach dem Alkohol, den es beigetragen hat.
  function set(p, over, layers) {
    const f = Math.max(0, Math.min(.9, p * .7));
    el.style.setProperty('--fill', f.toFixed(3)); el.classList.toggle('empty', f <= 0); el.classList.toggle('over', !!over);
    if (f <= 0) return;
    const ls = (layers && layers.length ? layers : [{ rgb: GOLD, share: 1 }]).slice(-12); // höchstens die letzten 12 Schichten
    const min = .06, sum = ls.reduce((s, l) => s + Math.max(min, l.share), 0), depth = f * 100, soft = Math.min(1.2, depth / ls.length / 4);
    const col = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`, stops = []; let y = 0;
    for (let i = ls.length - 1; i >= 0; i--) { // oben beginnt die zuletzt getrunkene Schicht
      const h = Math.max(min, ls[i].share) / sum * depth, a = i === ls.length - 1 ? .42 : .34;
      stops.push(`${col(ls[i].rgb, a)} ${(y + (y ? soft : 0)).toFixed(2)}vh`, `${col(ls[i].rgb, .3)} ${(y + h - (i ? soft : 0)).toFixed(2)}vh`); y += h;
    }
    stops.push(`${col(ls[0].rgb, .16)} 170vmax`);
    el.style.background = `linear-gradient(180deg,${stops.join(',')})`;
  }
  return { set, enable, needsAsk, supported };
})();
