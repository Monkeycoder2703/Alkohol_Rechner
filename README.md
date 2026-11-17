# Alkohol Rechner

Trag deine Getränke ein und sieh, wie viel Promille du ungefähr hast und wie nah du an deinem eigenen Limit bist. Schwesterprojekt des [Koffein Rechners](https://github.com/Monkeycoder2703/Koffein_Rechner).

- Getränke nach Art (Bier, Wein, Schnaps, Mix), Menge frei wählbar
- Optional ein Mixer dazu (Cola, Tonic, Saft …)
- Promille-Schätzung nach Widmark, eigenes Limit, „wieder nüchtern“-Zeit
- Rangliste: oben steht, wer im Limit bleibt und am wenigsten trinkt
- Deutsch und Englisch, als App installierbar

Alle Werte sind Schätzungen. Die App sagt nicht, ob man fahren darf.

## Technik
Statische Seite (GitHub Pages) plus Supabase-Projekt `alkohol-rechner`. Adresse und öffentlicher Schlüssel stehen in `config.js`. Das Datenbank-Schema liegt als Migration `init_alkohol_rechner` im Supabase-Projekt, die Funktion `delete-account` unter Edge Functions. Regeln und Rechnung: siehe `DESIGN.md`.

## Einrichten
1. GitHub: Settings → Pages → Branch `main`, Ordner `/`.
2. Supabase: Authentication → URL Configuration → Site URL und Redirect URL auf `https://monkeycoder2703.github.io/Alkohol_Rechner/` setzen.
