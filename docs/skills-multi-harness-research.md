# 多宿主技能管理与 pstack 升级调研

通用技能由 Vercel 的 `npx skills` 管理，共享安装目录为 `~/.agents/skills`。pstack 按宿主独立维护。Pi 保留本配置仓库的 vendor、适配层、模式扩展和原生角色，dsh 保留自己的 dsh-pstack 包装。Claude Code 使用官方 pstack 插件，Codex 暂不接入 pstack。各宿主可以分别升级和回滚，不要求 pstack 版本同步。

本报告保留实施前的研究结论与隔离实验。共享技能、Pi pstack 和 Claude Code 官方插件现已实施，当前状态见[实施记录](skills-multi-harness-implementation.md)。dsh-pstack 按用户后续指示退出本轮，由其自身维护。前期隔离实验保存在 [/tmp/skills-multi-harness-lub9xD](/tmp/skills-multi-harness-lub9xD)。

本次核对的来源固定如下，后续实施应重新检查上游是否变化。

| 来源 | 本次版本 | 本次 Git commit |
| --- | --- | --- |
| Vercel `skills` CLI | npm 1.7.4 | 源码 main 为 `92a9a34ac3bf88e695e468b90c7bf32f163d32c8`，实际安装实验使用 npm 发布包 |
| `cursor/plugins` 中的 pstack | 0.15.36 | `ae5650febf4320793844c12c4adaa937f417f8da` |
| `JimLiu/baoyu-design` | 2.6.1 | `0c257e5e9def6723fdc69a95ec59fc8c414a8282` |

