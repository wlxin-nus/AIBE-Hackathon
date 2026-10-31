# Preparation readiness record

Local tool checks were repeated on 2026-10-30 at 20:43 UTC+8. Repository and Vercel setup were completed on 2026-10-31. **The local environment, real Opus 5.5 replies and the design-skill round trip passed. Application-runtime AI remains deferred until the challenge is known.**

| Check | Status | Evidence |
| --- | --- | --- |
| Workspace and local Git | Established | Project files, tasks, skills and outputs stay inside the root; generated results and caches are excluded from Git. |
| GitHub synchronization (2026-10-31) | Passed | Private repository `wlxin-nus/AIBE-Hackathon`; local `main` tracks `origin/main`; pushed commits were compared and matched. |
| Vercel repository access (2026-10-31) | Passed | The user installed the GitHub application for this repository only; Vercel lists `AIBE-Hackathon`. |
| Empty Vercel project and Git connection (2026-10-31) | Passed | Created `aibe-hackathon`; Git settings show `wlxin-nus/AIBE-Hackathon` as connected. |
| Content publication | Not published, as requested | The overview showed No Production Deployment and No Preview Deployments; the production domain was not serving traffic. |
| Automatic deployment control | Disabled | `vercel.json` sets `git.deploymentEnabled: false`; the repository is connected without publishing on push. |
| Node / npm / Git / Claude Code | Passed | Node 22.14.0, npm 10.9.2, Git 2.45.2 and Claude Code 2.1.314; Node meets the checked Vite requirement. |
| Local Claude authentication | Passed | Existing Claude Pro login is readable; credentials were not copied and login state was not changed. |
| Offline PowerShell preflight | Passed | Fresh Windows PowerShell 5.1 and PowerShell 7 processes passed. A separate check using the system's persistent PATH passed without Codex-injected tool paths. |
| npm connectivity and local cache | Passed | The official registry was reachable; npm cache resolves to project-local `.cache/npm`. |
| Browser control | Passed | Chrome opened the local page; clicking the button displayed `BROWSER_CONTROL_OK`. Evidence is in `outputs/browser/`. |
| Temporary service cleanup | Passed | Test tabs were closed; the stopped service no longer accepted connections on port 4173. |
| Only newly installed skill | Installation, integrity and design round trip passed | Official `frontend-design`; the pinned commit and SHA256 hashes are in `skills-lock.json`, and a real design response was received. |
| Invocation error handling | Passed | Six offline tests cover stdin closure, Unicode and shell metacharacters, timeout termination, startup failure, auth/model/quota errors, model identity, overload recovery and redaction. |
| Real Opus 5.5 response | Passed | Direct PowerShell with user configuration, direct CMD stdin and the unchanged original wrapper all returned `CODEX_CLAUDE_OK`, reporting `claude-opus-5-5`. |
| Design-skill response | Passed | The wrapper explicitly supplied the skill and produced an Inspection Review Workbench brief in about 30.5 seconds, covering layout, colours, components, states and browser acceptance. The historical rehearsal response was in Chinese. |
| Latest live preflight | Passed | Windows PowerShell 5.1 returned `passed: true` and exit code 0; npm and the real model reply both passed. |
| Application-runtime AI | Deferred as planned | Common API keys were not present in the checked process. Developer subscriptions are not treated as proof of an available application API. |

## Language update verification (2026-10-31)

Project documentation, instructions, task prompts and temporary-page UI copy are now in English. Explanatory code and configuration comments are bilingual, English and Chinese. Vendored skill files and licenses were preserved unchanged; historical generated artifacts retain their original contents.

The repository scan found Chinese text only in bilingual comments. All six offline script tests passed, the temporary web script passed its syntax check, and a fresh Windows PowerShell 5.1 offline preflight passed, including skill-integrity verification. Chinese UTF-8 test coverage is preserved through Unicode escapes in the fixture.

A real Opus 5.5 request using the updated design prompt returned an English brief successfully in about 23.6 seconds. The response is stored at `outputs/claude/english-design-check-1793414134615-a6f3a895/response.md`. Automatic deployments remain disabled.

## Communication rechecks and historical errors

Earlier normal-mode, isolated-mode and design requests returned HTTP 529 or overload retries. Those records remain as historical evidence. Direct PowerShell, direct CMD and the original wrapper all succeeded during the 20:41-20:43 rechecks on 2026-10-30. Neither the wrapper nor account configuration was changed to achieve that recovery, so the evidence does not establish Node, shell choice or configuration differences as the unique cause.

Claude Code can be used through PowerShell or CMD. To recheck from the project root:

```powershell
powershell -NoProfile -File .\scripts\preflight.ps1 -Online
powershell -NoProfile -File .\scripts\invoke-claude.ps1 -PromptFile tasks/design-smoke.md -TaskId design-smoke -FrontendDesign
```

Both checks passed in that round. The preflight report records the real reply and requested model. The successful design response is at `outputs/claude/design-smoke-recheck-1793364165386-5cf252f0/response.md`. The rehearsal is fictional and is not the selected competition topic. The current task prompt now requests English output; historical evidence is retained unchanged.

Direct PowerShell and CMD records are `outputs/diagnostics/direct-powershell.json` and `outputs/diagnostics/direct-cmd-stdin.json`. An earlier CMD argument-quoting attempt truncated the prompt and is not counted as successful full-text delivery. Passing the prompt on stdin delivered the complete text and returned the expected answer.

## Evidence and limitations

- Each request has a unique output directory. Start with `result.json` under `outputs/claude/`, then inspect the redacted events. An earlier runner grouped HTTP 529 under `rate_limited`; the recorded 529/overloaded text identifies the actual error. The current runner uses a separate `service_overloaded` status.
- `outputs/diagnostics/` stores preflight reports. `outputs/browser/` stores screenshots, interaction records and service-stop evidence. These generated local artifacts are excluded from Git.
- Failure-path tests use controlled subprocesses and error events; they do not log out the real account, alter model access or intentionally exhaust quota.
- Sandbox DNS and the host browser network are isolated. Run network and local-web checks in the permitted host environment; do not change global network settings when only sandbox checks fail.
- No competition application scaffold, framework, database or extra browser extension was installed during preparation. Existing tools, account credentials and tool-internal storage remain in their original locations.
