# pstack 更新到 Pi 的实施计划

本计划以 [上游改动调研](pstack-upstream-review.md) 和 [逐技能清单](pstack-upstream-audit.json) 为依据。目标是把已审查到 pstack v0.15.28 的改进带入 Pi，并继续由 Pi 原生能力执行。上游固定在 `d457567332aa6989e753ea289f30ea2bfbc80bc0`。本计划不随上游 main 的后续变化自动扩展。

调研阶段先完成了清单工具和更新前的离线基线。随后按本计划实现了核心更新和两个形式化验证技能，并完成实际 loader、CLI 及限定模型的试跑。结果与未覆盖的检查见 [实施验收记录](pstack-update-verification.md)。下文保留实施单元及其验收合同。

## 交付结果和范围

使用者得到更准确的测试与调试建议、完整的 ketchup 待决清单，以及两个显式的目标澄清入口。维护者得到来源清单、文档检查和分阶段验收证据。形式化验证作为独立单元交付。

完成条件如下。

- 已安装的 35 个上游变化目录都有 adopt、adapt 或 retain 的审查结论及来源。
- 新增 in-your-own-words 和 sharpen，全部保持显式调用。核心交付后有 52 个 pstack 技能。
- 若执行形式化验证单元，再新增 create-formal-verification-skill 和 maintain-formal-verification-skill。完整交付后有 54 个 pstack 技能。缺少工具时明确区分文本适配完成和能力验收阻塞。
- 现有模式开关、分支恢复、压缩后恢复、延迟重载和会话查询合同继续成立。
- 已安装的 Pi loader 无 skill diagnostics，静态检查与当前全部离线测试通过。
- 修改的流程有与其承诺匹配的代表性任务证据。文字检查不能替代这项证据。

允许编辑的范围是 `skills/pstack/`、相关文档、`scripts/check-enabled-skills.sh`、`tests/pstack-mode.test.mjs` 和 `.pi/skills/verify-pstack/`。只有发现并复现相关运行时回归后，才另按 Bug fix 流程修改扩展或原生 agent 定义。

保留 settings.json 的现有选择。此次更新不改主模型、不创建新的模型配置文件、不新增调度器、不安装 Cursor 或 Claude Code 运行环境，也不引入自动消息、发布、合并和 worktree 清理。

## 现有行为和目标结构

当前运行链由 [模式扩展](../extensions/pstack-mode.ts)、[poteto-mode](../skills/pstack/poteto-mode/SKILL.md)、[Pi 执行契约](../skills/pstack/poteto-mode/references/pi-runtime.md) 和 [原生叶子实现角色](../agents/poteto-agent.md) 组成。扩展把模式状态写进会话分支，在新一轮执行前读取本地工作流。技能正文按需读取。

继续保留一份手工维护的 Pi 技能目录。上游语义与 Pi 执行差异仍集中在既有结构，不新增生成目录。

来源数据使用按技能名索引的表。拟新增的 `skills/pstack/upstream.json` 记录上游仓库、reviewedTarget，以及每个技能的 sourcePath、sourceCommit、disposition 和保留差异。disposition 使用 adopt、adapt、retain、local 四种值。它只记录来源，不参与工作流调度或模型选择。已排除的上游能力另有清单，避免把“已审查到 v0.15.28”误写成“完整移植 v0.15.28”。

当前 [调查脚本](pstack-upstream-audit.py) 已使用技能名索引、来源目录和 ketchup 基线覆盖表。实施时让它读取上述来源记录，并继续只输出清单，不自动覆盖技能。

| 方案 | 收益 | 代价和结论 |
| --- | --- | --- |
| 逐项更新当前 Pi 快照 | 保留既有授权、恢复和错误处理，改动可逐项审查。 | 需要记录保留差异。推荐。 |
| 覆盖整个上游目录后修补 | 复制动作少。 | 会重新带入 Task、Cursor slug、外部集成和自动交付规则。拒绝。 |
| 仿照 Claude Code 生成一棵 Pi 目录 | 将来可能减少机械同步。 | 先要定义语义转换和冲突检测，增加第二份产物。此次不做。 |

## 单元顺序和负责人

每个单元由当前实施者负责。集成也由同一维护者负责。默认串行执行，不把本计划理解为委派授权。

```mermaid
flowchart LR
    U0[来源与验收基线] --> U1[原则与验证规则]
    U1 --> U2[Pi 工作流与文本]
    U2 --> U3[追进展与澄清入口]
    U3 --> U5[集成与文档验收]
    U3 --> U4[可选形式化验证]
    U4 --> U5
```

每个单元以对应验收通过结束。后续变化只重跑受影响的检查，最终对整合后的目录运行完整离线检查。没有性能改动，不设性能数字目标。

## U0 固定来源和验收入口

负责人为当前实施者。没有前置实施单元。

