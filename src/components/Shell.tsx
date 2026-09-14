import type { ReactNode } from "react";

/** Centered mobile-first column. Wide variant for landing. */
export function Shell({ children, wide = false, className = "" }: { children: ReactNode; wide?: boolean; className?: string }) {
  return (
    <div className={`mx-auto flex w-full flex-1 flex-col px-5 pb-10 sm:px-8 ${wide ? "max-w-6xl" : "max-w-xl"} ${className}`}>
      {children}
    </div>
  );
}
