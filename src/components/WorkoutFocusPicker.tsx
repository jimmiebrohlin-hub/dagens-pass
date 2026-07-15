import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { WORKOUT_FOCUS_OPTIONS } from "@/lib/exercises";
import { intensityLabel, type WorkoutIntensity } from "@/lib/intensity";

type FocusWorkoutMode = "halvt" | "stort";

interface WorkoutFocusPickerProps {
  mode: FocusWorkoutMode;
  intensity: WorkoutIntensity;
}

export function WorkoutFocusPicker({ mode, intensity }: WorkoutFocusPickerProps) {
  const isLarge = mode === "stort";
  const title = isLarge ? "Stort blandpass" : "Litet blandpass";
  const exerciseCount = isLarge ? 20 : 10;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-8 pt-6">
        <header className="mb-5 flex items-center gap-3">
          <Link
            to="/"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-lg font-semibold tracking-tight">{title}</p>
            <p className="text-xs text-muted-foreground">
              Välj fokus · {intensityLabel(intensity)}
            </p>
          </div>
        </header>

        <section className="rounded-[2rem] bg-card p-5 ring-1 ring-border/60">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Vad vill du träna idag?
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Välj typ av pass</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {exerciseCount} övningar. Appen varvar muskelgrupper när det går.
          </p>
          <div className="mt-5 grid gap-2">
            {WORKOUT_FOCUS_OPTIONS.map((option) => (
              <Link
                key={option.id}
                to="/workout"
                search={{ mode, focus: option.id }}
                className="rounded-2xl bg-secondary px-4 py-3 text-left ring-1 ring-border/40 active:scale-[0.99]"
              >
                <span className="block text-base font-medium">{option.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {option.description}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
