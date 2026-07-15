import type { Exercise } from "@/lib/exercises";

const IMAGE_PATHS: Record<string, string> = {
  armhavningar: "/exercises/armhavningar.png",
  bankdips: "/exercises/bankdips.png",
  benlyft: "/exercises/benlyft.png",
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
};

const CUSTOM_IDS = new Set([
  "vaggarmhavningar",
  "axelpress",
  "handduksrodd",
  "skulderbladspress",
  "dead_bug",
  "bird_dog",
  "vadpress",
]);

function Person({ x = 0 }: { x?: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <circle cx="72" cy="32" r="12" />
      <path d="M72 44v46" />
      <path d="M72 58 48 76" />
      <path d="M72 58 96 76" />
      <path d="M72 90 52 132" />
      <path d="M72 90 94 132" />
    </g>
  );
}

function CustomIllustration({ id }: { id: string }) {
  const common = "fill-none stroke-current text-primary";

  if (id === "vaggarmhavningar") {
    return (
      <svg viewBox="0 0 240 180" className={`h-full w-full ${common}`} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Väggarmhävningar">
        <path d="M204 18v144" />
        <circle cx="98" cy="43" r="12" />
        <path d="M104 55 128 88 178 88" />
        <path d="M127 88 113 130" />
        <path d="M127 88 145 132" />
        <path d="M128 72 178 78" />
        <path d="M178 68v20" />
      </svg>
    );
  }

  if (id === "axelpress") {
    return (
      <svg viewBox="0 0 240 180" className={`h-full w-full ${common}`} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Axelpress">
        <Person x={48} />
        <path d="M120 58 100 28" />
        <path d="M144 58 164 28" />
        <path d="M96 22h12" />
        <path d="M156 22h12" />
      </svg>
    );
  }

  if (id === "handduksrodd") {
    return (
      <svg viewBox="0 0 240 180" className={`h-full w-full ${common}`} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Handduksrodd">
        <circle cx="120" cy="34" r="12" />
        <path d="M120 46v48" />
        <path d="M120 61 88 80" />
        <path d="M120 61 152 80" />
        <path d="M88 80h64" />
        <path d="M120 94 96 136" />
        <path d="M120 94 145 136" />
        <path d="M78 68v24" />
        <path d="M162 68v24" />
      </svg>
    );
  }

  if (id === "skulderbladspress") {
    return (
      <svg viewBox="0 0 240 180" className={`h-full w-full ${common}`} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Skulderbladspress">
        <path d="M206 18v144" />
        <circle cx="92" cy="40" r="12" />
        <path d="M98 52 126 84 180 84" />
        <path d="M126 84 108 130" />
        <path d="M126 84 149 130" />
        <path d="M126 68 180 72" />
        <path d="M154 54 142 66" />
        <path d="M154 78 142 66" />
        <path d="M104 54 116 66" />
        <path d="M104 78 116 66" />
      </svg>
    );
  }

  if (id === "dead_bug") {
    return (
      <svg viewBox="0 0 240 180" className={`h-full w-full ${common}`} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Dead bug">
        <path d="M30 142h180" strokeWidth="4" />
        <circle cx="72" cy="112" r="11" />
        <path d="M83 112h55" />
        <path d="M105 110 82 68" />
        <path d="M120 110 147 64" />
        <path d="M138 112 176 86" />
        <path d="M138 112 170 136" />
      </svg>
    );
  }

  if (id === "bird_dog") {
    return (
      <svg viewBox="0 0 240 180" className={`h-full w-full ${common}`} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Bird dog">
        <circle cx="78" cy="70" r="11" />
        <path d="M90 74h66" />
        <path d="M104 78 84 124" />
        <path d="M145 78 154 124" />
        <path d="M94 74 50 56" />
        <path d="M156 76 202 54" />
        <path d="M70 124h26" />
        <path d="M145 124h24" />
      </svg>
    );
  }

  if (id === "vadpress") {
    return (
      <svg viewBox="0 0 240 180" className={`h-full w-full ${common}`} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Vadpress">
        <Person x={48} />
        <path d="M94 132h28" />
        <path d="M142 132h28" />
        <path d="M100 146h22" />
        <path d="M146 146h24" />
        <path d="m110 150 8-12" />
        <path d="m158 150 8-12" />
        <path d="M184 54v78" strokeWidth="4" />
      </svg>
    );
  }

  return null;
}

export function ExerciseIllustration({ exercise }: { exercise: Exercise }) {
  if (CUSTOM_IDS.has(exercise.id)) {
    return <CustomIllustration id={exercise.id} />;
  }

  const imageSrc = IMAGE_PATHS[exercise.id];
  if (imageSrc) {
    return <img src={imageSrc} alt={exercise.name} className="h-full w-full object-contain" loading="lazy" />;
  }

  return (
    <svg viewBox="0 0 240 180" className="h-full w-full fill-none stroke-current text-primary" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label={exercise.name}>
      <Person x={48} />
    </svg>
  );
}
