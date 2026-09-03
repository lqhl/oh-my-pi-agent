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
- `working-indicator`：显示 Agent 工作状态

## Skills

Pi 遵循 Agent Skills 规范：启动时只读取 Skill 的名称和描述，任务匹配后再加载完整的 `SKILL.md`。每个 Skill 都是一个独立目录，入口文件为：

```text
skills/<skill-name>/SKILL.md
```

当前纳入本配置仓库的 Skill：

| Skill | 来源 | 用途 |
| --- | --- | --- |
| `guizang-ppt-skill` | [op7418/guizang-ppt-skill](https://github.com/op7418/guizang-ppt-skill) | 生成单文件、横向翻页的网页 PPT |
| `simplify-codebase` | [tt-a1i/simplify-codebase](https://github.com/tt-a1i/simplify-codebase) | 基于证据审计并减少代码库中的偶然复杂度 |
| Matt Pocock 核心工作流 | [mattpocock/skills](https://github.com/mattpocock/skills) | 通过 `settings.json` 白名单启用规划、规格、实现、TDD、审查和交接等 Skill |
| Ponytail | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) | 仅加载精简实现、复杂度审查、全库审计和债务清单 Skill；不加载 extension |

外部 Skill 使用 Git submodule 管理。`guizang-ppt-skill` 和 `simplify-codebase` 直接位于 `skills/`，由 Pi 自动发现；Matt Pocock 和 Ponytail 的仓库位于 `vendor/`，避免递归加载其中未审核的内容，仅加载 `settings.json` 中明确列出的目录。Ponytail 目前只作为 Skill 使用，不加载它的 Pi extension。

更新前先检查上游变更：

```bash
./scripts/check-mattpocock-skills-update.sh
git diff --submodule
```

确认完整 Skill diff 后，再把 `vendor/mattpocock-skills` 切换到脚本输出的 commit 并提交 submodule 指针。不要直接修改 submodule 内的上游文件；需要定制时，在本仓库中建立独立 Skill。

Skill 可以包含 `references/`、`scripts/` 和 `assets/` 等目录。`SKILL.md` 应保持简洁，把详细资料放入引用文件，并在 frontmatter 中提供准确、具体的 `name` 和 `description`。

> **安全提示：** Skill 可以指导 Agent 执行命令、读写文件或访问外部服务。安装或更新 Skill 前应先审查其内容和依赖。

## npm Packages

`settings.json` 当前配置了以下 package：

- `pi-intercom`：同一台机器上的 Pi 会话间通信
- `pi-subagents`：子 Agent 的单体、链式、并行和异步编排
- `pi-web-access`：网页搜索、内容提取及相关工具
- `@sting8k/pi-vcc`：会话上下文压缩与恢复相关功能

这些 package 与 `skills/` 中的 Skill 是两套不同的机制：package 提供 Pi 扩展和工具，Skill 提供按需加载的工作流与领域知识。

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
  "defaultProvider": "openai-codex",
  "defaultModel": "gpt-5.6-sol",
  "defaultThinkingLevel": "medium"
}
```

快捷键配置位于 `keybindings.json`：

- `Ctrl+J`：在输入框中换行
- `Shift+Enter`：在输入框中换行

凭据和本机状态文件（如 `auth.json`、会话记录、通信 socket、模型缓存）应保持在 `.gitignore` 中，不要提交到远程仓库。

## 维护约定

1. 新增 Skill 时，为它建立独立目录并提供完整 frontmatter。
2. 外部 Skill 使用 submodule；不要把带有嵌套 `.git` 的 clone 直接放入仓库。
3. `vendor/` 中的 Skill 必须通过 `settings.json` 白名单加载，不要直接扫描整个上游仓库。
4. 更新 submodule 后检查 `git diff --submodule` 和 Skill 内容，确认变更来自预期上游。
5. 修改扩展、Skill 或 package 配置后，重启 Pi 或使用 `/reload-runtime` 验证加载结果。
6. README 中的列表应与实际目录和配置保持一致。
7. 不提交凭据、会话历史、缓存和运行时生成文件。

检查当前仓库状态：

```bash
git status
git submodule status
```

## 许可

MIT
