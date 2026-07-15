import { Check, SkipForward } from "lucide-react";

interface WorkoutActionBarProps {
  restDuration: number;
  onComplete: () => void;
  onSkip: () => void;
}

export function WorkoutActionBar({ restDuration, onComplete, onSkip }: WorkoutActionBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-md rounded-[1.5rem] bg-card/95 p-3 shadow-[0_-8px_30px_rgba(20,32,22,0.12)] ring-1 ring-border/70 backdrop-blur">
        <button
          onClick={onComplete}
          className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-primary px-4 text-primary-foreground shadow-sm active:scale-[0.99]"
        >
          <Check className="h-5 w-5" />
          <span className="text-left">
            <span className="block text-lg font-semibold">Klar</span>
            <span className="block text-xs opacity-80">Vila {restDuration} sek efteråt</span>
          </span>
        </button>
        <button
          onClick={onSkip}
          className="mt-1 inline-flex h-9 w-full items-center justify-center gap-2 text-sm text-muted-foreground"
        >
          <SkipForward className="h-4 w-4" /> Hoppa över övningen
        </button>
      </div>
    </div>
  );
}
