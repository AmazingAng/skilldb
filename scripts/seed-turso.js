#!/usr/bin/env node
// Seeds Turso cloud database from skilldb.json
// Reads TURSO_DATABASE_URL and TURSO_AUTH_TOKEN from site/.env.local

const { createClient } = require("@libsql/client");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function loadEnv() {
  const envPath = path.join(ROOT, "site", ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("Missing site/.env.local with TURSO_DATABASE_URL and TURSO_AUTH_TOKEN");
    process.exit(1);
  }
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^(\w+)=(.+)/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}

async function main() {
  loadEnv();

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    console.error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN required");
    process.exit(1);
  }

  console.log(`Connecting to ${url}`);
  const db = createClient({ url, authToken });

  console.log("Creating tables...");
  await db.executeMultiple(`
    DROP TABLE IF EXISTS skills_fts;
    DROP TABLE IF EXISTS skills;

    CREATE TABLE skills (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      owner TEXT,
      repo TEXT,
      skill_name TEXT,
      skill_path TEXT,
      github_url TEXT,
      skill_url TEXT,
      sources TEXT,
      installs INTEGER DEFAULT 0,
      license TEXT,
      version TEXT,
      published_at INTEGER,
      category TEXT,
      quality_score REAL,
      tags TEXT,
      body_length INTEGER,
      file_size INTEGER
    );

    CREATE INDEX idx_skills_installs ON skills(installs DESC);
    CREATE INDEX idx_skills_owner ON skills(owner);
    CREATE INDEX idx_skills_category ON skills(category);

    CREATE VIRTUAL TABLE skills_fts USING fts5(
      name,
      description,
      owner,
      tags,
      content=skills,
      content_rowid=rowid
    );
  `);

  console.log("Loading skilldb.json...");
  const skills = JSON.parse(fs.readFileSync(path.join(ROOT, "skilldb.json"), "utf8"));
  console.log(`Loaded ${skills.length} skills`);

  const BATCH_SIZE = 200;
  let inserted = 0;

  for (let i = 0; i < skills.length; i += BATCH_SIZE) {
    const batch = skills.slice(i, i + BATCH_SIZE);
    const stmts = batch.map((s) => ({
      sql: `INSERT INTO skills (id, name, description, owner, repo, skill_name, skill_path,
            github_url, skill_url, sources, installs, license, version, published_at,
            category, tags, body_length, file_size)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        s.id,
        s.name || "",
        s.description || null,
        s.owner || null,
        s.repo || null,
        s.skillName || null,
        s.skillPath || null,
        s.githubUrl || null,
        s.skillUrl || null,
        JSON.stringify(s.sources || []),
        s.installs || 0,
        s.license || null,
        s.version || null,
        s.publishedAt || null,
        s.category || null,
        s.tags ? JSON.stringify(s.tags) : null,
        s.bodyLength || null,
        s.fileSize || null,
      ],
    }));

    await db.batch(stmts, "write");
    inserted += batch.length;
    if (inserted % 10000 === 0 || inserted === skills.length) {
      console.log(`  ${inserted}/${skills.length}`);
    }
  }

  console.log("Building FTS index...");
  await db.execute(`
    INSERT INTO skills_fts (rowid, name, description, owner, tags)
    SELECT rowid, name, COALESCE(description, ''), COALESCE(owner, ''), COALESCE(tags, '') FROM skills
  `);

  const result = await db.execute("SELECT COUNT(*) as c FROM skills");
  console.log(`\nDone! ${result.rows[0].c} skills in Turso.`);

  const ftsTest = await db.execute(`
    SELECT s.name, s.owner, s.installs
    FROM skills_fts f JOIN skills s ON f.rowid = s.rowid
    WHERE skills_fts MATCH '"react"' ORDER BY s.installs DESC LIMIT 3
  `);
  console.log("FTS test 'react':", ftsTest.rows.map((r) => `${r.owner}/${r.name}(${r.installs})`).join(", "));
}

main().catch((e) => { console.error(e); process.exit(1); });
