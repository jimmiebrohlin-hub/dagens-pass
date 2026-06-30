import type { WorkoutIntensity } from "./intensity";
export { intensityLabel } from "./intensity";

export type ExerciseKind = "reps" | "time" | "side";
export type MuscleGroup = "lower" | "upper" | "core";

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

export const EXERCISES: Exercise[] = [
  { id: "knaboj", name: "Knäböj", kind: "reps", muscleGroup: "lower", sets: 3, reps: 12, instruction: "Stå höftbrett. Sänk höften bakåt som mot en stol och håll knäna i linje med tårna.", easier: "Gör rörelsen mot en stol och vänd när du nuddar sitsen.", harder: "Gör långsammare tempo eller lägg till ett litet skutt.", hundredEligible: true },
  { id: "utfall", name: "Utfall", kind: "side", muscleGroup: "lower", sets: 3, reps: 10, instruction: "Kliv fram, sänk bakre knät mot golvet och tryck dig kontrollerat upp igen.", easier: "Gör kortare steg eller håll i en vägg/stol för balans.", harder: "Gör långsamma repetitioner eller växla ben utan paus.", hundredEligible: true },
  { id: "stepup", name: "Step-up", kind: "side", muscleGroup: "lower", sets: 3, reps: 10, instruction: "Kliv upp på en stabil stol eller pall. Tryck genom hela foten och växla ben.", easier: "Använd en lägre höjd.", harder: "Sänk långsamt tillbaka foten till golvet.", hundredEligible: true },
  { id: "hoftlyft", name: "Höftlyft", kind: "reps", muscleGroup: "lower", sets: 3, reps: 15, instruction: "Ligg på rygg med fötterna i golvet. Lyft höften högt och spänn rumpan på toppen.", easier: "Gör färre reps och vila längre mellan set.", harder: "Gör enbens-höftlyft.", hundredEligible: true },
  { id: "jagarvila", name: "Jägarvila", kind: "time", muscleGroup: "lower", sets: 3, seconds: 30, instruction: "Sitt mot vägg med ryggen rak och knäna nära 90 grader. Håll positionen.", easier: "Sitt lite högre upp på väggen.", harder: "Öka tiden eller håll armarna framåt.", hundredEligible: false },
  { id: "armhavningar", name: "Armhävningar", kind: "reps", muscleGroup: "upper", sets: 3, reps: 10, instruction: "Håll kroppen rak. Sänk bröstet kontrollerat mot golvet och pressa upp igen.", easier: "Gör armhävningar mot knä eller mot ett bord.", harder: "Gör långsammare tempo eller pausa i botten.", hundredEligible: true },
  { id: "bankdips", name: "Bänkdips", kind: "reps", muscleGroup: "upper", sets: 3, reps: 10, instruction: "Ha händerna på en stol bakom dig. Sänk höften genom att böja armarna och pressa upp igen.", easier: "Ha fötterna närmare kroppen.", harder: "Sträck benen längre bort från kroppen.", hundredEligible: true },
  { id: "rygglyft", name: "Rygglyft", kind: "reps", muscleGroup: "core", sets: 3, reps: 12, instruction: "Ligg på mage. Lyft bröst och armar lätt från golvet och sänk kontrollerat.", easier: "Lyft bara bröstet lite grann.", harder: "Håll toppen i två sekunder.", hundredEligible: true },
  { id: "planka", name: "Planka", kind: "time", muscleGroup: "core", sets: 3, seconds: 30, instruction: "Stå på underarmarna. Håll kroppen rak från huvud till häl och spänn magen.", easier: "Sätt knäna i golvet.", harder: "Öka tiden eller lyft en fot lätt från golvet.", hundredEligible: false },
  { id: "situps", name: "Sit-ups", kind: "reps", muscleGroup: "core", sets: 3, reps: 15, instruction: "Ligg på rygg med böjda knän. Kom upp kontrollerat utan att rycka i nacken.", easier: "Gör crunches med kortare rörelse.", harder: "Sänk dig långsamt tillbaka.", hundredEligible: true },
  { id: "benlyft", name: "Benlyft", kind: "reps", muscleGroup: "core", sets: 3, reps: 12, instruction: "Ligg på rygg. Lyft benen mot taket och sänk långsamt utan att tappa svanken.", easier: "Böj knäna lite och gör kortare rörelse.", harder: "Sänk benen långsammare.", hundredEligible: true },
  { id: "spindelplanka", name: "Spindelmannen-planka", kind: "side", muscleGroup: "core", sets: 3, reps: 10, instruction: "Från planka. Dra knä mot armbåge växelvis och håll kroppen stabil.", easier: "Gör rörelsen långsamt med knäna i golvet mellan reps.", harder: "Håll högt tempo utan att tappa kontrollen.", hundredEligible: false },
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

export function pickHalf(seed: string, options: PickOptions = {}): Exercise[] {
  const lower = EXERCISES.filter((e) => e.muscleGroup === "lower");
  const upper = EXERCISES.filter((e) => e.muscleGroup === "upper");
  const core = EXERCISES.filter((e) => e.muscleGroup === "core");
  const picked: Exercise[] = [];
  const plan: Array<[Exercise[], string]> = [[lower, "lower-1"], [upper, "upper-1"], [core, "core-1"], [lower, "lower-2"], [core, "core-2"]];
  for (const [pool, suffix] of plan) {
    const exercise = takeSeeded(pool, `${seed}:half:${suffix}`, picked.map((e) => e.id), options);
    if (exercise) picked.push({ ...exercise, sets: 2 });
  }
  return picked;
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
