"use client";

import { useState, useEffect, useCallback } from "react";
import type { Skill } from "@/app/lib/db";

type SearchResult = {
  skills: Skill[];
  total: number;
  page: number;
  limit: number;
};

const LIMIT = 20;

export function SkillsTable() {
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchPage = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?page=${p}&limit=${LIMIT}`);
      setResult(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  const totalPages = result ? Math.ceil(result.total / LIMIT) : 0;

  function go(p: number) {
    setPage(p);
    fetchPage(p);
  }

  if (!result && loading) {
    return <div className="text-[var(--color-term-dim)] text-xs py-4">loading...</div>;
  }
  if (!result) return null;

  const offset = (page - 1) * LIMIT;

  return (
    <div>
      <div className="border border-[var(--color-term-border)] overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--color-term-border)] text-[var(--color-term-dim)]">
              <th className="text-left px-3 py-2 font-normal w-8">#</th>
              <th className="text-left px-3 py-2 font-normal">name</th>
              <th className="text-left px-3 py-2 font-normal hidden sm:table-cell">owner/repo</th>
              <th className="text-right px-3 py-2 font-normal">installs</th>
              <th className="text-left px-3 py-2 font-normal hidden md:table-cell">src</th>
            </tr>
          </thead>
          <tbody className={loading ? "opacity-40" : ""}>
            {result.skills.map((s, i) => (
              <tr
                key={s.id}
                className="border-b border-[var(--color-term-border)] last:border-0 hover:bg-white/[0.02]"
              >
                <td className="px-3 py-1.5 text-[var(--color-term-dim)]">{offset + i + 1}</td>
                <td className="px-3 py-1.5">
                  <div>
                    <a
                      href={`/skill/${s.id}`}
                      className="text-[var(--color-term-cyan)] hover:underline"
                    >
                      {s.name}
                    </a>
                  </div>
                  {s.description && (
                    <div className="text-[var(--color-term-dim)] line-clamp-1 mt-0.5">
                      {s.description}
                    </div>
                  )}
                </td>
                <td className="px-3 py-1.5 text-[var(--color-term-dim)] hidden sm:table-cell align-top">
                  {s.owner}/{s.repo}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums align-top">
                  {s.installs.toLocaleString()}
                </td>
                <td className="px-3 py-1.5 hidden md:table-cell align-top">
                  <SourceTags sources={s.sources} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between text-xs text-[var(--color-term-dim)]">
          <span>{result.total.toLocaleString()} skills</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => go(page - 1)}
              disabled={page <= 1}
              className="hover:text-[var(--color-foreground)] disabled:opacity-30 transition"
            >
              [prev]
            </button>
            <span>{page}/{totalPages.toLocaleString()}</span>
            <button
              onClick={() => go(page + 1)}
              disabled={page >= totalPages}
              className="hover:text-[var(--color-foreground)] disabled:opacity-30 transition"
            >
              [next]
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SourceTags({ sources }: { sources: string }) {
  const parsed: string[] = (() => {
    try { return JSON.parse(sources); } catch { return []; }
  })();
  const colors: Record<string, string> = {
    skillsmp: "text-purple-400",
    skillsh: "text-green-400",
    clawhub: "text-orange-400",
  };
  return (
    <span className="flex gap-1.5">
      {parsed.map((s) => (
        <span key={s} className={colors[s] || "text-[var(--color-term-dim)]"}>{s}</span>
      ))}
    </span>
  );
}