编辑边界如下。

- 新增 `skills/pstack/upstream.json`。
- 更新 `docs/pstack-upstream-audit.py`，让来源基线由记录驱动。
- 扩展 `scripts/check-enabled-skills.sh` 中已有的 pstack 检查。
- 按检查变化更新 `.pi/skills/verify-pstack/SKILL.md`。

先重新运行 `git status --short`，确认实施时的未提交内容。保留用户修改，不自动 stash、回退或提交。当前调研开始时 settings.json 有修改标记，后一次检查已消失。本会话没有写该文件，其间变化原因未知。

把清单中 50 个当前技能都写入来源记录。create-skill 标为 local，control-cli、control-ui、deslop 指向 cursor-team-kit，ketchup 使用后补来源。补全四个拟引入技能及排除项的结论。清单应区分 sourceCommit 和 reviewedTarget。

扩展现有检查，让文档里的 pstack 技能数量、实际目录和公开命令列表能互相核对。继续检查名称、frontmatter 和相对链接。新增检查的失败用临时 fixture 验证，不能故意损坏当前 checkout。

验收使用以下命令。

```bash
python3 docs/pstack-upstream-audit.py --upstream /tmp/pstack-upstream-research-20261019
./scripts/check-enabled-skills.sh
node --test tests/*.test.mjs
```

临时把 fixture 文档中的数量改错，检查必须失败。恢复 fixture 后检查通过。来源记录覆盖全部本地 pstack 技能，四个拟新增技能和排除项都有结论。证据保存到 `/tmp/pstack-update-evidence/U0/`。

当前静态检查和 15 项离线测试已通过。新的来源记录及漂移检查尚未实施。

## U1 更新原则、类型示例和可用性要求

负责人为当前实施者。依赖 U0。

编辑边界为清单中有变化的 17 个 `principle-*/` 目录、`typescript-best-practices/`、`benchmark-checklist/` 和 `create-verification-skill/`。涉及原则摘要的那部分 `poteto-mode/SKILL.md` 也在此单元同步。

先更新四个有语义修正的原则。

1. 将测试判断改成行为损坏与内部重构的两个条件。
2. 将根因分析改成判断触发状态是否合法，并增加便宜观测信号的建议。
3. 将重复失败改成直接检验共同假设。
4. 将幂等恢复改成从可观察状态收敛，保留跨崩溃位置成立的证据。

逐项审查其余 13 个变化原则的精简。每个叶子的正文应能独立说明主要行动。保留必要解释的文件标为 adapt 或 retain，不制造与原文逐字相同的要求。

同步 TypeScript 品牌类型的守卫示例。同步空数据目录、迁移、种子数据和替代环境差异的验证要求。保留项目技能的 `.pi/skills/` 路径、本地 control 技能和证据保留规则。

文字更新运行静态检查与实际 loader 测试。再在独立的短会话或本地 fixture 上检查以下决策，并保存输入与输出。

| 案例 | 验收结果 |
| --- | --- |
| 空购物车不得发起支付，同时有一个正常支付的对照。 | 保留无外部调用的合同测试，不能因断言形状直接删除。 |
| 外部输入合法地缺少可选字段。 | 允许在输入边界处理。内部不可能状态则继续追生产者。 |
| 跨容器留下的锁。 | 不只用本机 PID 存活决定旧锁是否有效。 |
| 两次修复都假设同一资源是瓶颈。 | 先选择能区分该假设真假的观测，不强制套用 actor 统计。 |

这些是代表性行为检查，不构成所有模型的效果证明。没有模型试跑时只能报告静态验收完成。证据保存到 `/tmp/pstack-update-evidence/U1/`。

## U2 同步工作流并保留 Pi 执行边界

负责人为当前实施者。依赖 U1。

编辑边界为 `architect/`、`arena/`、`how/`、`interrogate/`、`no-comments/`、`poteto-mode/`、`recall/`、`setup-pstack/`、`show-me-your-work/`、`swarm/`、`technical-writing/`、`unslop/` 和 `why/`。

采用上游有价值的删重和精简。保留 why 的本地数据源边界、recall 的 Pi 会话范围，以及原生证据与委派约束。unslop 的 description 去掉无条件自动应用的表述，保留 poteto-mode 对写作的显式路由。

把按任务选择推理投入的说明只放在 `poteto-mode/references/pi-runtime.md`。其他技能引用它。首先确认安装版本的原生 agent 配置、模型列表和工具 schema，再使用支持的 thinking、模型后缀或 fast 选项。保留配置的模型家族和用户预算，不生成上游 Cursor slug，不覆盖 settings.json，也不强制降低所有判断任务的等级。

核对并保留以下合同。

