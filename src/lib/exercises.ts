import type { WorkoutIntensity } from "./intensity";
export { intensityLabel } from "./intensity";

export type ExerciseKind = "reps" | "time" | "side";
export type MuscleGroup = "lower" | "upper" | "core";
export type WorkoutFocus = "mix" | "lower" | "upper" | "core" | "gentle";

export interface Exercise {
  id: string;
  name: string;
  kind: ExerciseKind;
  muscleGroup: MuscleGroup;
  sets: number;
  reps?: number;
  seconds?: number;
  instruction: string;
  easier?: string;
  harder?: string;
  hundredEligible: boolean;
}

export interface PickOptions {
  favoriteIds?: string[];
  blockedIds?: string[];
}

export interface WorkoutFocusOption {
  id: WorkoutFocus;
  label: string;
  description: string;
}

export const WORKOUT_FOCUS_OPTIONS: WorkoutFocusOption[] = [
  { id: "mix", label: "Mix", description: "Ben, överkropp och core i jämn blandning." },
  { id: "lower", label: "Ben & rumpa", description: "Mest underkropp, varvat med core/överkropp." },
  { id: "upper", label: "Armar & överkropp", description: "Mer press, axlar och armar, men inte samma muskel i rad." },
  { id: "core", label: "Mage & rygg", description: "Core, rygg och stabilitet med pauser för andra muskler." },
  { id: "gentle", label: "Skonsamt", description: "Lugnare övningar och mindre hopp/handledstryck." },
];

export function workoutFocusLabel(focus: WorkoutFocus = "mix") {
  return WORKOUT_FOCUS_OPTIONS.find((option) => option.id === focus)?.label ?? "Mix";
}

