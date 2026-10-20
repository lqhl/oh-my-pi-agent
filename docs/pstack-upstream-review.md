# pstack 上游改动调研

调研日期为 2026-10-19。本文说明上次 Pi 适配之后的上游变化，以及这些变化对本仓库的意义。实施步骤见 [更新计划](pstack-update-plan.md)。调研阶段交付了本文和计划。后续的适配结果见 [实施验收记录](pstack-update-verification.md)。本文的数量和版本比较保留调研时的基线。

## 比较范围

来源记录见 [当前适配说明](../skills/pstack/README.md)。比较使用固定 commit，没有用日期推算基线。

| 对象 | 固定版本 | 依据 |
| --- | --- | --- |
| 首次 Pi 适配 | 本仓库 `2255b05`，2026-10-11 | 首次引入 `skills/pstack/`、原生角色、模式扩展和验证。 |
| 主体上游基线 | `d73344bee8cf22e53b9d5f4cf5749d38ba38c174`，v0.15.15 | 本地 README 记录的来源。 |
| 后补的 ketchup | 本仓库 `10860be`，上游 `978ca6e9c0e012047cd5058b8e829240336e704e` | ketchup 已经适配。recall 使用原始快照的内容，并改查 Pi 会话。 |
| 当前本仓库 HEAD | `bb47f881642971804b2bcc36dce1c5add5ec915c` | 本次调查时的 `git rev-parse HEAD`。 |
| 本次审查终点 | 上游 `d457567332aa6989e753ea289f30ea2bfbc80bc0`，v0.15.28 | 调查开始时上游 `main` 和插件 manifest。 |

[可重跑的清单脚本](pstack-upstream-audit.py) 和 [生成结果](pstack-upstream-audit.json) 记录了逐技能的来源、blob ID、变化文件和提交。脚本只读取两个 checkout。ketchup 按后补的基线比较，control-cli、control-ui、deslop 按 cursor-team-kit 的来源比较。

清单得到以下结果。

- `pstack/` 和 `cursor-team-kit/` 范围内有 45 个相关提交，110 个文件变化，其中 102 个修改，8 个新增。这不是整个 cursor/plugins 仓库的变化总量。
- 当前 50 个本地 pstack 技能中，35 个对应的上游目录发生变化。其中 17 个是原则技能。目录有变化不代表本地缺少该目录的所有改进。
- 上游 pstack 技能从 51 个增加到 56 个。新增的 5 个中，ketchup 已经在本仓库，所以实际缺少 4 个。
- cursor-team-kit 在这个范围内没有变化。Pi 自建的 create-skill 也没有对应的上游 pstack 来源。
- 11 个本地 `SKILL.md` 与终点上游内容相同。其余差异包括必要的 Pi 改写，不能按缺陷计数。

## 最值得同步的是判断依据

