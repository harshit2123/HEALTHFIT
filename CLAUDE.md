# Healthfit Project

Fitness tracking & workout management application.

## Stack
- Frontend: React/TypeScript
- Backend: Node.js/Express
- Database: TBD

## Key Files
- `/src` - Source code
- `/public` - Static assets

## Development
- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`

## ECC Integration (Reference Library)

ECC toolkit available in `.claude/ecc-*` directories:
- **Rules**: `./.claude/ecc-rules/` — coding standards, patterns, security, testing
  - Use: `typescript/` (TS style), `common/` (universal standards)
- **Skills**: `./.claude/ecc-skills/` — reusable Claude capabilities
  - Use: `api-design/`, `testing/`, `database-migrations/`
- **Agents**: `./.claude/ecc-agents/` — multi-step AI workflows
- **Hooks**: `./.claude/ecc-hooks/` — automation scripts (format, lint on save)
- **Commands**: `./.claude/ecc-commands/` — CLI shortcuts

### How to Use
1. Read relevant rule docs (e.g., `./.claude/ecc-rules/typescript/coding-style.md`)
2. Copy into `./.claude/rules/` only project-specific overrides
3. Skills auto-load when referenced in conversation
4. Reference ECC docs in CLAUDE.md for shared knowledge

### Standard Settings
- TypeScript: `strict: true`, no `any` types
- Testing: Min 80% coverage, Jest + React Testing Library
- Git: Conventional commits, feature branches, PR reviews
- See: `./.claude/ecc-rules/common/` for full standards

## Notes
- ECC = single source of truth, upgrade-friendly
- Only override what's different from ECC
- Keep `./.claude/rules/` minimal (project-specific only)
