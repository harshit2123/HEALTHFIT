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

## MANDATORY ECC ENFORCEMENT — ALWAYS ACTIVE, NO EXCEPTIONS

### Agent Pipeline (REQUIRED ORDER)
1. New feature → spawn **planner** agent FIRST, get plan.md
2. Write tests first → **tdd-guide** agent (RED → GREEN → REFACTOR)
3. After any code change → spawn **code-reviewer** immediately
4. Build fails → **build-error-resolver** only
5. Auth/payments/user data → **security-reviewer** STOP and review
6. Independent tasks → PARALLEL agents, never sequential

### Sub-Agent Rules (from ECC longform)
- Pass objective context + query to subagent (not just the query)
- Evaluate every subagent return — ask follow-ups before accepting
- Max 3 retrieval cycles per subagent
- Each agent: ONE clear input → ONE clear output → file (not memory)
- Use `/clear` between agents to keep context fresh

### Token Optimization (ENFORCED)
- Haiku: worker agents, repetitive tasks, clear instructions
- Sonnet: main dev work, orchestration (default)
- Opus: first attempt failed, 5+ files, architecture, security-critical
- Files must stay < 800 lines (forces modular reads = fewer tokens)
- Replace grep with mgrep where available
- Background processes via tmux — summarize output only, don't stream full

### Memory Rules
- Session start → check `memory/MEMORY.md`
- User correction/preference → write memory immediately
- Project decision → write project memory immediately
- NEVER store secrets in memory files
- Session end → save `.tmp` file: what worked, failed, blockers, next steps

### Context Management
- Compact MANUALLY at logical milestones — disable auto-compact
- Compact after exploration, before implementation
- Avoid last 20% of context for large tasks — summarize + handoff to new session
- Use `--system-prompt "$(cat memory.md)"` for critical behavioral rules

### Security (NON-NEGOTIABLE)
- No secrets in code, ever — env vars only
- Deny reads from: `~/.ssh/**`, `~/.aws/**`, `**/.env*`
- Sanitize PDFs/screenshots/HTML before any agent sees them
- Require human approval before: shell exec, network egress, deployments
- Never `--dangerously-skip-permissions`
- Scan skills/hooks/MCP configs like supply chain artifacts

### Code Quality
- TypeScript: `strict: true`, zero `any`
- Functions < 50 lines, files < 800 lines
- 80% test coverage minimum
- Immutable patterns — never mutate, always return new
- No hardcoded values — constants or config only

### Verification
- Checkpoint-based: define criteria per task, verify before proceeding
- If verification fails → fix before continuing, never skip
- PostToolUse hooks log what changed and output

### ECC Notes
- Single source of truth — upgrade-friendly
- Only override what differs from ECC in `./.claude/rules/`
- Build reusable patterns (skills/agents/commands) — compounds over time
- Pattern investment > specific model tricks
