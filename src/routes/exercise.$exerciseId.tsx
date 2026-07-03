import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowLeft, ArrowUp, Dumbbell, Play } from "lucide-react";
import { exerciseDose, getExercise, intensityLabel } from "@/lib/exercises";
import { useAppState, type WorkoutIntensity } from "@/lib/storage";
import { APP_NAME } from "@/lib/version";

const INTENSITIES: WorkoutIntensity[] = ["enkel", "normal", "tuff"];
const EXERCISE_IMAGES: Record<string, string> = {
  armhavningar: "/exercises/armhavningar.png",
  bankdips: "/exercises/bankdips.png",
  benlyft: "/exercises/benlyft.png",
  bird_dog: "/exercises/bird_dog.png",
  dead_bug: "/exercises/dead_bug.png",
  hollow_hold: "/exercises/hollow_hold.png",
  hoftlyft: "/exercises/hoftlyft.png",
  jagarvila: "/exercises/jagarvila.png",
  knaboj: "/exercises/knaboj.png",
  mountain_climbers: "/exercises/mountain_climbers.png",
  planka: "/exercises/planka.png",
  russian_twist: "/exercises/russian_twist.png",
  rygglyft: "/exercises/rygglyft.png",
  sidoplanka: "/exercises/sidoplanka.png",
  situps: "/exercises/situps.png",
  spindelplanka: "/exercises/spindelplanka.png",
  stepup: "/exercises/stepup.png",
  tahavningar: "/exercises/tahavningar.png",
  utfall: "/exercises/utfall.png",
  vadpress: "/exercises/vadpress.png",
};

function muscleLabel(group: string) {
  if (group === "lower") return "Ben/rumpa";
  if (group === "upper") return "Överkropp";
  return "Core/rygg";
}

function instructionSteps(instruction: string): string[] {
  return instruction
    .split(/\.\s+/)
    .map((part) => part.trim().replace(/\.$/, ""))
    .filter(Boolean);
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
  const [state] = useAppState();
  const exercise = getExercise(exerciseId);

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    }
  }

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

  const imageSrc = EXERCISE_IMAGES[exercise.id];
  const steps = instructionSteps(exercise.instruction);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-5 pb-16 pt-8">
        <header className="mb-6 flex items-center justify-between">
          <button onClick={goBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary" aria-label="Tillbaka">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Övning</p>
          <Link to="/settings" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
            Alla
          </Link>
        </header>

        <section className="rounded-3xl bg-card p-5 ring-1 ring-border/60">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <Dumbbell className="h-5 w-5 text-primary-foreground/80" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{exercise.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{muscleLabel(exercise.muscleGroup)}</p>
            </div>
          </div>

          {imageSrc && (
            <div className="mt-5 flex h-56 items-center justify-center overflow-hidden rounded-[1.75rem] bg-secondary/45 p-3 ring-1 ring-border/40">
              <img src={imageSrc} alt={exercise.name} className="h-full w-full rounded-[1.25rem] object-contain" loading="lazy" />
            </div>
          )}
        </section>

        <section className="mt-4 rounded-3xl bg-card p-6 ring-1 ring-border/60">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Så gör du</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight">{exerciseDose(exercise, state.intensity)}</p>
              <p className="mt-1 text-sm text-muted-foreground">Nivå: {intensityLabel(state.intensity)}</p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <Play className="h-5 w-5 text-primary" />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {steps.length > 0 ? (
              steps.map((step, index) => (
                <div key={step} className="flex gap-3 rounded-2xl bg-secondary/60 p-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">{index + 1}</span>
                  <p className="text-[15px] leading-relaxed text-muted-foreground">{step}.</p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-secondary/60 p-4 text-[15px] leading-relaxed text-muted-foreground">{exercise.instruction}</p>
            )}
          </div>
        </section>

        <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
          <p className="text-sm font-medium">Dos per nivå</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {INTENSITIES.map((intensity) => (
              <div key={intensity} className={`rounded-2xl p-3 ${state.intensity === intensity ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                <p className="text-xs font-medium">{intensityLabel(intensity)}</p>
                <p className={`mt-1 text-xs ${state.intensity === intensity ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{exerciseDose(exercise, intensity)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
          <p className="text-sm font-medium">Varianter</p>
          <div className="mt-4 grid gap-3">
            {exercise.easier && (
              <div className="rounded-2xl bg-secondary/60 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <ArrowDown className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-semibold">Lättare</p>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{exercise.easier}</p>
              </div>
            )}
            {exercise.harder && (
              <div className="rounded-2xl bg-secondary/60 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <ArrowUp className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-semibold">Svårare</p>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{exercise.harder}</p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
          <p className="text-sm font-medium">100 reps</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {exercise.hundredEligible ? "Kan användas i 100 reps-läget." : "Används inte i 100 reps-läget just nu."}
          </p>
        </section>
      </div>
    </div>
  );
}
