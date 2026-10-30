# 赛前准备验收

检查日期：2026-10-30（UTC+8）。**本机工具环境已建立；Claude 真实回答与设计方案的端到端验收仍未通过。**

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
| Opus 5.5 真实回答 | 未通过 | 隔离模式 180 秒内未完成，事件反复报告 `overloaded`；普通模式约 94 秒后返回 `API Error: 529 Overloaded` |
| 带设计技能的方案生成 | 未通过 | 显式传入技能和虚构任务，约 88 秒后返回同样的 529；没有生成有效设计方案 |
| 最终联网预检 | 正确报告未通过 | 项目外目录、新开的 Windows PowerShell 5.1：npm 通过，Claude 约 127 秒后返回 `service_overloaded`；报告 `passed: false` 且退出码为 1 |
| 应用运行时 AI | 按计划延后 | 当前进程未发现常见 API Key；开发工具订阅不作为应用 API 已就绪的证据 |

## 当前阻塞与恢复

已比较普通配置和隔离配置。CLI 可以启动、指定模型可以进入初始化，但上游请求返回 529。该错误是本次请求的服务过载证据，不是认证失败或账号额度不足的证据；[官方状态页](https://status.claude.com/) 查询时未公告当前事故，不能据此推断全局服务状态。

不通过换模型、购买 API、修改全局代理或放宽权限来掩盖这个缺口。待服务恢复，在项目根目录依次重跑：

```powershell
powershell -NoProfile -File .\scripts\preflight.ps1 -Online
powershell -NoProfile -File .\scripts\invoke-claude.ps1 -PromptFile tasks/design-smoke.md -TaskId design-smoke -FrontendDesign
```

第一条必须得到真实的 `CODEX_CLAUDE_OK`，并报告指定模型；第二条必须保存有效的 `response.md`。两条都通过后，才能把双工具协作标为就绪。设计练习始终是虚构演练，不作为正式比赛选题。

## 证据与使用限制

- 每次调用均有唯一输出目录；先看 `outputs/claude/` 下的 `result.json`，再看脱敏事件记录。旧版本诊断可能把 529 归为 `rate_limited`，应以明确的 HTTP 529 和 `overloaded` 文本为准；当前脚本已单列 `service_overloaded`。
- `outputs/diagnostics/` 保存预检报告，`outputs/browser/` 保存浏览器截图、交互记录和停止记录。这些是本机生成材料，未纳入 Git。
- 错误处理测试使用受控子进程和错误事件，不会登出真实账号、修改模型权限或刻意耗尽额度。
- 沙箱内 DNS 和主机浏览器网络存在隔离；联网预检和本机网页应在允许的主机执行环境运行。普通终端成功、沙箱失败时，不据此改动全局网络设置。
- 项目未创建应用脚手架，未安装应用框架、数据库或新增浏览器插件；已有系统工具、账号凭据及工具自身内部存储沿用原位置。
