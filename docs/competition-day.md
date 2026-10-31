# Competition-day workflow

Source: [the organizer's event page](https://luma.com/ed25irgb), checked during preparation on 2026-10-30. All times below are Singapore time (UTC+8, the same as Shanghai). On-site instructions take precedence.

## Hard development deadline

The user confirmed that hackathon development must finish **before 14:00 on 2026-10-31 (UTC+8)**. Keep the existing 13:15 feature freeze and 13:45 demo-ready target, leaving the final 15 minutes for submission and presentation checks. Plan all Codex and Claude work within this cutoff, including verification and the final code checkpoint. Reduce scope whenever a task threatens the deadline. A later event schedule does not automatically extend this user-defined cutoff.

| Time | Action |
| --- | --- |
| 10:00-10:30 | Register and confirm power, network, projection and the submission channel. |
| 10:30-10:45 | Capture the challenge requirements and judging priorities. |
| 10:45-11:30 | Attend the tools and prototyping session; check data, model quota and team capabilities. |
| 11:30-11:45 | Use the worksheet to lock one user, one workflow and one visible result. |
| 11:45-13:15 | Make input-to-output work, then improve the interface; keep demonstrable checkpoints. |
| 13:15-13:45 | Freeze features, fix the demo path and prepare screenshots, outputs and a recording. |
| 13:45-14:00 | Submit, verify the required links/files and rehearse the three-minute presentation. |
| 14:00-15:00 | Presentations, judging and networking. |

## Arrival and kickoff

Bring the laptop, charger, projection adapter, mouse and a hotspot. Confirm account access. Run the offline preflight on arrival and the online preflight when connectivity is available. Keep code, tasks, skills and generated outputs inside this project. Do not install ECC.

Once the challenge is available, paste the initial handoff from [the challenge worksheet](challenge-template.md) into the current Codex chat. The challenge text or attachments are enough to start analysis; mark other items `Unknown` and provide them later. Include all candidate challenges when there are several. The fictional rehearsal scenario is not a competition topic.

Start coding when the on-site rules permit. The workflow below assumes an 11:30 build start and a 13:45 demo-ready target. Adjust the sequence if the schedule changes, while preserving the hard development cutoff before 14:00.

## Parallel execution

| Stage | Codex main session | Claude design session | You and teammates | Deliverable |
| --- | --- | --- | --- | --- |
| First 15 minutes | Extract judging criteria and constraints; recommend scope; maintain a one-page brief and acceptance criteria. | Use the same brief to propose the user flow, page hierarchy and essential states. | Validate the pain point and user; ask mentors about unclear requirements; find real samples. | One user, one core flow, one input sample and one visible result, plus explicit exclusions. |
| Next 30 minutes | Create the minimal project after the topic is known; agree input/output samples; validate real AI execution; implement the first clickable flow. | Return one concrete design: layout, colour/type/spacing, components, interaction states and acceptance points. | Prepare data and sources; confirm submission channel, presentation length and URL requirements. | At least one sample travels from input to result; saved examples are distinct from real AI responses. |
| Until 13:15 | Implement and integrate the complete core flow before polishing; save demonstrable Git checkpoints. | Review page structure, copy and browser findings supplied by Codex; recommend small changes. | Try the workflow and verify business results; prepare the value proposition and comparison method. | A repeatable core flow with explainable results and useful error feedback. |
| 13:15-13:45 | Freeze features; fix critical issues; check real inputs, errors, startup and recovery; save screenshots and demo materials. | Review hierarchy, button copy, readability and the demo narrative; avoid a major redesign. | Rehearse the three-minute demo and confirm submission requirements. | A stable demo, sample results, screenshots/short recording and a recovery checkpoint. |
| 13:45-14:00 | Help package run instructions, technical notes and deliverables. | Refine short presentation copy if useful. | Submit through the required channel and confirm success. | A complete submission and a demonstrable local application. |

While the design is pending, Codex progresses startup, samples, input/output contracts and AI requests. If the first sample is not working on time, reduce the input scope, screen count or output types.

## Responsibilities

- You own business judgement, on-site information and the final presentation. Correct assumptions about users, pain points and input material promptly; Codex handles technical implementation.
- Codex owns scope, technical choices, code, dependencies, runtime, browser operations, screenshots, tests and integration. Codex invokes Claude through the project PowerShell script.
- Claude provides visual and interaction proposals, component suggestions, copy and design reviews. Its default response is text; it does not edit project code.
- The current wrapper receives explicitly supplied text and does not automatically see the browser or project files. Codex observes the interface and sends structured findings back. Direct screenshot reading by Claude is not a verified capability of this wrapper.
- Documentation, task prompts, design briefs and user-facing text are in English. Explanatory comments in project-owned code are bilingual, English and Chinese.

## Session coordination

Start with one Codex implementation session and one Claude design session. Codex maintains input/output examples, field meanings and acceptance criteria; both sessions use the same version of the brief.

Add a third session only for an independent task, preferably a read-only code review, data preparation or presentation copy. Do not start a large agent team in advance. Each handoff states the objective, inputs, output location, writable files and acceptance criteria.

Assign one writer per file. The main Codex session controls dependency installation, lockfiles, shared data types, application entry points and final integration. Claude does not edit those files. If teammates also code, agree modules and interfaces first, integrate independent commits or patches, and avoid concurrent edits to the same Dropbox file.

## AI runtime and failures

Validate the real AI path needed by the final demo during the first 30 minutes. Developer subscriptions have been tested, but the application's runtime interface has not yet been built.

- If organizer-provided or existing API access is available, confirm the provider, quota and permitted usage, then test a real input/output pair. Manage keys through the local environment; do not paste them into chat or put them in frontend code.
- Without an API, decide early whether an on-site-permitted local CLI-driven workflow is suitable, and verify real processing for the selected challenge. If the submission requires live AI inside the web application, resolve that runtime requirement rather than substituting a fixed example.
- If Claude temporarily fails, Codex continues independent work using the agreed design and keeps the error evidence. Requests have a timeout; avoid blocking every workstream on the same request.
- Keep saved examples, screenshots and a short recording, clearly distinguishing live generation from saved results. Do not add infrastructure near the deadline.

## Online publication

The empty Vercel project `aibe-hackathon` is connected to `wlxin-nus/AIBE-Hackathon`. Publication is currently disabled by request through `git.deploymentEnabled: false` in `vercel.json`. Commits and pushes still synchronize code. Enable and validate deployment only once publication is authorized, then check the shared site without a signed-in account while retaining the local demo backup.
