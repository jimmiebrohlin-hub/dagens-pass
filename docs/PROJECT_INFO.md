# PROJECT_INFO – Vardagsstyrka

Dokumentversion: 2
Senast uppdaterad: 2026-06-21

## Syfte

Vardagsstyrka är ett pågående app-projekt med fokus på enkel daglig användning, tydligt kärnflöde och iterativ vidareutveckling.

Appen ska vara lätt att förstå, snabb att använda och enkel att bygga vidare på över tid.

## Länkar

Repository:
https://github.com/jimmiebrohlin-hub/dagens-pass

Backlog:
GitHub Issues/Projects i detta repo.

Releasehistorik:
docs/RELEASE_HISTORY.md

Produktionsmiljö:
Lovable publicerad app. Aktuell länk bör hållas uppdaterad här eller i README.

## Aktuell status

Aktuell appversion:
Verifieras i koden innan implementation eller release. package.json har ingen tydlig appversion utan beskriver främst kodbasen.

Projektstatus:
Tidigt aktivt app-projekt.

Primärt arbetssätt:
Backlogstyrd implementation i små batcher.

## Teknisk grund

- React
- TypeScript
- TanStack Start
- Vite
- Tailwind/shadcn-liknande komponentstruktur
- Prettier och ESLint finns i projektet

## Huvudfunktioner

1. Enkel daglig användarupplevelse.
2. Låg tröskel för att komma igång.
3. Tydlig startsida och tydliga primära val.
4. Möjlighet att bygga ut med historik och progression.
5. Mobilvänlig användning.
6. Backlogstyrd vidareutveckling.

## Implementerat över tid

### Tidig grund

- Projektet har skapats i GitHub.
- Första TanStack-baserade kodbas finns.
- Backlog har börjat byggas upp.
- Implementation sker stegvis efter prioritet.

### Planerad riktning

- Tydligare startsida och första användarflöde.
- Enkel daglig aktivitet eller rutin.
- Progression och återkommande användning.
- Mobil-UX som primärt fokus.
- Teknisk skuld ska hanteras tidigt eftersom projektet är nytt.

## Viktiga beslut

1. Appen ska vara enkel och lågtrösklig.
2. Den ska utvecklas iterativt i små batcher.
3. Backlog i GitHub är normal källa för planerat arbete.
4. Version ska uppdateras vid ny implementation.
5. Dokumentation ska byggas upp tidigt för att undvika historikskuld.
6. Större förändringar ska dokumenteras i RELEASE_HISTORY.

## Känd teknisk skuld och uppföljning

| Område | Prio | Kommentar |
|---|---:|---|
| Produktdefinition | Hög | Appens kärnflöde behöver förtydligas över tid. |
| Backlogstruktur | Hög | Prioriterade items och t-shirt sizes bör hållas uppdaterade. |
| Mobil-UX | Hög | Appen bör fungera mycket bra på mobil från början. |
| Releasehistorik | Medel | Bör fyllas på successivt. |
| Teknisk struktur | Medel | Tidig struktur bör hållas enkel och lätt att bygga vidare på. |

## Roadmap i kortform

| Område | Prio | Status |
|---|---:|---|
| Kärnflöde | Hög | Behöver förtydligas |
| Startsida | Hög | Kommande/fördjupning |
| Mobil-UX | Hög | Kommande/fördjupning |
| Historik/progression | Medel | Kommande |
| Teknisk skuld | Löpande | Återkommande batcher |

## Nästa rekommenderade fokus

1. Förtydliga kärnflödet.
2. Implementera högst prioriterade backlog-batch.
3. Skapa tydligare versionshistorik när första större funktionerna är på plats.
4. Göra en tidig teknisk skuld-analys efter några batcher.

## Underhåll av denna fil

Uppdatera denna fil när:

1. Ny större funktion implementeras.
2. Appens kärnflöde ändras.
3. Teknisk grund ändras.
4. Releasehistoriken får större ny post.
5. Backlog eller roadmap ändrar riktning.
