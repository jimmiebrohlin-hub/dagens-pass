# Supabase setup för Vardagsstyrka

Den här checklistan behövs för konto, molnsparning och Streak tillsammans.

## 1. Skapa eller koppla Supabase-projekt

Koppla projektet till Lovable/Supabase eller skapa ett Supabase-projekt manuellt.

## 2. Lägg in miljövariabler i Lovable

Lägg till dessa som frontend/Vite-variabler:

```text
VITE_SUPABASE_URL=<project-url>
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Efter detta ska Konto-sidan inte längre visa `Supabase saknas`.

## 3. Kör migrations

Kör SQL-filerna i ordning:

```text
supabase/migrations/20260703190000_initial_personal_data.sql
supabase/migrations/20260703200000_shared_streaks.sql
```

De skapar tabeller för:

- profiler och användarinställningar
- övningspreferenser
- 100 challenge-progress
- passhistorik
- shared streaks, medlemmar och aktivitet

## 4. Aktivera Google-login

I Supabase Auth:

1. Aktivera Google provider.
2. Skapa OAuth Client i Google Cloud.
3. Lägg in Google Client ID och Secret i Supabase.
4. Lägg in callback/redirect enligt Supabase instruktion.

Vanliga redirect-URL:er att lägga till:

```text
https://vardagsstyrka.lovable.app
http://localhost:5173
```

Lägg även till aktuell Lovable preview-URL om den skiljer sig.

## 5. Testordning

1. Öppna `/account`.
2. Kontrollera att Supabase är konfigurerat.
3. Logga in med Google.
4. Testa manuell molnsynk.
5. Öppna `/streak`.
6. Skapa streak.
7. Kontrollera att streak-siffra, bollen och inbjudningskod visas.

## 6. Kända begränsningar just nu

- Streak kan skapas, men annan användare kan ännu inte gå med via kod.
- Dagens 3 flyttar ännu inte bollen automatiskt.
- Molnsynk är fortfarande manuell från Konto-sidan.