- 当前聊天编排，普通子 agent 完成限定步骤。
- 只有获授权的流程才启动子 agent。
- 多步委派使用一个原生 async workflow，在终态与证据处形成依赖边界。
- 已知同角色后续工作遵守 status、resume 和资格拒绝后的有标签替代流程。
- 运行基础设施失败阻止依赖步骤，不能无声换执行方式。
- 并行写入使用隔离 checkout，最终验证整合结果。

不需要修改 `extensions/pstack-mode.ts`、`extensions/reload-runtime.ts` 或两个 agent 定义来追随上游文字变化。若核对发现真实缺陷，记录复现后单独处理。

验收运行静态检查和离线测试。检查待交付文本中的 `Task`、`.cursor/`、`pstack-models.mdc` 和 Cursor 模型 slug。历史说明可以保留，活动流程不能引用未映射的工具。再由维护者通读授权、resume 和错误处理条款。

原生 registry 和 models 查询是只读检查，不证明实际 child launch。只有另有委派授权时，才试跑只读 child，并保存真实 run ID、输出引用和模型证据。否则将该项标为未执行。证据保存到 `/tmp/pstack-update-evidence/U2/`。

## U3 补全 ketchup 和两个显式澄清技能

负责人为当前实施者。依赖 U2。

编辑边界为 `ketchup/`、新增的 `sharpen/` 与 `in-your-own-words/`、`poteto-help/`、来源记录、`tests/pstack-mode.test.mjs` 和相关文档。

先修改实际 loader 测试，明确要求两个新技能存在、路径正确、`disableModelInvocation` 为 true，并把 pstack 预期数量改成 52。先观察缺失技能的失败，再添加技能。不要只用“读取目录数量等于同一次读取的目录数量”充当发现验证。

ketchup 保留当前会话分支和待决数量，逐项列出全部未决事项。每项必须能从回复本身做决定。用已有截图或小型关系图解释变化，不为补证据启动应用。无截图时明示缺口，不画伪造界面。

in-your-own-words 只复述目标与问题。sharpen 优化工作方法后继续已授权任务。两者都不能自动扩大范围，不能把确认、子 agent 或外部操作变成普通任务的默认步骤。

验收运行静态检查和离线测试。代表性试跑使用以下输入。

- 一个没有新变化也没有待决事项的 catch-up。
- 一个包含 12 个明确待决事项、一个旧待决事项及已有授权工作的 catch-up。逐项对照输入，不能用总数代替列表，不能把已有授权再变成审批。
- 一个已有截图和一个无截图的可见变化。检查只读状态和链接真实性。
- 一次目标复述，以及一次范围明确的可逆任务 sharpen。核对它们各自的执行边界。

试跑只使用隔离 fixture 或当前已授权的任务，不创建真实 PR、发消息或改变活跃会话的模式。证据保存到 `/tmp/pstack-update-evidence/U3/`。

## U4 独立引入形式化验证技能

负责人为当前实施者。依赖 U3。本单元可晚于核心交付执行，不阻塞 U5 对核心部分的验收。

编辑边界为新增的 `create-formal-verification-skill/` 和 `maintain-formal-verification-skill/`、`setup-pstack/`、`poteto-help/`、来源记录、loader 测试和相关文档。

先把实际 loader 测试的预期改为 54，并要求两个新技能显式调用。观察失败后再添加技能。通过本地 create-skill 规则适配项目技能路径。

create 流程保留性质、覆盖代码、假设、边界、工具版本、复跑命令和 sync commit。事件顺序问题默认考虑 TLA+，无适合语言的代码验证器时检查真实代码的生成输入，并明确降低结论强度。

maintain 流程读取 sync commit 后的覆盖代码变化。区分验证漂移和产品缺陷，支持 in sync、updated、bug、blocked。验证只能按代码和合同证据更新，不能为了通过而弱化性质。blocked 时不推进 sync commit。

产品代码默认只读。破坏性变体在由本单元创建的临时 fixture 或隔离 checkout 中运行。若从当前仓库分配 managed worktree，先满足原生干净源树要求，不处理用户未提交内容来凑这个条件。

setup 只在用户已经请求验证相关设置时提供生成入口。仅配置模型时不追加无关的确认步骤。实施形式化试跑时，在隔离验证环境中准备并固定工具版本，不写入全局配置，也不启动长期验证任务。

验收分两层。

1. 静态和 loader 验收确认两个技能可发现、命令正确、项目路径为 `.pi/skills/`，并且覆盖记录和只读边界完整。
2. 能力试跑选一个具体性质，建立代码对应和可重跑命令，确认破坏性变体失败，再恢复原状态。随后做一次覆盖代码变化，使 maintain 检测漂移。另做一次缺少工具的路径，确认返回 blocked 且 sync commit 不变。

