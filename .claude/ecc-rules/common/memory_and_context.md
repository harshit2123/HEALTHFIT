# Memory & Context Management

From Affaan Mustafa's Claude Code best practices guides (2026)

## Session Persistence

### File Structure

One `.tmp` file per session with full context for next session:
```
~/.claude/sessions/YYYY-MM-DD-topic.tmp
```

**Content:**
- Current state / progress
- Completed items
- Blockers and decisions
- What approaches worked (verifiable with evidence)
- What approaches failed
- What approaches haven't been attempted
- What's left to do

### Hooks for Auto-Persistence

**Configuration (settings.json):**
```json
{
  "hooks": {
    "PreCompact": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "~/.claude/hooks/memory-persistence/pre-compact.sh"
      }]
    }],
    "SessionStart": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "~/.claude/hooks/memory-persistence/session-start.sh"
      }]
    }],
    "Stop": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "~/.claude/hooks/memory-persistence/session-end.sh"
      }]
    }]
  }
}
```

**What they do:**
- `pre-compact.sh`: Logs compaction events, updates active session file with timestamp
- `session-start.sh`: Checks for recent session files (last 7 days), notifies of available context
- `session-end.sh`: Creates/updates daily session file, tracks start/end times

**Why this matters:** Continuous memory across sessions without manual intervention.

### Continuation Pattern

When hitting context limits or taking a break:

1. Claude creates summary file of current state
2. You review, ask for edits if needed
3. Next session: pass file path to load context
4. Start fresh, pick up where you left off

## Strategic Context Clearing

### When to Compact

**Disable auto-compact.** Instead, compact manually at logical intervals:

- After exploration phase → clears research noise
- Before execution phase → fresh context for implementation
- After completing milestone → prep for next phase
- Before parallelizing → each fork gets clean state

**Command:**
```bash
/compact
```

### Exploration vs Execution

Once plan is set and context cleared (default in plan mode):
- Work from the plan
- Exploration context (now irrelevant) is gone
- Execution context (code changes) stays sharp

## Memory Dangers

### Payload Persistence

**Critical:** Payload doesn't have to win in one shot.

It can:
1. Plant fragments in memory
2. Wait silently
3. Reassemble later when conditions align

**Example:** Microsoft's AI Recommendation Poisoning (Feb 2026) documented memory-oriented attacks across 31 companies, 14 industries.

Solution: **Assume payloads will persist in memory. Plan accordingly.**

### Memory Leakage

Everything loaded at session start (Claude Code loads memory at startup):

- Secrets in memory files → accessible to all future work
- Sensitive project context → visible to unrelated tasks
- Stale patterns → influence decisions long after relevance

### Safe Memory Practices

**Do:**
- Keep memory NARROW: only project-specific context
- SEPARATE: project memory ≠ user-global memory
- RESET or ROTATE after untrusted runs
- DISABLE long-lived memory entirely for high-risk workflows

**Don't:**
- Store secrets in `.md` files (use env vars, credential stores)
- Share memory across unrelated projects
- Keep memory from untrusted sources (foreign docs, email, internet)

**Rule:** If workflow touches foreign docs, email attachments, or internet content all day—long-lived shared memory = just making persistence easier.

## Dynamic System Prompt Injection

Alternative to always-loading CLAUDE.md / `.claude/rules/`:

Use CLI flags to inject context only when needed:

```bash
claude --system-prompt "$(cat memory.md)"
```

### Why This Works

**Instruction hierarchy:**
1. System prompt (highest authority)
2. User messages
3. Tool results (lowest authority)

**When you use `@memory.md` or `.claude/rules/`:**
- Content loads via Read tool
- Comes in as tool output
- Lower priority in model's reasoning

**When you use `--system-prompt`:**
- Content injected before conversation starts
- System-level authority
- Model prioritizes it appropriately

### Practical Setup

Baseline rules in `.claude/rules/`:
```bash
~/.claude/rules/common/  # Always load
```

Scenario-specific context via aliases:
```bash
# Daily development
alias claude-dev='claude --system-prompt "$(cat ~/.claude/contexts/dev.md)"'

# PR review mode
alias claude-review='claude --system-prompt "$(cat ~/.claude/contexts/review.md)"'

# Research/exploration
alias claude-research='claude --system-prompt "$(cat ~/.claude/contexts/research.md)"'
```

**Trade-off:** For most work, difference is marginal. But for strict behavioral rules or context you absolutely need prioritized—system prompt injection wins.

## Continuous Learning / Self-Improving Memory

### When Patterns Emerge

If you've had to repeat a prompt multiple times for the same problem:
- Claude ran into same issue again
- Gave response you've heard before
- You had to "resteer" to recalibrate

**Solution:** Extract pattern, save as skill or rule.

**Problem:** Wasted tokens, wasted context, wasted time.

### Mechanisms

**Manual extraction (mid-session):**
```bash
/learn
```
- Prompts you to extract pattern right then
- Drafts skill file
- Asks confirmation before saving

**Automatic extraction (session end):**
- Stop hook evaluates session for extractable knowledge
- Saves debugging techniques, workarounds, project patterns
- Next time similar problem comes up: skill loads automatically

**Why Stop hook, not UserPromptSubmit?**
- `UserPromptSubmit` runs on EVERY message → latency hit on every prompt
- `Stop` runs once at session end → lightweight
- `Stop` evaluates COMPLETE session → captures full context
- No slowdown during session

### What to Extract

- Error resolutions
- Debugging techniques
- Workarounds for framework quirks
- Project-specific patterns
- Performance optimizations you discovered

### Session Log Pattern

Expects logs in `.tmp` files:
```
~/.claude/sessions/YYYY-MM-DD-topic.tmp
```

Example session files: `examples/sessions/` in ECC repo.

## Self-Improving Memory Patterns

### Reflection Agent (RLanceMartin pattern)

After each session, reflection agent:
- Extracts what went well
- What failed
- What corrections you made
- Distills user preferences
- Updates memory file for next session

Creates "diary" of what works + what doesn't.

### Proactive Suggestions (alexhillman pattern)

Agent proactively suggests improvements every 15 minutes:
- Reviews recent interactions
- Proposes memory updates
- You approve or reject
- System learns from approval patterns

Over time: learns YOUR preferences.

## References

- Anthropic: Claude Code Best Practices
- RLanceMartin: Session Reflection Pattern
- alexhillman: Self-Improving Memory System
- Affaan Mustafa: Longform Guide to Everything Claude Code (memory sections)
