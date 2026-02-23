import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:../skilldb.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export default db;

export type Skill = {
  id: string;
  name: string;
  description: string | null;
  owner: string | null;
  repo: string | null;
  skill_name: string | null;
  skill_path: string | null;
  github_url: string | null;
  skill_url: string | null;
  sources: string;
  installs: number;
  license: string | null;
  version: string | null;
  published_at: number | null;
  category: string | null;
  quality_score: number | null;
  tags: string | null;
  body_length: number | null;
  file_size: number | null;
};

export async function getStats() {
  const [total, withDesc, sources] =
    await Promise.all([
      db.execute("SELECT COUNT(*) as c FROM skills"),
      db.execute("SELECT COUNT(*) as c FROM skills WHERE description IS NOT NULL AND description != ''"),
      db.execute(`
        SELECT
          SUM(CASE WHEN sources LIKE '%skillsmp%' THEN 1 ELSE 0 END) as skillsmp,
          SUM(CASE WHEN sources LIKE '%skillsh%' THEN 1 ELSE 0 END) as skillsh,
          SUM(CASE WHEN sources LIKE '%clawhub%' THEN 1 ELSE 0 END) as clawhub
        FROM skills
      `),
    ]);

  return {
    total: total.rows[0].c as number,
    withDescription: withDesc.rows[0].c as number,
    sources: sources.rows[0] as unknown as { skillsmp: number; skillsh: number; clawhub: number },
  };
}

export async function getCategories() {
  const result = await db.execute(`
    SELECT category, COUNT(*) as count FROM skills
    WHERE category IS NOT NULL AND category != ''
    GROUP BY category ORDER BY count DESC
  `);
  return result.rows as { category: string; count: number }[];
}

type SearchFilters = {
  query?: string;
  category?: string;
  source?: string;
  page?: number;
  limit?: number;
};

export async function searchSkills(filters: SearchFilters) {
  const { query = "", category, source, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const args: (string | number)[] = [];
  let usesFts = false;

  if (query.trim()) {
    usesFts = true;
    const ftsQuery = query.trim().split(/\s+/).map((w) => `"${w}"`).join(" ");
    conditions.push("skills_fts MATCH ?");
    args.push(ftsQuery);
  }

  if (category) {
    conditions.push("s.category = ?");
    args.push(category);
  }

  if (source) {
    conditions.push("s.sources LIKE ?");
    args.push(`%${source}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const baseFrom = usesFts
    ? "skills_fts f JOIN skills s ON f.rowid = s.rowid"
    : "skills s";

  const [rows, countResult] = await Promise.all([
    db.execute({
      sql: `SELECT s.* FROM ${baseFrom} ${whereClause} ORDER BY s.installs DESC LIMIT ? OFFSET ?`,
      args: [...args, limit, offset],
    }),
    db.execute({
      sql: `SELECT COUNT(*) as c FROM ${baseFrom} ${whereClause}`,
      args: [...args],
    }),
  ]);

  return {
    skills: rows.rows as unknown as Skill[],
    total: countResult.rows[0].c as number,
    page,
    limit,
  };
}

export async function getSkillById(id: string): Promise<Skill | null> {
  const result = await db.execute({
    sql: "SELECT * FROM skills WHERE id = ?",
    args: [id],
  });
  return (result.rows[0] as unknown as Skill) ?? null;
}