export const EXERCISES: Exercise[] = [
  { id: "knaboj", name: "Knäböj", kind: "reps", muscleGroup: "lower", sets: 3, reps: 12, instruction: "Stå höftbrett. Sänk höften bakåt som mot en stol och håll knäna i linje med tårna.", easier: "Gör rörelsen mot en stol och vänd när du nuddar sitsen.", harder: "Gör långsammare tempo eller lägg till ett litet skutt.", hundredEligible: true },
  { id: "utfall", name: "Utfall", kind: "side", muscleGroup: "lower", sets: 3, reps: 10, instruction: "Kliv fram, sänk bakre knät mot golvet och tryck dig kontrollerat upp igen.", easier: "Gör kortare steg eller håll i en vägg/stol för balans.", harder: "Gör långsamma repetitioner eller växla ben utan paus.", hundredEligible: true },
  { id: "stepup", name: "Step-up", kind: "side", muscleGroup: "lower", sets: 3, reps: 10, instruction: "Kliv upp på en stabil stol eller pall. Tryck genom hela foten och växla ben.", easier: "Använd en lägre höjd.", harder: "Sänk långsamt tillbaka foten till golvet.", hundredEligible: true },
  { id: "hoftlyft", name: "Höftlyft", kind: "reps", muscleGroup: "lower", sets: 3, reps: 15, instruction: "Ligg på rygg med fötterna i golvet. Lyft höften högt och spänn rumpan på toppen.", easier: "Gör färre reps och vila längre mellan set.", harder: "Gör enbens-höftlyft.", hundredEligible: true },
  { id: "jagarvila", name: "Jägarvila", kind: "time", muscleGroup: "lower", sets: 3, seconds: 30, instruction: "Sitt mot vägg med ryggen rak och knäna nära 90 grader. Håll positionen.", easier: "Sitt lite högre upp på väggen.", harder: "Öka tiden eller håll armarna framåt.", hundredEligible: false },
  { id: "vadpress", name: "Vadpress", kind: "reps", muscleGroup: "lower", sets: 3, reps: 16, instruction: "Stå höftbrett. Lyft hälarna lugnt upp och sänk kontrollerat tillbaka.", easier: "Håll i en vägg eller stol för balans.", harder: "Pausa en sekund högst upp eller gör en sida i taget.", hundredEligible: true },
  { id: "armhavningar", name: "Armhävningar", kind: "reps", muscleGroup: "upper", sets: 3, reps: 10, instruction: "Håll kroppen rak. Sänk bröstet kontrollerat mot golvet och pressa upp igen.", easier: "Gör armhävningar mot knä eller mot ett bord.", harder: "Gör långsammare tempo eller pausa i botten.", hundredEligible: true },
  { id: "vaggarmhavningar", name: "Väggarmhävningar", kind: "reps", muscleGroup: "upper", sets: 3, reps: 14, instruction: "Stå mot en vägg. Placera händerna i brösthöjd, sänk dig kontrollerat mot väggen och pressa tillbaka.", easier: "Stå närmare väggen.", harder: "Stå längre från väggen eller använd ett bord i stället.", hundredEligible: true },
  { id: "bankdips", name: "Bänkdips", kind: "reps", muscleGroup: "upper", sets: 3, reps: 10, instruction: "Ha händerna på en stol bakom dig. Sänk höften genom att böja armarna och pressa upp igen.", easier: "Ha fötterna närmare kroppen.", harder: "Sträck benen längre bort från kroppen.", hundredEligible: true },
  { id: "axelpress", name: "Axelpress", kind: "reps", muscleGroup: "upper", sets: 3, reps: 12, instruction: "Stå eller sitt med händerna vid axlarna. Pressa armarna upp över huvudet och sänk kontrollerat.", easier: "Gör utan vikt och lugnt tempo.", harder: "Håll vattenflaskor eller pausa högst upp.", hundredEligible: true },
  { id: "handduksrodd", name: "Handduksrodd", kind: "reps", muscleGroup: "upper", sets: 3, reps: 12, instruction: "Håll en handduk framför dig med lätt drag. Dra armbågarna bakåt som en rodd och pressa skulderbladen ihop.", easier: "Gör rörelsen mindre och lugnare.", harder: "Håll drag i handduken hela vägen.", hundredEligible: true },
  { id: "skulderbladspress", name: "Skulderbladspress", kind: "reps", muscleGroup: "upper", sets: 3, reps: 12, instruction: "Stå i plankliknande position mot vägg eller bord. Pressa skulderbladen isär och låt dem gå ihop igen utan att böja armarna.", easier: "Gör mot vägg.", harder: "Gör mot bord eller i armhävningsposition.", hundredEligible: true },
  { id: "rygglyft", name: "Rygglyft", kind: "reps", muscleGroup: "core", sets: 3, reps: 12, instruction: "Ligg på mage. Lyft bröst och armar lätt från golvet och sänk kontrollerat.", easier: "Lyft bara bröstet lite grann.", harder: "Håll toppen i två sekunder.", hundredEligible: true },
  { id: "planka", name: "Planka", kind: "time", muscleGroup: "core", sets: 3, seconds: 30, instruction: "Stå på underarmarna. Håll kroppen rak från huvud till häl och spänn magen.", easier: "Sätt knäna i golvet.", harder: "Öka tiden eller lyft en fot lätt från golvet.", hundredEligible: false },
  { id: "situps", name: "Sit-ups", kind: "reps", muscleGroup: "core", sets: 3, reps: 15, instruction: "Ligg på rygg med böjda knän. Kom upp kontrollerat utan att rycka i nacken.", easier: "Gör crunches med kortare rörelse.", harder: "Sänk dig långsamt tillbaka.", hundredEligible: true },
  { id: "benlyft", name: "Benlyft", kind: "reps", muscleGroup: "core", sets: 3, reps: 12, instruction: "Ligg på rygg. Lyft benen mot taket och sänk långsamt utan att tappa svanken.", easier: "Böj knäna lite och gör kortare rörelse.", harder: "Sänk benen långsammare.", hundredEligible: true },
  { id: "spindelplanka", name: "Spindelmannen-planka", kind: "side", muscleGroup: "core", sets: 3, reps: 10, instruction: "Från planka. Dra knä mot armbåge växelvis och håll kroppen stabil.", easier: "Gör rörelsen långsamt med knäna i golvet mellan reps.", harder: "Håll högt tempo utan att tappa kontrollen.", hundredEligible: false },
  { id: "dead_bug", name: "Dead bug", kind: "side", muscleGroup: "core", sets: 3, reps: 10, instruction: "Ligg på rygg med armar och ben upp. Sänk motsatt arm och ben långsamt och kom tillbaka.", easier: "Sänk bara ett ben i taget.", harder: "Sänk långsammare och håll svanken stilla.", hundredEligible: true },
  { id: "bird_dog", name: "Bird dog", kind: "side", muscleGroup: "core", sets: 3, reps: 10, instruction: "Stå på alla fyra. Sträck motsatt arm och ben, håll kort och byt sida.", easier: "Sträck bara ben eller bara arm.", harder: "Pausa två sekunder i ytterläget.", hundredEligible: true },
];

export const getExercise = (id: string) => EXERCISES.find((e) => e.id === id);

