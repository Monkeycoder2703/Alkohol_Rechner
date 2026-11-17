# DESIGN.md – Alkohol Rechner

Schwesterprojekt des Koffein Rechners: gleicher Aufbau, andere Farben, andere Getränke, andere Haltung.

## Charakter
Eine Cocktailbar um Mitternacht: tiefes Nachtblau, Gold wie Sekt im Glas, Eisblau als Kontrast. Der Held der Seite ist der **Krug**, der sich füllt, je näher du deinem eigenen Limit kommst.

## Haltung
- Die App soll helfen, das eigene Limit zu kennen. Sie belohnt nie mehr Trinken.
- Hinweise sind kurz und freundlich, kein erhobener Zeigefinger.
- Nichts wird durch Trinken freigeschaltet.
- Die Rangliste sortiert nach „im Limit geblieben“, dann nach wenig Alkohol. Mehr trinken bringt nach unten.
- Überall steht dabei: Schätzung, kein Messwert, keine Freigabe zum Fahren.

## Palette „Mitternacht & Gold“
Bühne `#070B1A`, Gold `#F5C451` (Hauptaktion), warmes Gold `#E89A3C` (Glow), Creme `#FFE9A8` (Highlights), ein Kontrast: Eisblau `#7FD4FF` (Schlagschatten, Links, Erfolg). Rot `#FF4D6A` nur für „über dem Limit“ und Fehler. Kein Violett. Tokens stehen in `:root` in `style.css`.

## Hintergrund
Ruhige Nacht: ein sanfter blauer Lichtschein von oben, ein Hauch Gold von unten, darin viele feine aufsteigende Bläschen (26 auf dem Handy, 54 am PC). Keine Farbwolken, keine Punkte, kein Wasser-Effekt. Bei „weniger Bewegung“ stehen die Bläschen still. 

`liquid.js` zeichnet die Flüssigkeit in ein Canvas. Sie steigt mit dem Promillewert (am eigenen Limit 70 % der Bildschirmhöhe, höchstens 90 %). Das Handy ist das Glas: Dreht man es, bleibt die Oberfläche waagerecht (Winkel aus der Schwerkraft, berechnet aus beta und gamma), schwappt nach und wirft Wellen, die an den Bildschirmrändern zurücklaufen. Die Wellen sind gekoppelte Federn (Höhe und Tempo je Spalte). Dazu Lichtbänder im Wasser, eine helle Oberflächenkante und Glanzpunkte auf den Kämmen. Antippen oder die Maus über die Oberfläche ziehen macht Wellen, ein neues Getränk plätschert. Auf dem Handy 30 Bilder pro Sekunde. Das iPhone braucht für die Bewegung eine Erlaubnis (Konto → Flüssigkeit kippen). Animationen laufen auch beim Scrollen weiter. Die Flüssigkeit besteht aus den Getränken des Tages: jede Schicht hat die Farbe ihres Getränks (Mischgetränke gemischt mit der Mixer-Farbe), unten das erste, oben das letzte. Die Dicke richtet sich nach dem Alkoholanteil. Über dem Limit bekommt die Oberfläche eine rote Kante.

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


## Trinksprüche
`toasts.js`: vier Gruppen je Sprache – Klassiker (alte, freie Sprüche mit Herkunft), Reime, Lustig, Mit Maß – und „Prost“ in 24 Sprachen. Oben ein großer Zufallsspruch zum Kopieren. Die Sprüche sollen gute Laune machen, nie zum Mehrtrinken drängen.

## Gläser
`glasses.js`: Der Becher auf der Startseite zeigt das Glas des zuletzt eingetragenen Getränks in dessen Farbe (Halbe als Glaskrug mit Henkel und Noppen, Maß ab 0,9 l Bier, Weizen, Pilstulpe, Stange, Pint, Wein, Rotwein-/Spritzkelch, Sektflöte, Glühweintasse, Stamperl, Tumbler, Longdrink mit Strohhalm, Cocktailschale). Bier hat eine Schaumkrone, Longdrinks und Spritz haben Eis. Ohne Getränk steht eine Halbe da.
