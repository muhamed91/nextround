/* Small hand-drawn style SVG accents. Purely decorative. */

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function Smiley({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 120" className={className}>
      <path d="M22 60c0-22 16-40 38-40s40 18 40 40-18 40-40 40S22 82 22 60z" {...stroke} strokeWidth={4} />
      <path d="M45 50c2-3 6-3 8 0" {...stroke} strokeWidth={4} />
      <path d="M72 48c2 0 4 2 4 4" {...stroke} strokeWidth={4} />
      <path d="M42 72c8 10 28 10 36 0" {...stroke} strokeWidth={4} />
      <path d="M96 30l8-8M100 44l10-2M88 20l2-10" {...stroke} strokeWidth={3} />
    </svg>
  );
}

export function ArrowDoodle({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 80 80" className={className}>
      <path d="M14 66C30 50 40 40 66 16" {...stroke} strokeWidth={4} />
      <path d="M44 16h22v22" {...stroke} strokeWidth={4} />
    </svg>
  );
}

export function Sparkles({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 80 60" className={className}>
      <path d="M12 8l6 14M32 4l0 16M52 8l-6 14M8 32l14-4M72 32l-14-4" {...stroke} strokeWidth={4} />
    </svg>
  );
}

export function Star({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 60 60" className={className}>
      <path d="M30 6l7 16 17 2-13 11 4 17-15-9-15 9 4-17L6 24l17-2z" {...stroke} strokeWidth={3.5} />
    </svg>
  );
}

export function Bulb({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 60 70" className={className}>
      <path d="M18 30a12 12 0 1 1 24 0c0 6-4 9-6 13v5H24v-5c-2-4-6-7-6-13z" {...stroke} strokeWidth={3.5} />
      <path d="M24 54h12M26 60h8" {...stroke} strokeWidth={3.5} />
      <path d="M30 8V2M10 14l-4-3M50 14l4-3" {...stroke} strokeWidth={3} />
    </svg>
  );
}

/** Blob background shape used on the landing page. */
export function Blob({ className = "", color = "lime" }: { className?: string; color?: "lime" | "purple" }) {
  const fill = color === "lime" ? "var(--lime)" : "var(--purple)";
  return (
    <svg aria-hidden="true" viewBox="0 0 200 200" className={className}>
      <path
        d="M52 22c30-18 76-14 102 10 26 24 32 66 14 96s-56 46-92 40S10 128 8 92 22 40 52 22z"
        fill={fill}
      />
    </svg>
  );
}
