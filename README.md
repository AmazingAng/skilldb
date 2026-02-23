# skilldb

Multi-platform Agent Skill aggregation and archive.

## Data Sources

| Platform | Skills | URL |
|----------|--------|-----|
| SkillsMP | ~161K | https://skillsmp.com |
| skills.sh | ~22K | https://skills.sh |
| ClawHub | ~11K | https://clawhub.ai |

## skilldb.json

Unified, deduplicated index of **180,587 skills** merged from all three platforms.

Each entry contains:

```json
{
  "id": "owner/repo/skill-path",
  "name": "skill-name",
  "owner": "github-owner",
  "repo": "github-repo",
  "skillPath": "path/within/repo",
  "githubUrl": "https://github.com/...",
  "sources": ["skillsmp", "skillsh", "clawhub"],
  "installs": 12345
}
```

Sorted by `installs` descending.
