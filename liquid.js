'use strict';
/* Flüssigkeit im Hintergrund: Je näher der Promillewert am eigenen Limit ist, desto höher steht sie.
   Auf dem Handy bleibt die Oberfläche waagerecht, wenn man das Gerät kippt, und schwappt kurz nach (gedämpfte Feder).
   Gerechnet wird nur, solange sich etwas bewegt. Bei "weniger Bewegung" steht die Flüssigkeit still. */
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
  function set(p, over) {
    const f = Math.max(0, Math.min(.9, p * .7));
    el.style.setProperty('--fill', f.toFixed(3)); el.classList.toggle('empty', f <= 0); el.classList.toggle('over', !!over);
  }
  return { set, enable, needsAsk, supported };
})();
