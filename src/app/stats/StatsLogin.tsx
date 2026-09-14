"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

export function StatsLogin() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/stats-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    if (res.ok) router.refresh();
    else setError(true);
  }

  return (
    <form onSubmit={submit} className="mt-6 max-w-sm space-y-3">
      <input
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="Passwort"
        autoComplete="current-password"
        className="min-h-14 w-full rounded-2xl border-2 border-line bg-white px-4 text-base outline-none focus:border-purple"
      />
      {error ? <p className="text-sm font-semibold text-warn">Falsches Passwort.</p> : null}
      <Button type="submit" disabled={!pw}>
        Anmelden
      </Button>
    </form>
  );
}
