import Link from "next/link";

export function Logo({ size = "md", href = "/" }: { size?: "sm" | "md" | "lg"; href?: string | null }) {
  const text = size === "lg" ? "text-3xl" : size === "sm" ? "text-xl" : "text-2xl";
  const inner = (
    <span className={`inline-flex items-center gap-1 font-extrabold tracking-tight ${text} text-ink`}>
      nextround
      <svg aria-hidden="true" width="18" height="22" viewBox="0 0 18 22" className="-mt-2 text-purple">
        <path d="M3 18 L7 11" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M9 20 L11 13" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M13 17 L16 12" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    </span>
  );
  if (!href) return inner;
  return (
    <Link href={href} aria-label="nextround Startseite" className="rounded-lg">
      {inner}
    </Link>
  );
}

export function BetaBadge() {
  return (
    <span className="rounded-full bg-lilac px-3 py-1 text-xs font-bold tracking-wide text-purple">BETA</span>
  );
}
