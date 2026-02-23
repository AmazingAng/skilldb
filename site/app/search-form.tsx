"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/search?${params}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-term-green)] select-none">
        &gt;
      </span>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="search skills..."
        className="w-full bg-transparent border border-[var(--color-term-border)] py-2.5 pl-8 pr-4 outline-none text-[var(--color-foreground)] placeholder:text-[var(--color-term-dim)] focus:border-[var(--color-term-green)]/50 transition"
        autoFocus
      />
    </form>
  );
}
