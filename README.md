# AIBE-Hackathon

Preparation tools and the collaboration workflow for an AI for the Built Environment and Urbanism hackathon. The competition application will be created after the challenge is announced. The default stack is React, TypeScript, Vite and npm, with a local browser demo first.

**Hard development deadline: before 14:00 on 2026-10-31, Singapore time (UTC+8, the same as Shanghai).** Target a demo-ready version by 13:45 to retain a final submission buffer. This deadline applies to both Codex and Claude work.

## Repository and deployment

Private GitHub repository: [wlxin-nus/AIBE-Hackathon](https://github.com/wlxin-nus/AIBE-Hackathon). Local `main` tracks `origin/main`, and the preparation commit history is preserved. The local working directory remains `hackson_Yuqian`.

Create commits at runnable or verifiable milestones, then use `git push` to synchronize them with GitHub. A commit saves a local version; a push uploads commits. Website publication is a separate step.

The empty Vercel project [aibe-hackathon](https://vercel.com/xin919523529-7149/aibe-hackathon) was created on 2026-10-31 and connected to this repository. The Vercel GitHub application's repository access is limited to `AIBE-Hackathon`. No production or preview deployment has been published.

As requested, `git.deploymentEnabled` is `false` in `vercel.json`, so pushes to all branches do not trigger automatic deployments. Commit and push operations still synchronize code normally. Once publication is authorized, confirm the application directory, framework, build settings and server-side environment variables before enabling automatic deployment and verifying the first public version.

Caches, diagnostics, local Vercel configuration and secret files are excluded by `.gitignore`. Review changes before pushing, and never commit credentials.

## Language convention

- Write documentation, project instructions, task prompts, generated design briefs and user-facing text in English.
- Write explanatory comments in project-owned code in both English and Chinese. Keep command directives such as `#Requires` intact.
- Preserve vendored third-party skills and license files verbatim.
- Historical diagnostic artifacts are original evidence, are ignored by Git and are not rewritten for translation.

## Quick start

Open Windows PowerShell 5.1 or PowerShell 7 in the project root.

Run the offline preflight to check versions, local authentication and skill integrity without calling a model:

```powershell
powershell -NoProfile -File .\scripts\preflight.ps1
```

Run the online preflight to additionally check npm and request a real Opus 5.5 reply:

```powershell
powershell -NoProfile -File .\scripts\preflight.ps1 -Online
```

Request an English design brief using a task file inside the project:

```powershell
powershell -NoProfile -File .\scripts\invoke-claude.ps1 -PromptFile tasks/design-smoke.md -TaskId design-smoke -FrontendDesign
```

Start the temporary environment-check page, open http://127.0.0.1:4173, click the verification button and stop the server with Ctrl+C:

```powershell
node .\scripts\web-smoke.cjs
```

Run the offline script tests without consuming model quota:

```powershell
node --test .\tests\claude-runner.test.cjs
```

With PowerShell 7, replace `powershell` with `pwsh`. Scripts locate the project from their own directory. Relative task paths are always resolved against the project root, even when the script is launched from elsewhere.

## Claude invocation contract

- The model is fixed to `claude-opus-5-5`. The default isolated mode exposes no tools or MCP servers and saves no Claude session. Codex saves the returned output.
- `-FrontendDesign` explicitly includes the project-local official skill, including in isolated mode. The project instructions are always included explicitly.
- `-TimeoutSec` accepts 1-180 seconds and defaults to 180. The runner closes standard input, terminates timed-out child processes and exits with a nonzero code on failure.
- Use `-Mode normal` only to diagnose differences in existing user settings or plugins. Model tools and MCP remain disabled; this is not the default design workflow.
- Each invocation writes to `outputs/claude/<task-id>-<unique-id>/`, containing `result.json`, redacted events and an error log. A successful answer is also saved as `response.md`. Inspect `status`, `error` and the logs when a request fails.
- `success` requires a complete answer and evidence of the requested model. Failure states include `timeout`, `auth_error`, `model_error`, `service_overloaded`, `rate_limited`, `model_mismatch`, `model_unverified` and `process_error`. Service overload is distinct from account or request limits. Startup and local login alone do not prove a working request.
- Requested task content and review material are sent to Claude. Keep secrets out of task files. Existing tools continue to manage account credentials; do not copy them into the repository.

If DNS or localhost access fails inside the Codex sandbox but works in an ordinary terminal, run the relevant network or local-server check in the permitted host environment. Do not change global DNS, proxy or security settings to compensate for sandbox isolation.

To bypass the wrapper and check direct PowerShell communication with Claude Code:

```powershell
Get-Content -LiteralPath .\tasks\ping.md -Raw | claude -p --model claude-opus-5-5 --output-format json --no-session-persistence --tools Read --strict-mcp-config
```

This direct check allows file reads but exposes no write, command or MCP tools. The wrapper's default tool list remains empty and adds timeout handling and output archiving. Direct PowerShell, CMD, the original wrapper and the complete online preflight all passed on 2026-10-30 at 20:43 UTC+8; see the readiness record.

## Workspace contents

- `tasks/`: reusable task inputs. `docs/`: competition checklists, the challenge template, skill provenance and readiness evidence.
- `scripts/`: invocation, preflight and the temporary web check. `tests/`: offline checks of important failure paths.
- `.claude/skills/frontend-design/`: the only newly installed skill. Its official source, pinned commit and SHA256 hashes are recorded in `docs/skills-lock.json`.
- New Claude sessions can discover the project skill. The wrapper includes it explicitly, and Codex can read it without installing another copy.
- `outputs/` and `.cache/`: generated results, diagnostics, temporary downloads and npm cache, all excluded from Git.
- Existing system tools, account credentials and tool-internal storage keep their original locations. No application framework, database or extra browser extension was installed during preparation.

Read [the readiness record](docs/readiness.md), then use [the challenge template](docs/challenge-template.md) and [competition-day workflow](docs/competition-day.md).

Official references: [programmatic Claude Code](https://code.claude.com/docs/en/headless), [CLI options](https://code.claude.com/docs/en/cli-reference), [frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design), [Vite requirements](https://vite.dev/guide/) and [Vercel Git configuration](https://vercel.com/docs/project-configuration/git-configuration).
