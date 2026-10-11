# oh-my-pi-agent

我的 [Pi Coding Agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) 个人配置仓库。

将本仓库放到 `~/.pi/agent/` 后，Pi 会读取这里的扩展、Skill、提示词、快捷键和模型设置。

> 这是个人配置，不是一个独立的 Pi 发行版。模型供应商、凭据和本机运行状态不应提交到仓库。

## 快速开始

```bash
git clone --recurse-submodules git@github.com:lqhl/oh-my-pi-agent.git ~/.pi/agent
```

如果已经克隆了仓库：

```bash
cd ~/.pi/agent
git submodule update --init --recursive
```

然后直接运行：

```bash
pi
```

## 内容概览

| 路径 | 用途 |
| --- | --- |
| `extensions/` | 本地 TypeScript 扩展 |
| `agents/` | 本地原生子 Agent 定义 |
| `skills/` | 本地及直接挂载的 Agent Skills |
| `vendor/` | 由 `settings.json` 白名单加载的外部 Skill 仓库 |
| `prompts/` | 可复用的工作流提示词 |
| `settings.json` | Pi、模型和 npm package 配置 |
| `keybindings.json` | TUI 快捷键 |
| `sessions/` | 本机会话记录，不纳入版本控制 |

## 扩展

`extensions/` 中的扩展由 Pi 自动加载，目前包括：

- `handoff`：将当前会话交接给新的专注会话
- `inline-bash`：在对话中显示 Bash 命令输出
- `interactive-shell`：在 TUI 中运行交互式命令
- `notify`：任务完成或等待输入时发送桌面通知
- `qna`、`questionnaire`：向用户提问的交互组件
- `reload-runtime`：热重载扩展、Skill、提示词和主题
- `status-line`：显示持久化状态栏
- `summarize`：对较长工具输出生成摘要
- `todo`：管理持久化待办事项
- `pstack-mode`：通过 `/pstack on|off|status` 在当前会话分支持续启用 pstack 工程流程
- `working-indicator`：显示 Agent 工作状态

## Skills

Pi 遵循 Agent Skills 规范：启动时只读取 Skill 的名称和描述，任务匹配后再加载完整的 `SKILL.md`。每个 Skill 都是一个独立目录，入口文件为：

```text
skills/<skill-name>/SKILL.md
```

当前纳入本配置仓库的 Skill：

