# DESIGN.md – Alkohol Rechner

Schwesterprojekt des Koffein Rechners: gleicher Aufbau, andere Farben, andere Getränke, andere Haltung.

## Charakter
Eine gute Bar bei Nacht: dunkles Flaschengrün, Bernstein-Glow, harte Limetten-Schatten. Der Held der Seite ist der **Krug**, der sich füllt, je näher du deinem eigenen Limit kommst.

## Haltung
- Die App soll helfen, das eigene Limit zu kennen. Sie belohnt nie mehr Trinken.
- Hinweise sind kurz und freundlich, kein erhobener Zeigefinger.
- Nichts wird durch Trinken freigeschaltet. Der Party-Modus ist immer frei schaltbar.
- Die Rangliste sortiert nach „im Limit geblieben“, dann nach wenig Alkohol. Mehr trinken bringt nach unten.
- Überall steht dabei: Schätzung, kein Messwert, keine Freigabe zum Fahren.

## Palette „Flaschengrün & Bernstein“
Bühne `#060D0A`, Bernstein `#FFB020` (Hauptaktion), Spritz-Orange `#FF6A2B` (Glow), Schaum-Creme `#FFE39A` (Highlights), ein Kontrast: Limette `#B6F23C` (Schlagschatten, Links, Erfolg). Rot `#FF3355` nur für „über dem Limit“ und Fehler. Kein Violett. Tokens stehen in `:root` in `style.css`.

Schrift, Abstände, Eckenradius, Icons, CSP und Zustände wie im Koffein Rechner (Bricolage Grotesque, Skala 4–72 px, Radius 16 px, SVG-Sprite, kein Inline-Style/-Script).

## Rechnung
- Gramm Alkohol = ml × Vol.-% ÷ 100 × 0,789.
- Promille = Gramm ÷ (Gewicht × Faktor). Faktor: 0,68 männlich, 0,55 weiblich, 0,6 Mittelwert.
- Abbau: 0,15 ‰ pro Stunde. Für „wieder nüchtern“ vorsichtiger: 0,1 ‰ pro Stunde.
- Kein Resorptionsabzug, damit der Wert eher zu hoch als zu niedrig ist.
- Ein „Tag“ geht von 6 bis 6 Uhr, damit ein Abend nicht um Mitternacht zerschnitten wird.
- **Der Server rechnet die Gramm** (`add_intake`), der Browser schickt nur Getränk, Menge und Mixer. Die Rangliste rechnet in `bac_stats` genauso wie der Browser.

## Mischgetränk
Nach Getränk und Menge kommt optional „Womit mischst du?“: Pur oder ein Mixer mit 100/200/300 ml oder eigener Menge. Der Mixer ändert die Alkoholmenge nicht, nur Name, Glasgröße und die angezeigte Stärke der Mischung.

## Deine Werte
Gewicht, Rechenfaktor und Limit (0,2 bis 1,0 ‰, Standard 0,5) stehen im Profil und sind nur für die Person selbst lesbar (RLS). Ohne Werte kann man nichts eintragen.

## Sprachen
`i18n.js` enthält alle Texte in Deutsch und Englisch. Neue Texte immer in beiden Sprachen eintragen.

## Party-Modus
Wie der Chaos Mode im Koffein Rechner (Licht, Laser, Musik), aber ohne Freischaltung. Warn-Dialog vor dem ersten Start, Blinken unter 3 Hz, Esc beendet sofort. Musik: `music/playlist.json`, ohne Songs läuft der eingebaute Beat.