可用的真实代码候选是 `extensions/pstack-mode.ts` 中的模式状态恢复，现有 `tests/pstack-mode.test.mjs` 提供了真实 SDK 驱动方法。实施时先判断该性质适合哪种验证，不能把未建模的 Pi SDK 事件行为算入证明范围。

本次已确认 java、tlc、apalache、z3 不在 PATH。选择 TLA+ 时，实际试跑需要可用且版本固定的 Java 与 TLC。实施时先在隔离环境准备工具，不能完成时报告能力验收阻塞。生成输入测试的成功不能代替 TLC 的模型检查成功。证据保存到 `/tmp/pstack-update-evidence/U4/`。

## U5 整合文档并验证实际使用入口

负责人为同一集成维护者。依赖 U0 至 U3。若包含形式化验证，还依赖 U4 的相应结果。

编辑边界为 `README.md`、`skills/pstack/README.md`、`poteto-help/`、来源记录、`.pi/skills/verify-pstack/` 和该单元需要的检查资料。

把来源表述更新为“Pi 适配已审查到 v0.15.28”。保留原始基线与逐技能差异，不能宣称完整支持上游所有 playbook。同步 52 或 54 的实际数量。验证说明不再固定承诺永远只有 15 项测试。

先运行完整静态和离线检查。

```bash
./scripts/check-enabled-skills.sh
node --test tests/*.test.mjs
python3 docs/pstack-upstream-audit.py --upstream /tmp/pstack-upstream-research-20261019

git diff --check
git status --short
```

随后按 `.pi/skills/verify-pstack/SKILL.md` 在隔离的真实 Pi 会话中重载资源，检查 `/pstack status`、`/pstack on`、`/pstack status`、`/pstack off`。确认通知和状态栏一致，开关不启动任务、不改变可用工具，并检查新技能命令与 loader diagnostics。

使用者没有请求改变当前聊天的模式时，不在当前聊天做开关验证。恢复、分支、压缩和重载的 SDK 回归沿用既有测试。交互式检查与离线检查分开记录。

核对来源清单的 35 个变化目录全部有结论，四个新技能的状态正确，未引入的 watcher、orch 和自动 shipping 仍在排除项中。通读最终 diff，检查摘要与叶子、文档与命令、能力与证据一致。

证据保存到 `/tmp/pstack-update-evidence/U5/`。交付时逐项报告静态检查、离线行为、交互式行为、代表性流程、形式化试跑和独立审查的实际状态。

## 集成和交付顺序

建议按 U0、U1、U2、U3、U5 的顺序交付核心部分，再以 U4 和对应的 U5 更新交付形式化验证。每个单元适合一个可独立审查的 commit。只有用户要求时才提交或创建 PR。

throughput checkpoint 采用以下约束。

- 先固定来源与现有测试，再修改工作流。
- 原则、ketchup 和形式化文本可以在将来获授权后分工探索，但 README、来源记录、loader 预期和帮助入口由一个集成负责人写入。
- 当前计划默认一个写入者，避免为文字同步新增并发状态和整合成本。
- 若用户以后要求并行实施，使用一个原生 async workflow 和隔离写入目录。每个依赖点消费真实终态、输出引用和 diff，再由集成者验收。

独立跨模型审查不作为本次已经完成的步骤。后续若要求此审查，使用两个确认可用且不同家族的模型，提供包含未提交文件的完整 diff packet，并保留原生结果引用。

## 风险、阻塞和未决事项

| 项目 | 当前证据 | 处理 |
| --- | --- | --- |
| 上游文本压缩可能丢失独立阅读所需的解释。 | 终点两个原则正文大幅缩短，Pi 角色按路径读叶子。 | 人工逐项判定，保留核心正文。不能用字数下降作为收益证据。 |
| 上游和 Pi 的授权、resume、失败处理不同。 | pi-runtime.md 与上游 poteto-mode 的规则直接不同。 | 原生执行契约优先，活动流程只引用一个执行规范。 |
| 形式化工具缺失。 | 本机四个命令均不在 PATH。 | 核心交付继续。U4 在隔离环境准备工具，无法就绪时将能力验收标为阻塞。 |
| 语义改善尚无 Pi 任务评估。 | 本次仅完成调研和离线基线。 | U1、U3 记录代表性试跑，不转述上游评估为本地结果。 |
| 模型 reasoning 和 fast 能力随 runner 变化。 | 原生工具 schema 约束具体字段，不能照搬 Cursor slug。 | U2 在实施时查询实际模型与 runner，保留现有预算和家族。 |
| 本次没有真实交互式或独立审查证据。 | 当前只有静态检查、实际 SDK 离线测试和来源核对。 | 由对应单元补齐，未执行项不能标为通过。 |

核心更新没有需要先交给用户选择的技术分叉。推荐保留当前手工快照和 Pi 原生执行方式。形式化验证是否纳入首批交付是唯一可延后决定的范围选择，按本计划默认先交付核心部分。
