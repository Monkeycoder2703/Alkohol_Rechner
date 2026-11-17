# Alkohol Rechner

Trag deine Getränke ein und sieh, wie viel Promille du ungefähr hast und wie nah du an deinem eigenen Limit bist. Schwesterprojekt des [Koffein Rechners](https://github.com/Monkeycoder2703/Koffein_Rechner).

- Getränke nach Art (Bier, Wein, Schnaps, Mix), Menge frei wählbar
- Optional ein Mixer dazu (Cola, Tonic, Saft …)
- Promille-Schätzung nach Widmark, eigenes Limit, „wieder nüchtern“-Zeit
- Rangliste: oben steht, wer im Limit bleibt und am wenigsten trinkt
- Trinksprüche zum Kopieren, dazu „Prost“ in 24 Sprachen
- Hintergrund aus den getrunkenen Getränken, der beim Drehen des Handys schwappt
- Deutsch und Englisch, als App installierbar

Alle Werte sind Schätzungen. Die App sagt nicht, ob man fahren darf.

## Technik
Statische Seite (GitHub Pages) im **selben Supabase-Projekt wie der Koffein Rechner** (`koffein-rechner`): gleiche Konten und Benutzernamen, eigene Tabellen und Funktionen mit dem Präfix `alc_` (Migration `alkohol_rechner_tables`). Adresse und öffentlicher Schlüssel stehen in `config.js`. Konto löschen nutzt die Funktion `delete-account` des Koffein Rechners und löscht das Konto in beiden Apps. Regeln und Rechnung: siehe `DESIGN.md`.

## Einrichten
1. GitHub: Settings → Pages → Branch `main`, Ordner `/`.
2. Supabase (Projekt `koffein-rechner`): Authentication → URL Configuration → unter Redirect URLs zusätzlich `https://monkeycoder2703.github.io/Alkohol_Rechner/` eintragen.
