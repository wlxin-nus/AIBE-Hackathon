# AIBE-Hackathon · 赛前工具环境

这里只准备开发工具与协作流程。比赛题目公布后再创建应用；默认 React + TypeScript + Vite + npm，本机浏览器演示优先。

## 代码仓库与同步

GitHub 私有仓库：[wlxin-nus/AIBE-Hackathon](https://github.com/wlxin-nus/AIBE-Hackathon)。本地 `main` 跟踪 `origin/main`，已有准备工作提交历史完整保留。本地工作目录继续使用 `hackson_Yuqian`。

后续按可运行或可验证的进度保存提交，再通过 `git push` 同步至 GitHub。`git commit` 保存本地版本，`git push` 上传提交；网站部署在配置 Vercel 项目后另行验证。

2026-10-31 已完成 Vercel 的 GitHub 应用授权，访问范围仅包含 `AIBE-Hackathon`，并创建空项目 [aibe-hackathon](https://vercel.com/xin919523529-7149/aibe-hackathon)，已连接此仓库。目前没有生产部署或预览部署。

按用户“先不发布内容”的要求，`vercel.json` 中 `git.deploymentEnabled` 暂设为 `false`，所有分支的推送均不触发自动部署；commit/push 仍正常同步代码。正式上线获授权后，再确认应用目录、框架、构建与服务端环境变量，启用自动部署并验证首个公开版本。

缓存、诊断输出、本机 Vercel 配置和密钥文件由忽略规则排除。推送前检查本次变更，不提交凭据。

## 快速开始

在此项目根目录打开 PowerShell（Windows PowerShell 5.1 或 PowerShell 7 均可），执行：

```powershell
# 离线预检：版本、认证状态、技能完整性；不调用模型
powershell -NoProfile -File .\scripts\preflight.ps1

# 完整联网预检：还检查 npm 并实际调用 Opus 5.5
powershell -NoProfile -File .\scripts\preflight.ps1 -Online

# 请求界面方案：任务文件必须位于项目内，修改任务内容即可复用
powershell -NoProfile -File .\scripts\invoke-claude.ps1 -PromptFile tasks/design-smoke.md -TaskId design-smoke -FrontendDesign

# 临时网页检查；浏览器打开 http://127.0.0.1:4173，点击按钮，结束后 Ctrl+C
node .\scripts\web-smoke.cjs

# 不消耗模型额度的脚本测试
node --test .\tests\claude-runner.test.cjs
```

若使用 PowerShell 7，可把上面的 `powershell` 替换为 `pwsh`。脚本依据自身位置定位项目，从其他目录调用时，任务相对路径仍相对于项目根目录。

## Claude 调用约定

- 固定模型 `claude-opus-5-5`，默认隔离模式、无工具、无 MCP、无会话保存；由 Codex 保存输出。
- `-FrontendDesign` 显式加入项目内的官方技能内容，隔离模式也可用。项目约束始终显式传入。
- `-TimeoutSec` 范围 1–180，默认 180。脚本关闭标准输入、超时终止子进程，失败返回非零退出码。
- 排查启动配置差异时才加 `-Mode normal`。它会加载现有用户配置和插件，仍禁用模型工具与 MCP；不用于默认设计流程。
- 每次输出到 `outputs/claude/<任务编号>-<唯一编号>/`，包括 `result.json`、脱敏事件和错误日志；有回答时保存 `response.md`。失败时先看 `status`、`error` 和对应日志。
- `success` 必须有完整回答和指定模型的报告；`timeout`、`auth_error`、`model_error`、`service_overloaded`、`rate_limited`、`model_mismatch`、`model_unverified`、`process_error` 均不能算连接成功。`service_overloaded` 表示上游容量问题，区别于账号/请求限额。CLI 启动和本地登录不能代替真实请求验收。
- 原始任务、设计评审资料会按请求发送给 Claude；不要在任务文件里放密钥。账号凭据继续由现有工具管理，不复制到项目。

Codex 沙箱中出现 DNS 失败或本机页面访问超时，而普通 PowerShell 正常时，应在允许的主机网络环境执行这些联网或本机服务检查；不要因此修改全局 DNS、代理或安全设置。

需要绕过统一封装、直接验证 PowerShell 到 Claude Code 的通讯时：

```powershell
Get-Content -LiteralPath .\tasks\ping.md -Raw | claude -p --model claude-opus-5-5 --output-format json --no-session-persistence --tools Read --strict-mcp-config
```

直接调用允许文件读取，禁用写入、命令和 MCP；统一脚本的默认工具列表仍为空，并提供超时和结果归档。2026-10-30 20:43 的直接 PowerShell、CMD、原脚本及完整联网预检均通过，详见验收记录。

## 内容位置与边界

- `tasks/`：可复用任务输入；`docs/`：比赛清单、任务单、技能版本及验收结论。
- `scripts/`：调用、预检与临时网页；`tests/`：关键错误处理的离线验证。
- `.claude/skills/frontend-design/`：唯一新增技能；官方来源和文件 SHA256 见 `docs/skills-lock.json`。
- 新开的 Claude 会话可自动发现此项目技能；当前统一脚本通过显式传入即可使用。Codex 可按需直接阅读该技能，无需再安装一份。
- `outputs/` 与 `.cache/`：生成结果、诊断、下载临时文件和 npm 缓存，均不纳入 Git。
- 系统安装、已有账号凭据和工具自身内部存储继续使用原位置。本次不修改全局配置，不购买 API，不配置云部署，不预装应用框架。

先阅读 `docs/readiness.md` 的实际验收结论，再使用 `docs/challenge-template.md` 与 `docs/competition-day.md` 现场开工。

官方参考：[Claude 非交互调用](https://code.claude.com/docs/en/headless)、[CLI 参数](https://code.claude.com/docs/en/cli-reference)、[frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design)、[Vite 环境要求](https://vite.dev/guide/)。
