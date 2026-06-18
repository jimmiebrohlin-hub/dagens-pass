import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Dumbbell } from "lucide-react";
import { exerciseDose, getExercise } from "@/lib/exercises";
import { APP_NAME } from "@/lib/version";

function muscleLabel(group: string) {
  if (group === "lower") return "Ben/rumpa";
  if (group === "upper") return "Överkropp";
  return "Core/rygg";
}

export const Route = createFileRoute("/exercise/$exerciseId")({
  head: ({ params }) => {
    const exercise = getExercise(params.exerciseId);
    return { meta: [{ title: `${exercise?.name ?? "Övning"} — ${APP_NAME}` }] };
  },
  component: ExerciseDetailPage,
});

function ExerciseDetailPage() {
  const { exerciseId } = Route.useParams();
  const exercise = getExercise(exerciseId);

  if (!exercise) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-md px-5 pb-16 pt-8">
          <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="mt-10 rounded-3xl bg-card p-8 text-center ring-1 ring-border/60">
            <h1 className="text-2xl font-semibold tracking-tight">Övningen finns inte</h1>
            <p className="mt-2 text-sm text-muted-foreground">Gå tillbaka och välj en annan övning.</p>
            <Link to="/settings" className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-base font-medium text-primary-foreground">
              Till övningar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-5 pb-16 pt-8">
        <header className="mb-6 flex items-center justify-between">
          <Link to="/settings" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Övning</p>
          <div className="w-9" />
        </header>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15">
            <Dumbbell className="h-5 w-5 text-primary-foreground/80" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{exercise.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{muscleLabel(exercise.muscleGroup)}</p>
          </div>
        </div>

        <section className="mt-6 rounded-3xl bg-card p-6 ring-1 ring-border/60">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Standarddos</p>
          <p className="mt-2 text-5xl font-semibold tracking-tight">{exerciseDose(exercise)}</p>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">{exercise.instruction}</p>
        </section>

        <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
          <p className="text-sm font-medium">Varianter</p>
          <div className="mt-4 space-y-3">
            {exercise.easier && (
              <div className="rounded-2xl bg-secondary/60 p-4">
                <p className="text-sm font-medium">Lättare</p>
                <p className="mt-1 text-sm text-muted-foreground">{exercise.easier}</p>
              </div>
            )}
            {exercise.harder && (
              <div className="rounded-2xl bg-secondary/60 p-4">
                <p className="text-sm font-medium">Svårare</p>
                <p className="mt-1 text-sm text-muted-foreground">{exercise.harder}</p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
          <p className="text-sm font-medium">100 reps</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {exercise.hundredEligible ? "Den här övningen kan användas i 100 reps-läget." : "Den här övningen används inte i 100 reps-läget just nu."}
          </p>
        </section>
      </div>
    </div>
  );
}