| Skill | 来源 | 用途 |
| --- | --- | --- |
| `analyze-sessions` | 本仓库维护 | 分析 Pi 历史会话和使用成本 |
| `pdf-reader` | 本仓库维护 | 结合文字提取与页面渲染阅读 PDF |
| pstack | [本地 Pi 适配](skills/pstack/README.md) | 50 个工程流程、验证、写作与原则 Skill，直接拷贝并独立维护 |
| `guizang-ppt-skill` | [op7418/guizang-ppt-skill](https://github.com/op7418/guizang-ppt-skill) | 生成单文件、横向翻页的网页 PPT |
| bro | [backnotprop/bro](https://github.com/backnotprop/bro) | 加载 6 个对齐、回顾、状态和独立判断 Skill |
| 宝玉公众号及素材工作流 | [JimLiu/baoyu-skills](https://github.com/JimLiu/baoyu-skills) | 加载 8 个公众号发布、排版、配图和素材抓取 Skill |

小而需要自行修改的 Skill 直接保存在 `skills/`，随本仓库维护；较大的上游仓库使用 Git submodule 固定版本。`guizang-ppt-skill` 直接位于 `skills/`，由 Pi 自动发现；bro 和宝玉的仓库位于 `vendor/`，仅加载 `settings.json` 中明确列出的 Skill 目录。

宝玉当前启用 `baoyu-post-to-wechat`、`baoyu-markdown-to-html`、`baoyu-format-markdown`、`baoyu-cover-image`、`baoyu-article-illustrator`、`baoyu-image-gen`、`baoyu-youtube-transcript` 和 `baoyu-url-to-markdown`。YouTube 字幕统一使用宝玉版本。

公众号发布脚本内部处理 Markdown 转换；`baoyu-markdown-to-html` 用于单独预览排版。宝玉的 Node 依赖在新检出后需要自行安装，不纳入版本控制。安装时不写锁文件，保持 submodule 工作树干净：

```bash
npm install --prefix vendor/baoyu-skills --package-lock=false
npm install --prefix vendor/baoyu-skills/skills/baoyu-post-to-wechat/scripts --package-lock=false
```

外部 Skill 更新前先检查上游变更：

```bash
./scripts/check-vendor-updates.sh
./scripts/check-enabled-skills.sh
git diff --submodule
```

`check-vendor-updates.sh` 默认检查 `.gitmodules` 中的所有 submodule，也可以指定一个或多个路径：

```bash
./scripts/check-vendor-updates.sh vendor/bro vendor/baoyu-skills
```

脚本只 fetch、比较并显示审查命令，不会自动切换 submodule。确认完整 Skill diff 后，再手动切换到目标 commit 并提交 submodule 指针。不要直接修改 submodule 内的上游文件；需要定制时，在本仓库中建立独立 Skill。

Skill 可以包含 `references/`、`scripts/` 和 `assets/` 等目录。`SKILL.md` 应保持简洁，把详细资料放入引用文件，并在 frontmatter 中提供准确、具体的 `name` 和 `description`。

> **安全提示：** Skill 可以指导 Agent 执行命令、读写文件或访问外部服务。安装或更新 Skill 前应先审查其内容和依赖。

## npm Packages

`settings.json` 当前配置了以下 package：

- `pi-intercom`：同一台机器上的 Pi 会话间通信
- `pi-subagents`：子 Agent 的单体、链式、并行和异步编排
- `pi-web-access`：网页搜索、内容提取及相关工具
- `@sting8k/pi-vcc`：会话上下文压缩与恢复相关功能
- `pi-goal`：长期目标的持续执行

宝玉 Skill 通过 `vendor/baoyu-skills` submodule 和 `skills` 白名单加载。

这些 npm package 提供 Pi 扩展和工具，Skill 提供按需加载的工作流与领域知识。

## pstack 日常开发

新增文件位于 `skills/pstack/`、`agents/` 和 `extensions/pstack-mode.ts`，没有新增 submodule。重启 Pi 或运行 `/reload-runtime` 后可以使用：

```text
/skill:poteto-mode 修复这个 bug。先复现，再运行同一个触发路径验证修复。
```

用 `/pstack on` 在当前会话持续启用，用 `/pstack off` 关闭，用 `/pstack status` 查看状态。开关随会话恢复、压缩和分支切换重建，新会话默认关闭。新建项目 skill 用 `/skill:create-skill`；生成真实项目验证流程用 `/skill:create-verification-skill`。

用 `/skill:ketchup` 汇总当前聊天中你上次发言后的进展和待决事项。用 `/skill:recall <主题与时间范围>` 查询同一项目的历史会话，并核对 Git、PR 的现状。两者都是只读流程。

实现和审查复用 `pi-subagents` 原生能力。两个本地角色是 `poteto-agent` 和只读 `comment-sicko`。编码默认继承当前模型，判断角色通过 `subagents.agentOverrides` 配置。显式请求双模型审查或并行工作时，使用不同模型家族的独立上下文或隔离 worktree，并检查真实结果和证据。

日常 playbook、委派边界、模型配置、验证要求与来源许可见 [pstack 使用说明](skills/pstack/README.md)。本版不包含 Slack、Linear、Sentry 或 cloud agent。

检查本地技能与模式扩展：

```bash
./scripts/check-enabled-skills.sh
node --test tests/*.test.mjs
```

`check-enabled-skills.sh` 同时检查全局 `skills/` 和本仓库 `.pi/skills/` 的自动发现内容。项目验证入口为 [.pi/skills/verify-pstack/SKILL.md](.pi/skills/verify-pstack/SKILL.md)，在本仓库启动 Pi 且信任项目资源时可用 `/skill:verify-pstack`。

## 提示词工作流

`prompts/` 中提供可复用的多 Agent 工作流：

| 文件 | 流程 |
| --- | --- |
| `scout-and-plan.md` | 侦察代码库并形成计划，不直接实现 |
| `implement.md` | 在隔离上下文中执行实现 |
| `implement-and-review.md` | 实现 → 审查 → 根据反馈修正 |

## 配置

模型和 package 配置位于 `settings.json`。当前默认配置为：

```json
{
  "defaultProvider": "magpie",
  "defaultModel": "codex/gpt-6.1-sol",
  "defaultThinkingLevel": "medium"
}
```

快捷键配置位于 `keybindings.json`：

- `Ctrl+J`：在输入框中换行
- `Shift+Enter`：在输入框中换行

凭据和本机状态文件（如 `auth.json`、会话记录、通信 socket、模型缓存）应保持在 `.gitignore` 中，不要提交到远程仓库。

## 维护约定

1. 新增 Skill 时，为它建立独立目录并提供完整 frontmatter。
2. 需要独立维护的 Skill 直接纳入本仓库；外部仓库可以使用 submodule。pstack 是记录来源与许可的本地快照，不跟踪上游。不要把带有嵌套 `.git` 的 clone 直接放入仓库。
3. `vendor/` 中的 Skill 必须通过 `settings.json` 白名单加载，不要直接扫描整个上游仓库。
4. 更新 submodule 后运行 `scripts/check-vendor-updates.sh`、`scripts/check-enabled-skills.sh`，再检查 `git diff --submodule` 和 Skill 内容，确认变更来自预期上游。
5. 修改扩展、Skill 或 package 配置后，运行 `scripts/check-enabled-skills.sh`，再重启 Pi 或使用 `/reload-runtime` 验证加载结果。本地自动发现的 Skill 同样参与名称和冲突检查。
6. README 中的列表应与实际目录和配置保持一致。
7. 不提交凭据、会话历史、缓存和运行时生成文件。

检查当前仓库状态：

```bash
git status
git submodule status
```

## 许可

MIT
