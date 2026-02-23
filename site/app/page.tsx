import { getStats } from "@/app/lib/db";
import { SearchForm } from "./search-form";
import { SkillsTable } from "./skills-table";

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

export const revalidate = 3600;

export default async function Home() {
  const stats = await getStats();

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-[var(--color-term-green)] text-lg font-normal">
            $ skilldb
          </h1>
          <p className="text-[var(--color-term-dim)] mt-1">
            Open index of {fmt(stats.total)} agent skills across 3 platforms.
          </p>
        </div>

        {/* Search */}
        <SearchForm />

        {/* Stats line */}
        <div className="mt-6 mb-8 flex flex-wrap gap-x-6 gap-y-1 text-xs text-[var(--color-term-dim)]">
          <span>{fmt(stats.total)} total</span>
          <span>{fmt(stats.withDescription)} with desc</span>
          <span className="text-purple-400">{fmt(stats.sources.skillsmp)} skillsmp</span>
          <span className="text-green-400">{fmt(stats.sources.skillsh)} skills.sh</span>
          <span className="text-orange-400">{fmt(stats.sources.clawhub)} clawhub</span>
        </div>

        {/* Paginated Skills Table */}
        <div className="mb-10">
          <h2 className="text-[var(--color-term-green)] text-sm mb-3">
            # top by installs
          </h2>
          <SkillsTable />
        </div>

        {/* Footer */}
        <footer className="flex items-center gap-4 text-xs border-t border-[var(--color-term-border)] pt-4">
          <a
            href="https://github.com/AmazingAng/skilldb"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-term-dim)] hover:text-[var(--color-foreground)] transition"
            aria-label="GitHub"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </a>
          <a
            href="https://x.com/0xAA_Science"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-term-dim)] hover:text-[var(--color-foreground)] transition"
            aria-label="X / Twitter"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
        </footer>
      </div>
    </main>
  );
}
