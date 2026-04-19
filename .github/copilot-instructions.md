## Issue Tracking

This project uses **bd (beads)** for persistent issue tracking and agent memory.
Run `bd prime` for full workflow context.

**Quick reference:**
- `bd ready` - Find unblocked work
- `bd create "Title" --type task --priority 2` - Create issue
- `bd update <id> --claim` - Claim a task atomically
- `bd close <id>` - Complete work
- `bd dolt push` - Push changes to remote (run at session end)

## Skill Execution Protocol

Whenever a skill (prompt) is invoked via `/skill-name` in chat, you MUST:

1. **Start**: Create a beads issue before doing any work — `bd create "<skill-name>: <brief description of the request>" --type task`
2. **Claim it**: `bd update <id> --claim`
3. **Work**: Execute the skill as instructed
4. **Record**: Add a note to the issue with key decisions or outputs — `bd update <id> --notes "<what was done>"`
5. **Close**: `bd close <id> "<outcome summary>"` when the skill finishes
6. **Push**: `bd dolt push` at the end of the session
