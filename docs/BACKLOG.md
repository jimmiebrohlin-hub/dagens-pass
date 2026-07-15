# Vardagsstyrka backlog

## Aktiv backlog

| Prio | Område | Backlog item | Storlek | Status/beroende |
|---:|---|---|:---:|---|
| 1 | Streak-mejl | Skapa Gmail-kontot `vardagsstyrka.noreply@gmail.com` och aktivera tvåstegsverifiering | S | Väntar på användaren |
| 2 | Streak-mejl | Skapa ett Google App Password för Gmail-kontot | S | Kräver tvåstegsverifiering |
| 3 | Streak-mejl | Lägg in Lovable/Supabase-secrets `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM` och `APP_URL` | S | Väntar på Lovable-credits 1 aug |
| 4 | Streak-mejl | Deploya `notify-streak-turn` Edge Function med Gmail SMTP-versionen | S | Väntar på Lovable-credits 1 aug |
| 5 | Streak-mejl | Verifiera att migrationen för `streak_turn_email_notifications` är körd | XS | Väntar på Lovable-credits 1 aug |
| 6 | Streak-mejl | End-to-end-test med två Google-konton: exakt ett mejl per bollöverlämning | M | Efter deploy/secrets |
| 7 | Streak-mejl | Lägg till användarinställning för att slå av/på mejlnotiser | M | Efter fungerande basflöde |
| 8 | Streak | Visa kvarvarande tid av 36 timmar tydligare i UI | M | Ej startad |
| 9 | Träning | Lägg fokusval även på Stort blandpass | S | Ej startad |
| 10 | Träning | Lägg bilder till nya överkroppsövningar | M | Ej startad |
| 11 | Kvalitet | Lägg automatiska tester för programurval och muskelgruppsalternering | M | Ej startad |
| 12 | Kvalitet | Lägg integrationstest för streak-RPC och mejldubblettskydd | L | Ej startad |

## Gmail SMTP – secrets som ska läggas in

```text
SMTP_USER=vardagsstyrka.noreply@gmail.com
SMTP_PASSWORD=<16-teckens Google App Password, utan mellanslag>
EMAIL_FROM=Vardagsstyrka <vardagsstyrka.noreply@gmail.com>
APP_URL=https://vardagsstyrka.lovable.app/streak
```

Använd aldrig det vanliga Gmail-lösenordet. `SMTP_PASSWORD` ska vara ett separat Google App Password.

## Billig Lovable-prompt för 1 augusti

> Slutför Gmail-mejl för streak i `jimmiebrohlin-hub/dagens-pass` utan andra ändringar. Kör migrationen för `streak_turn_email_notifications`, deploya `supabase/functions/notify-streak-turn/index.ts`, och lägg in secrets som användaren lämnar: `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`, `APP_URL`. Verifiera JWT. Testa med två Google-konton att första Dagens 3 flyttar bollen och skickar exakt ett mejl till mottagaren; extra Dagens 3, Min streak och öppna inbjudningar ska inte skicka mejl. Rör inte övrig tränings- eller streaklogik.
