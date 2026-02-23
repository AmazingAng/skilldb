import { notFound } from "next/navigation";
import Link from "next/link";
import { getSkillById } from "@/app/lib/db";

type Props = {
  params: Promise<{ id: string[] }>;
};

export default async function SkillDetailPage({ params }: Props) {
  const { id } = await params;
  const skillId = id.join("/");
  const skill = await getSkillById(skillId);

  if (!skill) return notFound();

  const sources: string[] = (() => {
    try { return JSON.parse(skill.sources); } catch { return []; }
  })();

  const tags: string[] = (() => {
    if (!skill.tags) return [];
    try { return JSON.parse(skill.tags); } catch { return []; }
  })();

  const sourceColors: Record<string, string> = {
    skillsmp: "text-purple-400",
    skillsh: "text-green-400",
    clawhub: "text-orange-400",
  };

  const links: { label: string; url: string; color: string }[] = [];

  if (skill.github_url) {
    links.push({ label: "github", url: skill.github_url, color: "" });
  }
  if (skill.skill_url) {
    links.push({ label: "skillsmp", url: skill.skill_url, color: "text-purple-400" });
  }
  if (sources.includes("skillsh") && skill.owner && skill.repo && skill.skill_name) {
    links.push({
      label: "skills.sh",
      url: `https://skills.sh/s/${skill.owner}/${skill.repo}/${skill.skill_name}`,
      color: "text-green-400",
    });
  }
  if (sources.includes("clawhub") && skill.github_url) {
    links.push({
      label: "clawhub",
      url: skill.github_url,
      color: "text-orange-400",
    });
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-baseline gap-2 mb-8 text-xs">
          <Link href="/" className="text-[var(--color-term-dim)] hover:text-[var(--color-foreground)]">~</Link>
          <span className="text-[var(--color-term-dim)]">/</span>
          <span className="text-[var(--color-term-green)]">{skill.name}</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[var(--color-term-cyan)] text-base">{skill.name}</h1>
          {skill.owner && skill.repo && (
            <div className="text-[var(--color-term-dim)] text-xs mt-1">
              {skill.owner}/{skill.repo}
            </div>
          )}
        </div>

        {/* Info table */}
        <div className="border border-[var(--color-term-border)] mb-6">
          <Row label="id" value={skill.id} />
          {skill.description && (
            <Row label="description">
              <span className="text-[var(--color-foreground)]">{skill.description}</span>
            </Row>
          )}
          {skill.owner && <Row label="owner" value={skill.owner} />}
          {skill.repo && <Row label="repo" value={skill.repo} />}
          {skill.skill_path && <Row label="path" value={skill.skill_path} />}
          {skill.category && <Row label="category" value={skill.category} />}
          {tags.length > 0 && (
            <Row label="tags">
              <span className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span key={t} className="text-cyan-600">#{t}</span>
                ))}
              </span>
            </Row>
          )}
          <Row label="installs" value={skill.installs.toLocaleString()} />
          {skill.license && <Row label="license" value={skill.license} />}
          {skill.version && <Row label="version" value={skill.version} />}
          {skill.body_length != null && (
            <Row label="body_length" value={`${skill.body_length.toLocaleString()} chars`} />
          )}
          {skill.file_size != null && (
            <Row label="file_size" value={formatBytes(skill.file_size)} />
          )}
          <Row label="sources">
            <span className="flex gap-2">
              {sources.map((s) => (
                <span key={s} className={sourceColors[s] || ""}>{s}</span>
              ))}
            </span>
          </Row>
        </div>

        {/* Links */}
        {links.length > 0 && (
          <div className="flex flex-wrap gap-4 text-xs mb-8">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`hover:underline transition ${l.color || "text-[var(--color-term-dim)] hover:text-[var(--color-foreground)]"}`}
              >
                [{l.label}] →
              </a>
            ))}
          </div>
        )}

        {/* Back */}
        <div className="text-xs">
          <Link
            href="/"
            className="text-[var(--color-term-dim)] hover:text-[var(--color-foreground)] transition"
          >
            ← back
          </Link>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex border-b border-[var(--color-term-border)] last:border-0 text-xs">
      <div className="w-28 shrink-0 px-3 py-2 text-[var(--color-term-dim)]">{label}</div>
      <div className="px-3 py-2 min-w-0 break-words">{children ?? value}</div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
