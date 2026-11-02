# oh-my-pi-agent

我的 [Pi Coding Agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) 个人配置仓库。

将本仓库放到 `~/.pi/agent/` 后，Pi 会读取这里的扩展、Skill、提示词、快捷键和模型设置。

> 这是个人配置，不是一个独立的 Pi 发行版。模型供应商、凭据和本机运行状态不应提交到仓库。

## 快速开始

```bash
git clone git@github.com:lqhl/oh-my-pi-agent.git ~/.pi/agent
```

按下面的 Skills 安装命令准备共享技能和运行依赖，然后运行：

```bash
cd ~/.pi/agent
pi
```

## 内容概览

| 路径 | 用途 |
| --- | --- |
| `extensions/` | 本地 TypeScript 扩展 |
| `agents/` | 本地原生子 Agent 定义 |
| `skills/` | 本仓库自维护及 Pi 专用的 Agent Skills |
| `vendor/pstack/` | 固定版本的完整 pstack 上游包 |
| `~/.agents/skills/` | 由 `npx skills` 管理的通用技能 |
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

当前本机启用的技能按以下方式维护。

| Skill | 来源 | 管理方式 |
| --- | --- | --- |
| `analyze-sessions`、`pdf-reader` | 本仓库维护 | 保留在 `skills/` |
| Pi 专用能力与验证技能 | 本仓库维护 | 保留 Pi 原生工具和加载方式 |
| pstack | [原样上游与 Pi 适配](adapters/pstack/pi.md) | 本仓库固定 v0.15.36，独立维护 |
| `guizang-ppt-skill` | [op7418/guizang-ppt-skill](https://github.com/op7418/guizang-ppt-skill) | `npx skills`，共享目录 |
| 八个宝玉工作流技能 | [JimLiu/baoyu-skills](https://github.com/JimLiu/baoyu-skills) | `npx skills`，共享目录 |
| 五个 baoyu-design 技能 | [JimLiu/baoyu-design](https://github.com/JimLiu/baoyu-design) | `npx skills`，共享目录 |

14 个通用技能安装在 `~/.agents/skills/<name>`。Pi 和 Codex 原生发现共享目录，Claude Code 使用 `~/.claude/skills` 中的链接，dsh 使用自己的共享目录发现。pstack 不进入这个目录。Pi 保留 vendor 与适配层，Claude Code 使用官方插件，dsh 独立维护，Codex 暂不接入 pstack。

在新机器上用以下固定来源恢复通用技能。要求 Node.js 22.20 以上。

```bash
npx --yes skills@1.7.4 add https://github.com/op7418/guizang-ppt-skill/tree/c91369c449d34755d320a8b81d0734000d99d1ab -g \
	--agent pi codex claude-code --skill guizang-ppt-skill --yes
npx --yes skills@1.7.4 add https://github.com/JimLiu/baoyu-skills/tree/1567581c26ec29f4216c6e6835415bf30343b0e3/skills -g \
	--agent pi codex claude-code \
	--skill baoyu-post-to-wechat baoyu-markdown-to-html baoyu-format-markdown \
	baoyu-cover-image baoyu-article-illustrator baoyu-image-gen baoyu-youtube-transcript baoyu-url-to-markdown --yes
npx --yes skills@1.7.4 add https://github.com/JimLiu/baoyu-design/tree/0c257e5e9def6723fdc69a95ec59fc8c414a8282/skills -g \
	--agent pi codex claude-code \
	--skill claude-design claude-slides claude-design-system claude-dashboard dataviz --yes
```

宝玉脚本使用 Bun 与各技能自己的 npm 依赖。在启用 npm 安装脚本白名单的机器上，只为 Bun 放行本次安装，不改全局策略。

```bash
npm install --global bun@1.4.4 --allow-scripts=bun --ignore-scripts=false
npm install --prefix ~/.agents/skills/baoyu-format-markdown/scripts --package-lock=false
npm install --prefix ~/.agents/skills/baoyu-markdown-to-html/scripts --package-lock=false
npm install --prefix ~/.agents/skills/baoyu-post-to-wechat/scripts --package-lock=false
npm install --prefix ~/.agents/skills/baoyu-url-to-markdown/scripts --package-lock=false
```

公众号和图像服务继续使用原有环境变量及 `~/.baoyu-skills` 配置。网页抓取和 Mermaid 渲染还需要可用的 Chrome 或 CDP。安装技能不会自动配置服务凭据。

全局来源记录位于 `~/.agents/.skill-lock.json`。升级时先审阅新 commit 的差异，再用新的固定 ref 重跑对应的 `skills add`。更新受管目录会覆盖文件，不在其中保存本地定制。运行依赖按上面的命令重新准备。Pi pstack 仍使用下面的独立同步入口。

```bash
npx --yes skills@1.7.4 list --global
./scripts/check-enabled-skills.sh
```

检查脚本验证 14 个必要通用技能来自共享目录，检查名称冲突，并保留 pstack 的禁用项与原样上游检查。离线测试可向检查脚本传入临时共享目录，不依赖本机安装。配置打包仍只携带本仓库资源，目标机器用上面的命令恢复通用技能。

本次安装状态、证据与回退材料见[实施记录](docs/skills-multi-harness-implementation.md)。

Skill 可以包含 `references/`、`scripts/` 和 `assets/` 等目录。`SKILL.md` 应保持简洁，把详细资料放入引用文件，并在 frontmatter 中提供准确、具体的 `name` 和 `description`。

> **安全提示：** Skill 可以指导 Agent 执行命令、读写文件或访问外部服务。安装或更新 Skill 前应先审查其内容和依赖。

## npm Packages

`settings.json` 当前配置了以下 package：

- `pi-intercom`：同一台机器上的 Pi 会话间通信
- `pi-subagents`：子 Agent 的单体、链式、并行和异步编排
- `pi-web-access`：网页搜索、内容提取及相关工具
- `@sting8k/pi-vcc`：会话上下文压缩与恢复相关功能
- `pi-goal`：长期目标的持续执行

宝玉及 baoyu-design 技能由 `npx skills` 管理，运行脚本的依赖安装在各技能目录内。

这些 npm package 提供 Pi 扩展和工具，Skill 提供按需加载的工作流与领域知识。

## pstack 日常开发

pstack 上游以固定版本原样保存在 `vendor/pstack/`，由 `adapters/pstack/` 提供 Pi 适配。当前支持 Pi CLI 1.4.0 与 pi-web 内置 SDK 1.2.0。更新上游只运行同步工具并审查来源与适配合同：

```bash
git clone --filter=blob:none https://github.com/cursor/plugins /tmp/pstack-upstream
node scripts/pstack-sync.mjs --from /tmp/pstack-upstream --ref ae5650febf4320793844c12c4adaa937f417f8da
node adapters/pstack/check.mjs
```

Claude Code 的官方插件独立安装，不读取 Pi 的 vendor 或适配层。

```bash
claude plugin marketplace add cursor/plugins --scope user
claude plugin install pstack@cursor-plugins --scope user
```

开关随会话恢复、压缩和分支切换重建，新会话默认关闭。模式只影响当前会话，不启动任务、目标或后台循环。

```text
/pstack on
/pstack status
/pstack off
```

按需入口使用 `/skill:poteto-mode <task>`。父会话和 pstack 子代理都会取得 Pi 适配规则；原始上游 `SKILL.md` 不变。`policy.json` 明确记录未挂载的上游技能、playbook 状态和本地角色。`vendor/bro` 已移除，`bro` 命令由原样上游提供。`control-cli`、`control-ui`、`create-skill` 和 `deslop` 是 `skills/pi-native/` 中的本地能力。

检查命令：

```bash
./scripts/check-enabled-skills.sh
node --test tests/*.test.mjs
python3 -B -m unittest discover -s tests -p 'test_*.py' -v
```

`PSTACK_TEST_SDK_ROOT` 可指定另一个 Pi SDK 安装，以验证 pi-web 的内置版本。项目验证入口为 [.pi/skills/verify-pstack/SKILL.md](.pi/skills/verify-pstack/SKILL.md)。

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
2. 需要独立维护的 Skill 直接纳入本仓库；通用外部技能用 `npx skills` 管理。pstack 是固定版本的原样上游快照，来源与完整性由 `adapters/pstack/upstream.lock.json` 记录，通过 `scripts/pstack-sync.mjs` 更新。不要把带有嵌套 `.git` 的 clone 直接放入仓库。
3. `vendor/` 中的 Skill 必须通过 `settings.json` 白名单加载，不要直接扫描整个上游仓库。
4. 更新通用技能时审阅来源 diff，显式选择新 ref，再运行 `scripts/check-enabled-skills.sh` 和相关脚本验收。
5. 修改扩展、Skill 或 package 配置后，运行 `scripts/check-enabled-skills.sh`，再重启 Pi 或使用 `/reload-runtime` 验证加载结果。本地自动发现的 Skill 同样参与名称和冲突检查。
6. README 中的列表应与实际目录和配置保持一致。
7. 不提交凭据、会话历史、缓存和运行时生成文件。

检查当前仓库状态：

```bash
git status
npx --yes skills@1.7.4 list --global
```

## 许可

MIT
