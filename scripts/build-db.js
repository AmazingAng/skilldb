#!/usr/bin/env node
// Builds a local SQLite database from skilldb.json
// Usage: node scripts/build-db.js

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const JSON_FILE = path.join(ROOT, 'skilldb.json');
const DB_FILE = path.join(ROOT, 'skilldb.db');

function main() {
  console.log('Loading skilldb.json...');
  const skills = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
  console.log(`Loaded ${skills.length} skills`);

  if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
  const db = new Database(DB_FILE);

  db.pragma('journal_mode = WAL');

  db.exec(`
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
      quality_score REAL
    );

    CREATE INDEX idx_skills_installs ON skills(installs DESC);
    CREATE INDEX idx_skills_owner ON skills(owner);
    CREATE INDEX idx_skills_category ON skills(category);

    CREATE VIRTUAL TABLE skills_fts USING fts5(
      name,
      description,
      owner,
      content=skills,
      content_rowid=rowid
    );
  `);

  const insert = db.prepare(`
    INSERT INTO skills (id, name, description, owner, repo, skill_name, skill_path,
      github_url, skill_url, sources, installs, license, version, published_at)
    VALUES (@id, @name, @description, @owner, @repo, @skill_name, @skill_path,
      @github_url, @skill_url, @sources, @installs, @license, @version, @published_at)
  `);

  const insertFts = db.prepare(`
    INSERT INTO skills_fts (rowid, name, description, owner)
    VALUES (@rowid, @name, @description, @owner)
  `);

  console.log('Inserting skills...');

  const insertAll = db.transaction(() => {
    let count = 0;
    for (const s of skills) {
      insert.run({
        id: s.id,
        name: s.name || '',
        description: s.description || null,
        owner: s.owner || null,
        repo: s.repo || null,
        skill_name: s.skillName || null,
        skill_path: s.skillPath || null,
        github_url: s.githubUrl || null,
        skill_url: s.skillUrl || null,
        sources: JSON.stringify(s.sources || []),
        installs: s.installs || 0,
        license: s.license || null,
        version: s.version || null,
        published_at: s.publishedAt || null,
      });
      count++;
      if (count % 50000 === 0) console.log(`  ${count}/${skills.length}`);
    }
    return count;
  });

  const total = insertAll();
  console.log(`Inserted ${total} skills`);

  console.log('Building FTS index...');
  db.exec(`
    INSERT INTO skills_fts (rowid, name, description, owner)
    SELECT rowid, name, COALESCE(description, ''), COALESCE(owner, '') FROM skills
  `);

  const stats = {
    total: db.prepare('SELECT COUNT(*) as c FROM skills').get().c,
    withGithubUrl: db.prepare('SELECT COUNT(*) as c FROM skills WHERE github_url IS NOT NULL').get().c,
    withDescription: db.prepare("SELECT COUNT(*) as c FROM skills WHERE description IS NOT NULL AND description != ''").get().c,
    topOwners: db.prepare(`
      SELECT owner, COUNT(*) as count FROM skills
      WHERE owner IS NOT NULL
      GROUP BY owner ORDER BY count DESC LIMIT 10
    `).all(),
    sourceDist: db.prepare(`
      SELECT
        SUM(CASE WHEN sources LIKE '%skillsmp%' THEN 1 ELSE 0 END) as skillsmp,
        SUM(CASE WHEN sources LIKE '%skillsh%' THEN 1 ELSE 0 END) as skillsh,
        SUM(CASE WHEN sources LIKE '%clawhub%' THEN 1 ELSE 0 END) as clawhub
      FROM skills
    `).get(),
  };

  console.log('\n=== Database Stats ===');
  console.log(`Total skills: ${stats.total}`);
  console.log(`With GitHub URL: ${stats.withGithubUrl}`);
  console.log(`With description: ${stats.withDescription}`);
  console.log(`Sources: SkillsMP=${stats.sourceDist.skillsmp}, skills.sh=${stats.sourceDist.skillsh}, ClawHub=${stats.sourceDist.clawhub}`);
  console.log('Top owners:', stats.topOwners.map(o => `${o.owner}(${o.count})`).join(', '));

  const ftsTest = db.prepare(`
    SELECT s.name, s.owner, s.installs
    FROM skills_fts f JOIN skills s ON f.rowid = s.rowid
    WHERE skills_fts MATCH ? ORDER BY s.installs DESC LIMIT 5
  `).all('react');
  console.log('\nFTS test "react":', ftsTest.map(r => `${r.owner}/${r.name}(${r.installs})`).join(', '));

  const dbSize = fs.statSync(DB_FILE).size;
  console.log(`\nDatabase: ${DB_FILE} (${(dbSize / 1024 / 1024).toFixed(1)} MB)`);

  db.close();
}

main();
