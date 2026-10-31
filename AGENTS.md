# Hackathon workspace

- Use English for project documentation, instructions, task prompts, design briefs and user-facing text. Explanatory comments in project-owned code must include both English and Chinese. Preserve command directives and vendored third-party skills/licenses verbatim; retain original historical diagnostic evidence.
- Hard deadline: hackathon development must be finished before 2026-10-31 14:00 Singapore time (UTC+8, the same as Shanghai). Keep the 13:45 demo-ready target as a buffer. Size Codex/Claude tasks and request timeouts to fit the remaining time; reduce scope if the deadline is at risk.
- Keep project code, scripts, task inputs, skills and generated outputs inside this repository. Reuse installed tools and existing account credentials; do not copy credentials into the repository.
- Preparation only: do not scaffold the competition app until the challenge is known. Default app stack: React, TypeScript, Vite and npm; local browser demo first.
- Vercel project `aibe-hackathon` is connected to `wlxin-nus/AIBE-Hackathon`. The user requested no content publication yet; preserve `git.deploymentEnabled: false` in `vercel.json` until deployment is authorized.
- Codex owns implementation, verification and integration. Claude provides design proposals and reviews through `scripts/invoke-claude.ps1`; its default invocation has no tools and cannot edit files.
- Start with one Codex implementation session and one Claude design session. Add independent sessions only when useful; assign one writer per file.
- Keep instructions and dependencies small. Reuse available Karpathy guidelines and browser/document tools; the only new skill is project-local `frontend-design`.
- Do not equate CLI startup, login, sample output or developer subscriptions with a working app AI API. Record actual replies and unresolved blockers honestly.
- Before marking preparation ready, run offline checks and tests, verify the real Claude reply, and verify the temporary local page in a browser. Never commit secrets or generated diagnostic logs.
