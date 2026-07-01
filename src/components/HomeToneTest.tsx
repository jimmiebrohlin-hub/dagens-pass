import * as cue from "@/lib/sound";

export function HomeToneTest({ settings }: { settings: cue.SoundSettings }) {
  async function run() {
    await cue.unlockTimerSound();
    await cue.playTimerDoneCue(settings);
  }

  return (
    <section className="mb-4 rounded-2xl bg-card p-4 ring-1 ring-border/60">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Signaltest</p>
        <button onClick={() => void run()} className="rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground active:scale-[0.98]">
          Testa
        </button>
      </div>
    </section>
  );
}