[PR 633](https://github.com/cursor/plugins/pull/633) 明确说明，旧版的四个原则把特定场景的解法写成了通用禁令。新版改成了判断依据。

| 原则 | 新版改变 | 对 Pi 使用者的意义 |
| --- | --- | --- |
| Test Behavior, Not Implementation | 用“行为损坏时测试失败”和“内部重构时测试仍通过”判断测试。外部服务未被调用、空结果和状态码也可能是行为合同。 | 降低误删有效合同测试的风险。 |
| Fix Root Causes | 判断触发故障的状态是否合法。合法状态未被处理时，guard 可以是根因修复。 | 避免把所有边界处理都当成掩盖症状。 |
| Attack the Premise | 写下假设，找一个能区分假设真假的观察，再决定下一步。 | 不再把所有重复失败都套进“按 actor 统计失衡”的场景。 |
| Make Operations Idempotent | 从现有状态收敛，使用跨崩溃位置仍成立的证据判断遗留状态。 | 不再把 PID 检测当成跨容器、跨机器都成立的通用锁恢复方案。 |

[PR 604](https://github.com/cursor/plugins/pull/604) 还要求在深挖之后提出一个便宜、常驻的观测信号，让决定性事实下次更早可见。它要求提出建议，没有自动扩展实现范围。

这些变化适合优先移植。本地 poteto-mode 的原则摘要仍保留旧措辞，必须与叶子一起更新。

## 精简文本需要逐项判断

[PR 538](https://github.com/cursor/plugins/pull/538)、[PR 571](https://github.com/cursor/plugins/pull/571) 和 [PR 634](https://github.com/cursor/plugins/pull/634) 压缩了 how、why、arena、interrogate、写作规则、benchmark-checklist 和多个原则。PR 634 的作者说明其依据是所做评估。本文没有复跑这些评估，也不据此声称 Pi 的效果或速度会改善。

有些删除对本适配存在具体风险。终点的 [Exhaust the Design Space](https://github.com/cursor/plugins/blob/d457567332aa6989e753ea289f30ea2bfbc80bc0/pstack/skills/principle-exhaust-the-design-space/SKILL.md) 正文只剩一句补充适用范围。主要指令留在 description 中。终点的 [Encode Lessons in Structure](https://github.com/cursor/plugins/blob/d457567332aa6989e753ea289f30ea2bfbc80bc0/pstack/skills/principle-encode-lessons-in-structure/SKILL.md) 也把主体解释压到了 description。

Pi 的 [skills 文档](/home/linuxbrew/.linuxbrew/lib/node_modules/@agegr/pi-web/node_modules/@earendil-works/pi-coding-agent/docs/skills.md) 说明，`disable-model-invocation: true` 的技能不参与自动模型选择。本地 poteto-agent 还设置了 `inheritSkills: false`，按路径读取叶子。直接读取完整文件仍能看到 frontmatter，所以这不是已证实的加载回归。保留可独立理解的正文，是减少阅读上下文依赖的适配判断。

建议吸收重复段落的删除，保留独立阅读所需的核心句子。不以字数或 token 缩减作为更新的验收目标。

## 验证流程补上了真实可用条件

[PR 573](https://github.com/cursor/plugins/pull/573) 改进 create-verification-skill。

- 应用必须从空数据目录进入可使用状态，包括迁移和种子数据。端口能连接不够。
- 种子数据不满足用户旅程时，报告失败及原因，不能弱化旅程。
- 在替代环境中验证时，列出替代环境额外提供的准备步骤。真实目标没有执行过的步骤仍未验证。

这些变化可以保留 `.pi/skills/verify-<app>/`、本地 control 技能和证据保留规则后直接移植。

[PR 700](https://github.com/cursor/plugins/pull/700) 修正了 TypeScript 品牌类型示例。`parseAgentId` 通过 `isAgentId` 类型守卫缩窄后返回，替代示例中的 `as AgentId`。本地仍有旧示例，适合同步。

benchmark-checklist 的变化主要是缩短表述，并保留 limiter、错误数、实际工作量和可比运行的检查。没有新增本仓库需要运行的性能实验。

## ketchup 更适合处理大量待决事项

本地 ketchup 已经有只读、当前分支、旧待决事项和授权判断。上游后续增加了两方面要求。

[终点的 ketchup](https://github.com/cursor/plugins/blob/d457567332aa6989e753ea289f30ea2bfbc80bc0/pstack/skills/ketchup/SKILL.md) 要求用已有截图、视频和关系图解释发生了什么。可见变化没有截图时，明确说明缺少截图。只读 catch-up 不能为了补图启动应用或任务，也不能生成一张没有实际捕获过的界面。

[PR 692](https://github.com/cursor/plugins/pull/692) 和 [PR 708](https://github.com/cursor/plugins/pull/708) 修正了总字数限制导致待决事项丢失的问题。每个等待事项都要有可识别的名称、影响、证据、风险和建议。不能用总数或链接代替逐项说明。只压缩进展叙述，不压缩用户需要决定的事项。

建议保留本地“开头报告待决数量”的形式，同时逐项列全。已有授权继续有效，不能把 ketchup 变成重复审批入口。

## 四个新增技能可以分开引入

| 技能 | 已核实的上游行为 | 建议 |
| --- | --- | --- |
| in-your-own-words | 终点正文仅要求复述用户目标和问题。[PR 602](https://github.com/cursor/plugins/pull/602) 的早期说明还提到等待确认，但终点正文没有这条指令。 | 显式 `/skill:in-your-own-words`。仅复述，不自动执行，也不为普通任务新增统一确认门槛。 |
| sharpen | 开始前检查专家方法、真正目标和规格是否合适，然后执行工作。[PR 712](https://github.com/cursor/plugins/pull/712) 删除了“不交付重写提示词”的禁令。 | 显式 `/skill:sharpen`。沿用用户授权和执行范围，不引入委派或发布权限。 |
| create-formal-verification-skill | 选择风险高、测试难覆盖的合同，选工具，验证性质并生成可重跑的项目技能。要求真实代码对应、破坏性变体、边界和假设。 | 单独引入。输出到 `.pi/skills/`，保留产品代码只读和隔离破坏性实验的边界。 |
| maintain-formal-verification-skill | 从覆盖范围和 sync commit 检查漂移。区分 in sync、updated、bug、blocked。遇到阻塞不能推进 sync commit。 | 与 create 技能同一阶段引入，避免新增证明却没有维护流程。 |

形式化验证的来源包括 [PR 709](https://github.com/cursor/plugins/pull/709)、[PR 716](https://github.com/cursor/plugins/pull/716) 和 [PR 721](https://github.com/cursor/plugins/pull/721)。事件顺序问题默认考虑 TLA+。没有适合语言的代码验证器时，在真实代码上做生成输入测试，并明确这是测试证据。不能把手写函数副本上的结论称为实现证明。

本机探测得到 `java`、`tlc`、`apalache`、`z3` 均不在 PATH。它们的实际工具试跑仍缺少前提。本次没有安装依赖或宣称形式化验证通过。

## 执行契约继续使用 Pi 原生能力

[PR 613](https://github.com/cursor/plugins/pull/613) 增加按任务选择 reasoning effort 和 fast 模式的规则，并保持角色的模型家族。它也减少了小修、rebase 后重复运行全套 swarm 的要求。

建议吸收任务难度与推理投入匹配的意图。实现时必须使用原生角色配置、已确认的 provider/model ID 和受支持的 thinking 或模型后缀。`fast` 字段只在原生执行器声明支持时使用，不能把上游 `-fast` 拼到 Pi provider ID。保留显式的不同家族审查席位。

以下内容已经由本地解决，或与本地契约冲突。

| 上游变化或规则 | 本地情况与处理 |
| --- | --- |
| [PR 575](https://github.com/cursor/plugins/pull/575) 明确主聊天负责流程，poteto-agent 是叶子实现者。 | 本地 agents/poteto-agent.md 已有相同分工。保留原生约束。 |
| [PR 577](https://github.com/cursor/plugins/pull/577) 和 [PR 597](https://github.com/cursor/plugins/pull/597) 修复技能定位和无效 frontmatter。 | 本地已有 skillPath、显式相对引用、模式注入的绝对目录。只检查遗漏，不引入 Cursor 插件缓存搜索。 |
| [PR 702](https://github.com/cursor/plugins/pull/702) 统一目录名与 name。 | 本地检查脚本已经强制同名。没有需要重命名的本地技能。 |
| 默认 fresh agent，follow-up 通常不复用。 | Pi 的已知 run 后续工作先 status，再尝试 resume。只有不具备资格时才使用带标签的新同角色 agent。原生契约优先。 |
| Task、Cursor slug 和 pstack-models.mdc。 | 继续使用 subagent、settings.json 和 pi-runtime.md。 |
| 自动外部消息、自动新开修复 PR、依赖失败后跳过继续。 | 不移植授权扩张。原生运行基础设施失败仍阻止依赖工作。 |

## 上游开始正式支持其他运行环境

[PR 637](https://github.com/cursor/plugins/pull/637) 引入生成的 Claude Code 目录和运行环境映射文件。[PR 705](https://github.com/cursor/plugins/pull/705) 继续修复模型配置、缺失能力处理和本地文档链接。[PR 704](https://github.com/cursor/plugins/pull/704) 增加 docs-vs-tree 检查，覆盖命令、playbook、角色、链接、数量和模型名。

这支持本地把执行差异集中放在 pi-runtime.md 的方向。建议借用文档漂移检查的做法，扩展已有检查脚本。当前没有必要把 Pi 改成自动生成的第二棵技能树。那需要重新审查本地授权、恢复和失败处理规则，超出这次同步的必要范围。

## 上游自动交付链有改进，但本版仍不引入

[PR 613](https://github.com/cursor/plugins/pull/613) 移除了 orchestrate 的 Graphite 依赖，改用 PR base chain。shipping 和 autopilot 的规则也简化，并强调 stack 所有权及有限重试。

[PR 484](https://github.com/cursor/plugins/pull/484) 修复 watch-pr 只读取前 100 个 review threads 的问题。[PR 613](https://github.com/cursor/plugins/pull/613) 还修复 `ACTION_REQUIRED` 被当成检查失败的处理。[PR 574](https://github.com/cursor/plugins/pull/574) 让 worktree-audit 解析默认分支及显式 base，而不是固定 origin/main。[PR 536](https://github.com/cursor/plugins/pull/536) 修复计划检查器对代码围栏的识别。

这些都属于真实改进，但本地没有引入对应的 watcher、orch、自动 shipping 和清理脚本。此次保留“不引入第二套调度器”的范围。以后若单独适配这些能力，应从终点版本重新审查，不能从旧快照补回。

## 本次验证和证据限制

本次运行 `./scripts/check-enabled-skills.sh` 成功。`node --test tests/*.test.mjs` 的 15 项离线测试全部通过。它们验证实际 SDK 的资源加载、模式状态与恢复、延迟重载和会话选择。结果保存在 `/tmp/pstack-baseline-skills-20261019.log` 和 `/tmp/pstack-baseline-tests-20261019.log`。

本次没有更新 skill，没有重载当前运行时，没有执行交互式 Pi 验证，没有调用模型做代表性任务评估，也没有独立跨模型审查。计划中的这些验收仍是待执行步骤。

所查来源为两个仓库的 Git 历史、固定版本源文件、相关 GitHub PR 正文、Pi 技能文档和本地验证资料。PR 作者的评估结论按其说明理解，未升级为本地实测。
