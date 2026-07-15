# Vardagsstyrka backlog

## Aktiv backlog

| Prio | Område | Backlog item | Storlek | Status/beroende |
|---:|---|---|:---:|---|
| 1 | Streak-mejl | Byt till ett nytt app-lösenord innan produktionssättning | XS | Säkerhetssteg före drift |
| 2 | Streak-mejl | Lägg in Lovable/Supabase-secrets för Gmail SMTP och app-URL | S | Väntar på Lovable-credits 1 aug |
| 3 | Streak-mejl | Kör migrationerna för mejlaudit och `user_notification_preferences` | XS | Väntar på Lovable-credits 1 aug |
| 4 | Streak-mejl | Deploya `notify-streak-turn` Edge Function med Gmail SMTP-versionen | S | Väntar på Lovable-credits 1 aug |
| 5 | Streak-mejl | End-to-end-test med två Google-konton: exakt ett mejl per bollöverlämning samt av/på-inställning | M | Efter deploy/secrets |
| 6 | Streak-mejl | Kontrollera att Gmail SMTP fungerar från Supabase Edge Functions; byt annars till Gmail API över HTTPS | M | Teknisk risk efter deploy |
| 7 | Kvalitet | Lägg automatiska tester för programurval och muskelgruppsalternering | M | Ej startad |
| 8 | Kvalitet | Lägg regressionstest för 100 challenge-progression och återställning av aktiva pass | M | Efter 0.7.66 |
| 9 | Kvalitet | Lägg integrationstest för streak-RPC, 36h-logik och mejldubblettskydd | L | Ej startad |
| 10 | UX | Verifiera 0.7.66 på riktig mobil: fast Klar-rad, teknik tillbaka, omladdning och liten skärmhöjd | S | Väntar på Lovable-build |
| 11 | UX | Lägg sökning/filter i den långa övningslistan i Inställningar | S | Ej startad |
| 12 | UI | Standardisera återstående övningsbilder till ett gemensamt bildspråk | M | Ej startad |

## Klart

| Område | Klart |
|---|---|
| Streak-mejl | Gmail-kontot `vardagsstyrka.noreply@gmail.com` är skapat |
| Streak-mejl | Tvåstegsverifiering är aktiverad |
| Streak-mejl | Google App Password har skapats som tekniskt test |
| Streak-mejl | Gmail SMTP-versionen av `notify-streak-turn` är förberedd i repot |
| Streak-mejl | Audit-/dubblettskydd för mejl är förberett i migration |
| Streak-mejl | Användarinställning för att slå av/på streakmejl är implementerad och Edge Function respekterar den |
| Streak | 36h kvar, sluttid och varningsnivå visas på startsidan och streaksidan |
| Träning | Coach Mode med en tydlig träningsvy och separat vilovy är implementerat |
| Träning | Enhetliga textfria illustrationer är tillagda för nya övningar |
| Träning | Samma fem fokusval används för både Litet blandpass och Stort blandpass |
| Träning | 100 challenge fryser genomförd plan och skiljer den från nästa progression |
| Träning | Pågående vanliga pass och 100 challenge återställs efter teknikvy eller omladdning |
| UX | Coach Mode scrollar till toppen vid fasbyte och har en fast Klar-rad |
| UX | Små språk- och affordancefel från videogenomgången är rättade |
| Build | `package-lock.json` är synkad med Lovable-konfiguration 2.7.1 och verifierad med ren `npm ci` + produktionsbuild |
| Build | 0.7.64 är bekräftad byggd i Lovable |
| Build | 0.7.65 är verifierad i Lovable-preview via videogenomgång |

## Konfiguration som ska läggas in 1 augusti

```text
SMTP_USER=vardagsstyrka.noreply@gmail.com
SMTP_PASSWORD=<nytt Google App Password>
EMAIL_FROM=Vardagsstyrka <vardagsstyrka.noreply@gmail.com>
APP_URL=https://vardagsstyrka.lovable.app/streak
```

Använd aldrig det vanliga Gmail-lösenordet. `SMTP_PASSWORD` ska vara ett separat Google App Password.

## Billig Lovable-prompt för 1 augusti

> Slutför Gmail-mejl för streak i `jimmiebrohlin-hub/dagens-pass` utan andra ändringar. Kör migrationerna för `streak_turn_email_notifications` och `20260715161000_user_notification_preferences.sql`, deploya `supabase/functions/notify-streak-turn/index.ts`, och lägg in secrets som användaren lämnar: `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`, `APP_URL`. Verifiera JWT. Testa med två Google-konton att första Dagens 3 flyttar bollen och skickar exakt ett mejl till mottagaren; extra Dagens 3, Min streak och öppna inbjudningar ska inte skicka mejl. Kontrollera även att mottagaren kan slå av mejlet på Kontosidan och då inte får något mejl. Rör inte övrig tränings- eller streaklogik. Om utgående SMTP blockeras från Edge Function, byt endast transporten till Gmail API över HTTPS och behåll samma validering, inställning, audit och dubblettskydd.
