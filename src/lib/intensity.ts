export type WorkoutIntensity = "enkel" | "normal" | "tuff";

export const DEFAULT_INTENSITY: WorkoutIntensity = "normal";

export const INTENSITY_OPTIONS: Array<{
  id: WorkoutIntensity;
  label: string;
  hint: string;
}> = [
  { id: "enkel", label: "Enkel", hint: "Ca 25% lättare" },
  { id: "normal", label: "Normal", hint: "Standardnivå" },
  { id: "tuff", label: "Tuff", hint: "Ca 25% mer" },
];

export function normalizeIntensity(value: unknown): WorkoutIntensity {
  return value === "enkel" || value === "tuff" || value === "normal" ? value : DEFAULT_INTENSITY;
}

export function intensityLabel(intensity: WorkoutIntensity): string {
  if (intensity === "enkel") return "Enkel";
  if (intensity === "tuff") return "Tuff";
  return "Normal";
}
