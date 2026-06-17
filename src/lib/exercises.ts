export type ExerciseKind = "reps" | "time" | "side";

export interface Exercise {
  id: string;
  name: string;
  kind: ExerciseKind;
  sets: number;
  reps?: number;
  seconds?: number;
  instruction: string;
  hundredEligible: boolean;
}

export const EXERCISES: Exercise[] = [
  { id: "knaboj", name: "Knäböj", kind: "reps", sets: 3, reps: 12, instruction: "Stå höftbrett, sänk höften bakåt och håll knäna över tårna.", hundredEligible: true },
  { id: "utfall", name: "Utfall", kind: "side", sets: 3, reps: 10, instruction: "Kliv fram, sänk bakre knät mot golvet. 10 per ben.", hundredEligible: true },
  { id: "stepup", name: "Step-up", kind: "side", sets: 3, reps: 10, instruction: "Kliv upp på en stol eller pall, växla ben. 10 per ben.", hundredEligible: true },
  { id: "hoftlyft", name: "Höftlyft", kind: "reps", sets: 3, reps: 15, instruction: "Ligg på rygg, fötter i golvet, lyft höften högt och kläm rumpan.", hundredEligible: true },
  { id: "jagarvila", name: "Jägarvila", kind: "time", sets: 3, seconds: 30, instruction: "Sitt mot vägg med 90 graders knävinkel. Håll positionen.", hundredEligible: false },
  { id: "armhavningar", name: "Armhävningar", kind: "reps", sets: 3, reps: 10, instruction: "Raka armar, kroppen rak. Sänk bröstet mot golvet.", hundredEligible: true },
  { id: "bankdips", name: "Bänkdips", kind: "reps", sets: 3, reps: 10, instruction: "Händer på stol bakom dig, sänk höften mot golvet med böjda armar.", hundredEligible: true },
  { id: "rygglyft", name: "Rygglyft", kind: "reps", sets: 3, reps: 12, instruction: "Ligg på mage, lyft bröst och armar svagt från golvet.", hundredEligible: true },
  { id: "planka", name: "Planka", kind: "time", sets: 3, seconds: 30, instruction: "Underarmarna i golvet, kroppen rak från huvud till häl.", hundredEligible: false },
  { id: "situps", name: "Sit-ups", kind: "reps", sets: 3, reps: 15, instruction: "Ligg på rygg, böjda knän, kom upp utan att rycka i nacken.", hundredEligible: true },
  { id: "benlyft", name: "Benlyft", kind: "reps", sets: 3, reps: 12, instruction: "Ligg på rygg, raka ben, lyft mot taket och sänk långsamt.", hundredEligible: true },
  { id: "spindelplanka", name: "Spindelmannen-planka", kind: "side", sets: 3, reps: 10, instruction: "Från planka, dra knä mot armbåge växelvis. 10 per sida.", hundredEligible: false },
];

export const getExercise = (id: string) => EXERCISES.find((e) => e.id === id);

export function pickDailyThree(seed: string): Exercise[] {
  // deterministic per seed (date)
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const pool = [...EXERCISES];
  const picked: Exercise[] = [];
  for (let i = 0; i < 3 && pool.length; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const idx = h % pool.length;
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

export function pickHalf(seed: string): Exercise[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 17 + seed.charCodeAt(i)) >>> 0;
  const pool = [...EXERCISES];
  const picked: Exercise[] = [];
  for (let i = 0; i < 5 && pool.length; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const idx = h % pool.length;
    const ex = pool.splice(idx, 1)[0];
    picked.push({ ...ex, sets: 2 });
  }
  return picked;
}