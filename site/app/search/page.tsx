"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Skill } from "@/app/lib/db";

type SearchResult = {
  skills: Skill[];
  total: number;
  page: number;
  limit: number;
};

const CATEGORIES = [
  "Development & Code Tools",
  "AI & Agents",
  "Document Processing",
  "Security & Systems",
  "Creative & Media",
  "Business & Marketing",
  "development",
  "workflow",
  "testing",
  "devops",
  "backend",
  "design",
  "github",
  "security",
];

const SOURCES = ["skillsmp", "skillsh", "clawhub"];

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [source, setSource] = useState(searchParams.get("source") || "");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const fetchResults = useCallback(async (q: string, p: number, cat: string, src: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (q.trim()) params.set("q", q.trim());
      if (cat) params.set("category", cat);
      if (src) params.set("source", src);
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const isInitialMount = useState(true);

  useEffect(() => {
    if (isInitialMount[0]) {
      isInitialMount[0] = false;
      fetchResults(query, 1, category, source);
      return;
    }
    const timer = setTimeout(() => {
      setPage(1);
      fetchResults(query, 1, category, source);
      syncUrl(query, category, source);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category, source]);

  function syncUrl(q: string, cat: string, src: string) {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (cat) params.set("category", cat);
    if (src) params.set("source", src);
    router.replace(`/search?${params}`, { scroll: false });
  }

  const totalPages = result ? Math.ceil(result.total / result.limit) : 0;

  function goToPage(p: number) {
    setPage(p);
    fetchResults(query, p, category, source);
    window.scrollTo(0, 0);
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="flex items-baseline gap-4 mb-6">
          <a href="/" className="text-[var(--color-term-dim)] hover:text-[var(--color-foreground)]">
            ~
          </a>
          <span className="text-[var(--color-term-dim)]">/</span>
          <span className="text-[var(--color-term-green)]">search</span>
        </div>

        {/* Search bar + filters */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-term-green)] select-none">
              &gt;
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search..."
              className="w-full bg-transparent border border-[var(--color-term-border)] py-2 pl-8 pr-4 outline-none text-[var(--color-foreground)] placeholder:text-[var(--color-term-dim)] focus:border-[var(--color-term-green)]/50 transition"
              autoFocus
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-transparent border border-[var(--color-term-border)] py-2 px-3 outline-none text-[var(--color-foreground)] cursor-pointer hover:border-[var(--color-term-dim)] transition appearance-none min-w-[140px]"
          >
            <option value="" className="bg-[#0a0a0a]">category: all</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-[#0a0a0a]">{c}</option>
            ))}
          </select>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="bg-transparent border border-[var(--color-term-border)] py-2 px-3 outline-none text-[var(--color-foreground)] cursor-pointer hover:border-[var(--color-term-dim)] transition appearance-none min-w-[120px]"
          >
            <option value="" className="bg-[#0a0a0a]">source: all</option>
            {SOURCES.map((s) => (
              <option key={s} value={s} className="bg-[#0a0a0a]">{s}</option>
            ))}
          </select>
        </div>

        {/* Result count */}
        <div className="text-xs text-[var(--color-term-dim)] mb-4">
          {loading ? (
            <span>searching...</span>
          ) : result ? (
            <span>
              {result.total.toLocaleString()} results
              {query && <> matching &quot;{query}&quot;</>}
              {category && <> in {category}</>}
              {source && <> from {source}</>}
            </span>
          ) : null}
        </div>

        {/* Results */}
        {result && !loading && (
          <>
            <div className="border border-[var(--color-term-border)] overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-term-border)] text-[var(--color-term-dim)]">
                    <th className="text-left px-3 py-2 font-normal">name</th>
                    <th className="text-left px-3 py-2 font-normal hidden sm:table-cell">owner/repo</th>
                    <th className="text-right px-3 py-2 font-normal w-20">installs</th>
                    <th className="text-left px-3 py-2 font-normal hidden lg:table-cell">src</th>
                  </tr>
                </thead>
                <tbody>
                  {result.skills.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-[var(--color-term-border)] last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className="px-3 py-2">
                        <div>
                          <a
                            href={`/skill/${s.id}`}
                            className="text-[var(--color-term-cyan)] hover:underline"
                          >
                            {s.name}
                          </a>
                          {s.category && (
                            <span className="ml-2 text-[10px] text-[var(--color-term-dim)] border border-[var(--color-term-border)] px-1.5 py-0.5">
                              {s.category}
                            </span>
                          )}
                        </div>
                        {s.description && (
                          <div className="mt-1 text-[var(--color-term-dim)] line-clamp-1 max-w-xl">
                            {s.description}
                          </div>
                        )}
                        {s.tags && <Tags tags={s.tags} />}
                        <div className="mt-0.5 text-[var(--color-term-dim)] sm:hidden">
                          {s.owner}/{s.repo}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-[var(--color-term-dim)] hidden sm:table-cell align-top">
                        {s.owner}/{s.repo}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums align-top">
                        {s.installs.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 hidden lg:table-cell align-top">
                        <SourceTags sources={s.sources} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="text-[var(--color-term-dim)] hover:text-[var(--color-foreground)] disabled:opacity-30 transition"
                >
                  [prev]
                </button>
                <span className="text-[var(--color-term-dim)]">
                  {page}/{totalPages.toLocaleString()}
                </span>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="text-[var(--color-term-dim)] hover:text-[var(--color-foreground)] disabled:opacity-30 transition"
                >
                  [next]
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function Tags({ tags }: { tags: string }) {
  const parsed: string[] = (() => {
    try { return JSON.parse(tags); } catch { return []; }
  })();
  if (parsed.length === 0) return null;
  return (
    <div className="mt-0.5 flex flex-wrap gap-1.5">
      {parsed.slice(0, 3).map((tag) => (
        <span key={tag} className="text-[10px] text-cyan-600">#{tag}</span>
      ))}
      {parsed.length > 3 && (
        <span className="text-[10px] text-[var(--color-term-dim)]">+{parsed.length - 3}</span>
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