function seededNumber(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

function applyPreferences(items: Exercise[], options: PickOptions = {}): Exercise[] {
  const blocked = new Set(options.blockedIds ?? []);
  const favorites = new Set(options.favoriteIds ?? []);
  const available = items.filter((item) => !blocked.has(item.id));
  const pool = available.length ? available : items;
  return [...pool].sort((a, b) => Number(favorites.has(b.id)) - Number(favorites.has(a.id)) || a.name.localeCompare(b.name));
}

function takeSeeded(items: Exercise[], seed: string, pickedIds: string[] = [], options: PickOptions = {}): Exercise | undefined {
  const alreadyPicked = new Set(pickedIds);
  const preferred = applyPreferences(items, options).filter((item) => !alreadyPicked.has(item.id));
  const fallback = items.filter((item) => !alreadyPicked.has(item.id));
  const pool = preferred.length ? preferred : fallback;
  if (!pool.length) return undefined;
  const idx = seededNumber(`${seed}:${pool.map((p) => p.id).join("|")}`) % pool.length;
  return pool[idx];
}

export function pickDailyThree(seed: string, options: PickOptions = {}): Exercise[] {
  const groups: MuscleGroup[] = ["lower", "upper", "core"];
  const picked: Exercise[] = [];
  for (const group of groups) {
    const exercise = takeSeeded(
      EXERCISES.filter((e) => e.muscleGroup === group),
      `${seed}:daily:${group}`,
      picked.map((e) => e.id),
      options,
    );
    if (exercise) picked.push(exercise);
  }
  return picked;
}

function focusPattern(focus: WorkoutFocus): MuscleGroup[] {
  if (focus === "lower") return ["lower", "core", "lower", "upper", "lower", "core"];
  if (focus === "upper") return ["upper", "core", "upper", "lower", "upper", "core"];
  if (focus === "core") return ["core", "lower", "core", "upper", "core", "lower"];
  return ["lower", "upper", "core"];
}

function allowedForFocus(focus: WorkoutFocus) {
  if (focus !== "gentle") return EXERCISES;
  const gentleIds = new Set(["vaggarmhavningar", "axelpress", "handduksrodd", "skulderbladspress", "hoftlyft", "vadpress", "knaboj", "dead_bug", "bird_dog", "rygglyft", "planka"]);
  return EXERCISES.filter((exercise) => gentleIds.has(exercise.id));
}

function takeForGroup(seed: string, group: MuscleGroup, picked: Exercise[], options: PickOptions, allowed: Exercise[]) {
  const pickedIds = picked.map((item) => item.id);
  const previousGroup = picked[picked.length - 1]?.muscleGroup;
  const groupPool = allowed.filter((item) => item.muscleGroup === group);
  const preferred = takeSeeded(groupPool, `${seed}:${picked.length}:${group}`, pickedIds, options);
  if (preferred && preferred.muscleGroup !== previousGroup) return preferred;

  if (group !== previousGroup) {
    const repeatedPreferred = takeSeeded(groupPool, `${seed}:${picked.length}:${group}:repeat`, [], options);
    if (repeatedPreferred) return repeatedPreferred;
  }

  const alternatingPool = allowed.filter((item) => item.muscleGroup !== previousGroup);
  const alternating = takeSeeded(alternatingPool, `${seed}:${picked.length}:alternate`, pickedIds, options);
  if (alternating) return alternating;

  const repeatedAlternating = takeSeeded(alternatingPool, `${seed}:${picked.length}:repeat-alternate`, [], options);
  if (repeatedAlternating) return repeatedAlternating;

  return preferred ?? takeSeeded(allowed, `${seed}:${picked.length}:any`, pickedIds, options) ?? takeSeeded(allowed, `${seed}:${picked.length}:repeat`, [], options);
}

function pickProgram(seed: string, count: number, focus: WorkoutFocus = "mix", options: PickOptions = {}): Exercise[] {
  const pattern = focusPattern(focus);
  const allowed = allowedForFocus(focus);
  const picked: Exercise[] = [];

  for (let i = 0; i < count; i++) {
    const group = pattern[i % pattern.length];
    const exercise = takeForGroup(`${seed}:${focus}`, group, picked, options, allowed);
    if (!exercise) break;
    picked.push({ ...exercise, sets: 2 });
  }

  return picked;
}

export function pickSmall(seed: string, options: PickOptions = {}, focus: WorkoutFocus = "mix"): Exercise[] {
  return pickProgram(seed, 10, focus, options);
}

export function pickLarge(seed: string, options: PickOptions = {}, focus: WorkoutFocus = "mix"): Exercise[] {
  return pickProgram(seed, 20, focus, options);
}

export function pickHalf(seed: string, options: PickOptions = {}, focus: WorkoutFocus = "mix"): Exercise[] {
  return pickSmall(seed, options, focus);
}

export function applyIntensity(exercise: Exercise, intensity: WorkoutIntensity = "normal"): Exercise {
  if (intensity === "normal") return exercise;
  const factor = intensity === "enkel" ? 0.75 : 1.25;
  return {
    ...exercise,
    reps: exercise.reps ? Math.max(4, Math.round(exercise.reps * factor)) : exercise.reps,
    seconds: exercise.seconds ? Math.max(15, Math.round((exercise.seconds * factor) / 5) * 5) : exercise.seconds,
  };
}

export function exerciseDose(exercise: Exercise, intensity: WorkoutIntensity = "normal"): string {
  const adjusted = applyIntensity(exercise, intensity);
  if (adjusted.kind === "time") return `${adjusted.sets} × ${adjusted.seconds} sek`;
  if (adjusted.kind === "side") return `${adjusted.sets} × ${adjusted.reps} per sida`;
  return `${adjusted.sets} × ${adjusted.reps}`;
}

export function exerciseSetDose(exercise: Exercise, intensity: WorkoutIntensity = "normal"): string {
  const adjusted = applyIntensity(exercise, intensity);
  if (adjusted.kind === "time") return `${adjusted.seconds} sek`;
  if (adjusted.kind === "side") return `${adjusted.reps} per sida`;
  return `${adjusted.reps} reps`;
}
