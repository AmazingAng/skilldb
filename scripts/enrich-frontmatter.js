#!/usr/bin/env node
// Merges skills-frontmatter.json into skilldb.json to enrich
// description, tags, category, license, bodyLength, fileSize fields.

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function main() {
  console.log("Loading skilldb.json...");
  const skills = JSON.parse(
    fs.readFileSync(path.join(ROOT, "skilldb.json"), "utf8")
  );
  console.log(`  ${skills.length} skills loaded`);

  console.log("Loading skills-frontmatter.json...");
  const fm = JSON.parse(
    fs.readFileSync(path.join(ROOT, "skills-frontmatter.json"), "utf8")
  );
  const fmKeys = Object.keys(fm);
  console.log(`  ${fmKeys.length} frontmatter entries loaded`);

  // Build lookup: skillUrl SkillsMP ID -> index in skills array
  const urlToIdx = new Map();
  const idToIdx = new Map();
  for (let i = 0; i < skills.length; i++) {
    const s = skills[i];
    idToIdx.set(s.id, i);
    if (s.skillUrl) {
      const smpId = s.skillUrl.replace("https://skillsmp.com/skills/", "");
      urlToIdx.set(smpId, i);
    }
  }

  // Match frontmatter keys to skilldb entries via two strategies
  const matches = new Map(); // fmKey -> skill index
  for (const key of fmKeys) {
    if (urlToIdx.has(key)) {
      matches.set(key, urlToIdx.get(key));
    } else {
      const normalized = key.replace(/_/g, "/");
      if (idToIdx.has(normalized)) {
        matches.set(key, idToIdx.get(normalized));
      }
    }
  }
  console.log(`\nMatched ${matches.size} / ${fmKeys.length} frontmatter entries (${(matches.size / fmKeys.length * 100).toFixed(1)}%)`);

  // Enrich skills
  const stats = { description: 0, tags: 0, category: 0, license: 0, bodyLength: 0, fileSize: 0 };

  for (const [fmKey, idx] of matches) {
    const entry = fm[fmKey];
    const skill = skills[idx];

    // description: only fill if currently empty
    if (!skill.description && entry.description) {
      const desc = typeof entry.description === "string"
        ? entry.description
        : String(entry.description);
      skill.description = desc.slice(0, 2000);
      stats.description++;
    }

    // tags
    if (entry.tags) {
      const tags = Array.isArray(entry.tags)
        ? entry.tags.map(String)
        : typeof entry.tags === "string"
          ? entry.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : null;
      if (tags && tags.length > 0) {
        skill.tags = tags;
        stats.tags++;
      }
    }

    // category
    if (!skill.category && entry.category) {
      skill.category = typeof entry.category === "string"
        ? entry.category
        : String(entry.category);
      stats.category++;
    }

    // license
    if (!skill.license && entry.license) {
      skill.license = typeof entry.license === "string"
        ? entry.license
        : String(entry.license);
      stats.license++;
    }

    // bodyLength from _meta
    if (entry._meta && typeof entry._meta.bodyLength === "number") {
      skill.bodyLength = entry._meta.bodyLength;
      stats.bodyLength++;
    }

    // fileSize from _meta
    if (entry._meta && typeof entry._meta.fileSize === "number") {
      skill.fileSize = entry._meta.fileSize;
      stats.fileSize++;
    }
  }

  console.log("\nEnrichment stats:");
  console.log(`  description added: ${stats.description}`);
  console.log(`  tags added:        ${stats.tags}`);
  console.log(`  category added:    ${stats.category}`);
  console.log(`  license added:     ${stats.license}`);
  console.log(`  bodyLength added:  ${stats.bodyLength}`);
  console.log(`  fileSize added:    ${stats.fileSize}`);

  // Summary of coverage after enrichment
  let withDesc = 0, withTags = 0, withCat = 0;
  for (const s of skills) {
    if (s.description) withDesc++;
    if (s.tags && s.tags.length > 0) withTags++;
    if (s.category) withCat++;
  }
  console.log(`\nPost-enrichment coverage (out of ${skills.length}):`);
  console.log(`  with description: ${withDesc} (${(withDesc / skills.length * 100).toFixed(1)}%)`);
  console.log(`  with tags:        ${withTags} (${(withTags / skills.length * 100).toFixed(1)}%)`);
  console.log(`  with category:    ${withCat} (${(withCat / skills.length * 100).toFixed(1)}%)`);

  console.log("\nWriting enriched skilldb.json...");
  fs.writeFileSync(
    path.join(ROOT, "skilldb.json"),
    JSON.stringify(skills, null, 2)
  );
  console.log("Done!");
}

main();
