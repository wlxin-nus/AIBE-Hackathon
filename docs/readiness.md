# 赛前准备验收

检查日期：2026-10-30（UTC+8），20:43 复测。**本机工具环境、Opus 5.5 真实回答与带设计技能的方案往返均已通过。应用运行时 AI 仍按计划延后。**

| 项目 | 状态 | 实际证据 |
| --- | --- | --- |
| 项目目录与本地 Git | 已建立 | 项目文件、任务、技能和输出均在根目录内；生成结果与缓存不纳入 Git |
| Node / npm / Git / Claude Code | 通过 | Node 22.14.0、npm 10.9.2、Git 2.45.2、Claude Code 2.1.314；Node 满足已核对的 Vite 要求 |
| Claude 本地认证 | 通过 | 现有 Claude Pro 登录可读取；未复制凭据、未更改登录状态 |
| PowerShell 离线预检 | 通过 | Windows PowerShell 5.1 与 PowerShell 7 新进程均通过；另用系统持久 PATH 复测通过，不依赖 Codex 注入的工具路径 |
| npm 网络与本地缓存 | 通过 | 官方源可达；npm 缓存解析为项目下 `.cache/npm` |
| 浏览器控制 | 通过 | Chrome 访问本机页面并点击按钮，显示 `BROWSER_CONTROL_OK`；截图与记录在 `outputs/browser/` |
| 临时服务清理 | 通过 | 测试标签已关闭；服务停止后不再接受 4173 端口连接 |
| 唯一新增技能 | 安装与完整性通过 | 官方 `frontend-design`，固定提交及 SHA256 见 `skills-lock.json`；实际模型设计输出仍待验证 |
| 调用脚本错误处理 | 通过 | 六项离线测试覆盖标准输入关闭、中文与特殊字符、超时终止、启动失败、认证/模型/限额错误、模型核对、过载恢复及日志脱敏 |
| Opus 5.5 真实回答 | 通过 | 加载用户配置的直接 PowerShell、直接 CMD 标准输入、未修改的原脚本均返回 `CODEX_CLAUDE_OK`，实际模型均报告 `claude-opus-5-5` |
| 带设计技能的方案生成 | 通过 | 原脚本显式传入技能，约 30.5 秒后生成《巡检复核台设计简报》，包含布局、色彩、组件、状态和浏览器验收清单 |
| 最新联网预检 | 通过 | Windows PowerShell 5.1 返回 `passed: true`、退出码 0；npm 与真实模型回答均通过 |
| 应用运行时 AI | 按计划延后 | 当前进程未发现常见 API Key；开发工具订阅不作为应用 API 已就绪的证据 |

## 通讯复测与历史错误

先前普通配置、隔离配置和设计任务都确实返回过 529 或过载重试；这些记录保留为历史证据。20:41–20:43 复测直接 PowerShell、直接 CMD 和原封装均成功。原脚本与账号配置没有为此次恢复作修改，因此现有证据无法把先前失败归因于 Node 封装、Shell 类型或配置差异，也不能确定唯一根因。

当前可继续通过 PowerShell/CMD 使用本机 Claude Code。以后需要复查时，在项目根目录依次运行：

```powershell
powershell -NoProfile -File .\scripts\preflight.ps1 -Online
powershell -NoProfile -File .\scripts\invoke-claude.ps1 -PromptFile tasks/design-smoke.md -TaskId design-smoke -FrontendDesign
```

上述两项本轮均已通过。第一条的真实回答、指定模型和最新通过状态在预检报告中；第二条的有效 `response.md` 在 `outputs/claude/design-smoke-recheck-1793364165386-5cf252f0/`。设计练习始终是虚构演练，不作为正式比赛选题。

直接 PowerShell 与 CMD 的对照记录分别为 `outputs/diagnostics/direct-powershell.json` 和 `outputs/diagnostics/direct-cmd-stdin.json`。早期 CMD 参数引号试验截断过测试文本，该记录不算完整文本传递通过；改为标准输入后完整传递并得到指定回答。

## 证据与使用限制

- 每次调用均有唯一输出目录；先看 `outputs/claude/` 下的 `result.json`，再看脱敏事件记录。旧版本诊断可能把 529 归为 `rate_limited`，应以明确的 HTTP 529 和 `overloaded` 文本为准；当前脚本已单列 `service_overloaded`。
- `outputs/diagnostics/` 保存预检报告，`outputs/browser/` 保存浏览器截图、交互记录和停止记录。这些是本机生成材料，未纳入 Git。
- 错误处理测试使用受控子进程和错误事件，不会登出真实账号、修改模型权限或刻意耗尽额度。
- 沙箱内 DNS 和主机浏览器网络存在隔离；联网预检和本机网页应在允许的主机执行环境运行。普通终端成功、沙箱失败时，不据此改动全局网络设置。
- 项目未创建应用脚手架，未安装应用框架、数据库或新增浏览器插件；已有系统工具、账号凭据及工具自身内部存储沿用原位置。