你提到的命令应写作 `npx skills`，使用复数。实际 npm 发布包要求 Node.js 22.20 以上，本机 Node.js 为 26.0.0，满足要求。CLI 提供安装、列举、更新和移除。它管理技能文件及来源记录，不能代替宿主的扩展或插件管理器。依据是 [CLI 官方说明](https://github.com/vercel-labs/skills/blob/92a9a34ac3bf88e695e468b90c7bf32f163d32c8/README.md)、[安装器源码](https://github.com/vercel-labs/skills/blob/92a9a34ac3bf88e695e468b90c7bf32f163d32c8/src/installer.ts) 和 [本机发布包帮助输出](/tmp/skills-multi-harness-lub9xD/evidence/cli-help.log)。

四个宿主可以采用以下接入方式。默认路径已由本机 Pi 文档、dsh 已安装源码、CLI 安装器和 Codex 官方说明核对。

| 宿主 | 普通技能的个人目录 | `skills` CLI 的接入方式 | 本次验证范围 |
| --- | --- | --- | --- |
| Pi | `~/.agents/skills`，也支持原来的 `~/.pi/agent/skills` 和显式配置路径 | `--agent pi`，直接使用共享目录 | 实际 Pi SDK 1.4.0 和 pi-web SDK 1.2.0 均发现两个实验技能，诊断为空 |
| Codex CLI | `~/.agents/skills` | `--agent codex`，直接使用共享目录 | 官方文档确认目录与软链接支持，没有启动模型会话 |
| Claude Code | `~/.claude/skills` | `--agent claude-code`，默认给每个技能建立指向共享副本的链接 | 实际安装创建链接，链接目标已核对，没有启动 Claude 会话 |
| DeepSeek harness | `~/.dsh/skills` 和 `~/.agents/skills` | 当前没有 `dsh` agent 名称，依靠原生共享目录发现 | 实际 0.2.1-rc.5 文件系统 provider 发现并加载两个实验技能，诊断为空 |

项目目录也有对应的 `.agents/skills`。Pi 和 Codex 会沿工作目录向仓库根查找。当前 dsh 查找最近的 `.git` 根，再扫描该根目录的 `.agents/skills`，无 Git 根时使用当前目录。因此个人共用适合全局目录，团队项目共用适合仓库根目录。dsh 的扫描只有一层，目录应为 `<root>/<skill-name>/SKILL.md`，不要再套一层仓库名。依据是 [Pi 技能文档](/home/linuxbrew/.linuxbrew/lib/node_modules/@agegr/pi-web/node_modules/@earendil-works/pi-coding-agent/docs/skills.md)、[dsh 文件系统 provider 文档](/home/linuxbrew/.linuxbrew/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-skill-filesystem/README.md) 和 [Codex 官方技能说明](https://developers.openai.com/codex/skills)。

`skills` 默认先把一个技能目录复制到共享位置，再向需要专用目录的宿主建链接。它会携带该技能目录内的 references、scripts 和 assets。它不会自动携带技能目录外的整个仓库、适配层或插件定义。已有同名安装需要先确定所有者，不能直接覆盖。默认安装器会重建目标目录，手工修改不适合放在它管理的副本里。

调研时 Pi 由 [settings.json](../settings.json) 显式挂载 pstack 和八个 baoyu-skills 技能。当时全局 `skills list` 未列出这些 vendor 技能，说明 CLI 不会读取 Pi 配置后自动接管来源和更新。实施时已显式迁移通用技能并移除旧挂载。项目来源记录位于 `skills-lock.json`，全局记录默认位于 `~/.agents/.skill-lock.json`，设置 `XDG_STATE_HOME` 时全局记录改放该状态目录。当前恢复项目安装的 `experimental_install` 仍是实验命令，来源记录还应配合版本化配置和备份。

对现有内容，建议按技能分别决定来源、版本、更新工具和使用宿主。每个技能保留一个更新入口。

| 当前内容 | 建议管理方式 | 原因 |
| --- | --- | --- |
| 新增 baoyu-design 的五个普通技能 | `skills` CLI | 每个技能自带本地运行文件，适合多宿主共用 |
| 已有八个 baoyu-skills 技能 | 先保留现有 submodule，再逐批迁到 CLI | 必须先验证脚本依赖、配置和常用调用，避免同名副本同时加载 |
| `guizang-ppt-skill` | 可在运行验收后迁到 CLI | 它是独立外部技能，迁移可以与 pstack 分开 |
| 本地 `pdf-reader` 等自维护技能 | 继续由本仓库维护，按需向其他宿主提供链接 | 无需为本地修改增加复制与更新流程 |
| `skills/pi-native`、verify-pstack 以及 Pi npm packages | 保留 Pi 原生管理方式 | 它们包含 Pi 的工具、检查或宿主契约 |
| pstack | Pi、dsh 各自维护完整上游包与适配；Claude Code 用官方插件；Codex 暂不接入 | 各宿主独立升级与回滚，沿用现有安装和验证方式 |

现有宝玉排版和公众号技能的脚本使用 `baoyu-md`、`baoyu-chrome-cdp` 等 npm 依赖，部分技能内部带有 `scripts/package.json`。迁移时需要按其说明准备运行依赖。`skills add` 本身不等于完成这些环境准备。这里没有发现足够证据要求重写这些技能，因此建议先验证现有脚本，再决定切换。当前依赖可见 [公众号脚本包](https://github.com/JimLiu/baoyu-skills/blob/1567581c26ec29f4216c6e6835415bf30343b0e3/skills/baoyu-post-to-wechat/scripts/package.json) 和 [Markdown 排版脚本包](https://github.com/JimLiu/baoyu-skills/blob/1567581c26ec29f4216c6e6835415bf30343b0e3/skills/baoyu-markdown-to-html/scripts/package.json)。

三种整体路线的取舍如下。

| 路线 | 收益 | 代价 | 判断 |
| --- | --- | --- | --- |
| 全部交给 `skills` CLI | 普通技能的安装和更新入口统一 | 不能安装 Pi pstack 扩展、策略和原生角色，也不能安装 dsh 的交互插件 | 不适合当前配置整体替换 |
| 所有仓库继续 vendor，再给各宿主建链接 | 可以固定完整仓库并保留相邻文件 | 持续维护链接、来源和更新检查 | 适合 pstack 这类需要完整包装的内容 |
| 普通技能交给 CLI，宿主工作流保留原生包装 | 新增技能可以共用，现有适配可以独立升级 | 需要明确每个技能的更新入口 | 推荐 |

pstack 按宿主保留以下位置和更新方式。

| 宿主 | 来源与安装位置 | 更新方式 |
| --- | --- | --- |
| Pi | 本配置仓库的 `vendor/pstack` 与 `adapters/pstack` | 使用现有 `scripts/pstack-sync.mjs` 固定 commit，并运行 Pi 自身的验收 |
| dsh | `/home/qliu/workspace/dsh-pstack` 的 vendor、adapter 与 preset，现有 `~/.dsh/pstack` 和技能链接 | 使用该仓库的同步、安装与验收流程 |
| Claude Code | 官方 marketplace 的 `pstack@cursor-plugins` | 使用 Claude Code 插件管理器 |
| Codex | 暂不安装 pstack | 无需新增适配或禁用清单 |

普通技能共享目录中不安装 pstack 各叶子技能。这样 Codex 可以取得宝玉和其他通用技能，并保持暂不接入 pstack 的状态。Pi 自己的禁用项继续留在原生配置中。

各宿主使用自己的来源记录、适配检查和升级结果。某一宿主的适配未通过时，只阻塞该宿主的升级。没有跨宿主同步器，也不要求在一次升级中修改多个宿主。Claude Code 官方插件继续管理自己的生成版本。

当前 Pi 的 bootstrap、模式扩展、同步器和打包器都使用本仓库的 vendor 路径，dsh 的安装与检查也使用其自身的 vendor。保留独立来源后，这些路径和安装归属继续有效。实施范围集中在版本更新、适配语义与普通技能迁移。

调研基线中 Pi pstack 为 v0.15.32，dsh 的独立包装为 v0.15.30。Pi 当前来源见 [upstream.lock.json](../adapters/pstack/upstream.lock.json)。dsh 的来源和升级由其自身维护，参见 [dsh vendor/UPSTREAM](/home/qliu/workspace/dsh-pstack/vendor/UPSTREAM)。两者保留各自的 vendor 与适配。

本次对 pstack v0.15.36 执行了现有同步器的只读预检。

```bash
node scripts/pstack-sync.mjs \
	--from /tmp/skills-multi-harness-lub9xD/plugins \
	--ref ae5650febf4320793844c12c4adaa937f417f8da \
	--dry-run
```

预检输出为 `would sync pstack 0.15.36: 573 files at ae5650febf4320793844c12c4adaa937f417f8da`。这证明当前来源和策略覆盖检查接受该快照，不证明新工作流已经在 Pi 执行通过。[预检日志](/tmp/skills-multi-harness-lub9xD/evidence/pstack-sync-dry-run.log) 保留了结果。

本次审阅发现以下需要处理的语义变化。

- 新版 `interrogate` 借用 arena 的隔离工作区，让 adversary 实际运行测试或复现，只保留运行证明的发现。旧版的四份 review references 已删除。当前 Pi 的 [pstack-reviewer](../agents/pstack-reviewer.md) 禁止 shell 和写入，无法直接承担这种执行角色。升级时应明确使用隔离执行角色做复现、只读角色审阅证据，或把未实现部分明确标为不支持。委派仍需既有授权。
- `arena` 修改了模型拒绝后的补位规则和异族评判规则。Pi 适配层应继续验证实际 provider、model 和家族。用同族模型补位不能报告为跨家族审查。
- `poteto-mode` 增加任务目标表述要求，并调整模型拒绝和后台执行说明。Pi 应继续遵守原生运行失败处理规则。
- `orchestrate` 移除了旧的 orch 程序。`statechart` 有较大实现重写。当前 Pi 已把相关能力标为不支持或禁用，可以更新原样快照并保留准确的支持边界，不能随快照更新宣称这些流程已可用。

这些变化可在 [新版 interrogate](https://github.com/cursor/plugins/blob/ae5650febf4320793844c12c4adaa937f417f8da/pstack/skills/interrogate/SKILL.md)、[新版 arena](https://github.com/cursor/plugins/blob/ae5650febf4320793844c12c4adaa937f417f8da/pstack/skills/arena/SKILL.md) 和 [当前 Pi 策略](../adapters/pstack/policy.json) 交叉核对。

Claude Code 已有官方 pstack 安装路线。

```text
/plugin marketplace add cursor/plugins
/plugin install pstack@cursor-plugins
```

官方 marketplace 指向生成的 `harness/pstack/claude-code`，其中的 poteto-mode 会先加载 Claude Code adapter，也包含命名空间和 agent 定义。这比单独复制原始 SKILL 文件完整。已有插件可用 `claude plugin update pstack@cursor-plugins` 更新。依据是 [上游 README](https://github.com/cursor/plugins/blob/ae5650febf4320793844c12c4adaa937f417f8da/pstack/README.md) 和 [marketplace 定义](https://github.com/cursor/plugins/blob/ae5650febf4320793844c12c4adaa937f417f8da/.claude-plugin/marketplace.json)。

本次上游 `pstack/docs/harness` 中只发现 Claude Code adapter。Codex 若要运行完整 pstack，还需要与其原生工具和模型配置匹配的适配。不能直接使用 Pi adapter，也不应通过共享目录默认启用完整原始工作流。

baoyu-design 当前不是旧的单一技能。原来的 `baoyu-design` 位于 `archive/baoyu-design`。当前发布内容如下，依据是 [本次固定版本的 README](https://github.com/JimLiu/baoyu-design/blob/0c257e5e9def6723fdc69a95ec59fc8c414a8282/README.md)。

| 技能 | 产物 |
| --- | --- |
| `claude-design` | `canvas.json` 和 `.dc.html` 画板，本地画布编辑器 |
| `claude-slides` | `deck.json` 和各页 HTML，可编辑演示稿及导出 |
| `claude-design-system` | 设计 token、品牌文档和组件预览 |
| `claude-dashboard` | 基于 CSV、TSV 或 JSON 数据的交互仪表盘 |
| `dataviz` | 图表选择、配色、交互与可访问性指导，附配色校验程序 |

四个编辑器技能自带预构建脚本，主要通过 Node.js 运行 `scripts/artifact.mjs`。上游推荐 Opus 5.5，但名称中的 Claude 不要求宿主使用 Claude 模型。本次验证了安装与发现，没有评估 DeepSeek、GPT 或 Claude 生成设计的质量。旧的单 HTML 原型技能如需使用，应单独审阅归档版本，不能把它与新的画布格式混为一谈。

调研阶段的安装示例如下。实际恢复命令与固定 ref 见 [README](../README.md)。

```bash
npx --yes skills@1.7.4 add https://github.com/JimLiu/baoyu-design/tree/0c257e5e9def6723fdc69a95ec59fc8c414a8282/skills -g \
	--agent pi codex claude-code \
	--skill claude-design claude-slides claude-design-system claude-dashboard dataviz
```

dsh 通过自身对 `~/.agents/skills` 的扫描取得这些技能，不需要向命令添加不存在的 `--agent dsh`。若需要精确复现本次来源，可把仓库参数换为 `https://github.com/JimLiu/baoyu-design/tree/0c257e5e9def6723fdc69a95ec59fc8c414a8282/skills`，并检查安装记录中的 ref。固定 ref 后，切换到新版本也应显式选择新 ref。

baoyu-design 另有四个 dsh 原生插件，分别为 `dsh-claude-design`、`dsh-claude-slides`、`dsh-claude-design-system` 和 `dsh-claude-dashboard`。插件增加编辑器评论触发 agent、聊天卡片和侧栏等交互。npm 当前 `dsh-claude-design` 为 2.6.1，声明 dsh 至少 0.2.0 预发布版本，本机 0.2.1-rc.5 满足声明的版本范围。版本范围满足不代表交互已验收。

如果主要在 dsh 内协作编辑设计，可以选择这条路线。例如向 `web` profile 安装的命令是 `dsh plugin --profile web add dsh-claude-design@2.6.1`。普通共享 SKILL 更适合先统一四个宿主。选择原生插件时应另行核对同名文件系统技能的优先级，上游明确说明项目内的同名技能会覆盖插件版本。不要同时给一个技能保留两个独立更新入口。依据是 [dsh 插件说明](https://github.com/JimLiu/baoyu-design/blob/0c257e5e9def6723fdc69a95ec59fc8c414a8282/dsh-plugins/README.md)。

该仓库的 [NOTICE](https://github.com/JimLiu/baoyu-design/blob/0c257e5e9def6723fdc69a95ec59fc8c414a8282/NOTICE.md) 明确区分维护者的 MIT 代码、未授予 MIT 许可的 Anthropic 材料和第三方代码。因此本配置可以记录安装来源，不能把整套内容标成 MIT 再打包分发。

具体执行范围、通过条件和回退方式见[执行计划](skills-multi-harness-plan.md)与[实施记录](skills-multi-harness-implementation.md)。本轮完成普通技能迁移、Pi pstack 升级和 Claude Code 官方插件安装。dsh-pstack 由用户另行维护。

调研阶段已经完成的实验均与生产配置隔离。

- `skills@1.7.4` 从固定上游的本地 checkout 安装 `claude-design` 和 `dataviz` 到临时项目，选择 Pi、Codex 和 Claude Code。安装日志见 [cli-install.log](/tmp/skills-multi-harness-lub9xD/evidence/cli-install.log)。
- 两个安装目录分别与上游技能目录执行 `git diff --no-index --exit-code`，退出码均为 0。Claude Code 的两个链接均指向共享副本。
- [发现验证程序](/tmp/skills-multi-harness-lub9xD/probe-discovery.mjs) 调用了实际 Pi SDK 1.4.0、1.2.0，以及实际 dsh 文件系统 provider。三个检查均发现预期的两个技能，没有诊断。dsh 还成功读取正文和资源目录。结果见 [discovery.json](/tmp/skills-multi-harness-lub9xD/evidence/discovery.json)。dsh 检查使用了最小宿主上下文和关闭 watcher 的 provider，没有启动完整 dsh 会话。
- pstack 的 `--dry-run` 通过。没有切换当前 vendor 快照，没有运行升级后的完整验收。

调研阶段没有进行真实设计生成、浏览器编辑、完整 Claude 或 Codex 会话、dsh 插件评论唤醒和独立模型审查。实施阶段的检查与未验证范围另见实施记录。

[Laziness Protocol](../vendor/pstack/skills/principle-laziness-protocol/SKILL.md) 促成了普通技能共用默认目录、pstack 沿用各宿主现有结构的选择。[Model the Domain](../vendor/pstack/skills/principle-model-the-domain/SKILL.md) 促成了按技能记录来源、更新工具和消费者的划分。[Prove It Works](../vendor/pstack/skills/principle-prove-it-works/SKILL.md) 促成了实际安装与 loader 验证，并把预检、加载和真实交互分别报告。[Sequence Work into Verifiable Units](../vendor/pstack/skills/principle-sequence-verifiable-units/SKILL.md) 促成了按批次和宿主独立验收的执行计划。
