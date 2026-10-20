# Pi advisor 自研实现方案

本方案交付一个自研 Pi 扩展。便宜的执行模型保留会话、工具调用和最终答复的所有权。强模型只负责规划建议、疑难咨询和完成前审查。实现直接调用当前 Pi 的模型接口。

本文描述目标设计和验证依据。实现当前进度列在下方。计划中的额外文件和测试仍以计划状态标示，不代表已实现。

## 实施进度

- **U1 已完成。** `extensions/advisor/index.ts`、`extensions/advisor/advisor.ts` 和 `extensions/advisor/evidence.ts` 实现默认关闭、模型选择、工具咨询、取消和用量记录。
- **U2 已完成基础实现。** 快照使用当前分支投影、HEAD diff、staged 和 unstaged 改动、未跟踪文本文件以及任务开始时的 diff。Git 与文件读取走异步路径，未跟踪凭证文件名会触发内容省略。非 Git 目录标记 baseline unavailable。
- **U3 已完成并由真实 SDK 会话验证。** `agent_before_settle` review 会把修改建议交回执行模型，再复审。执行工具最多调用四次，其中自动 review 会预留一次。review 最多两轮。工具调用 usage 进入 Pi 统计，自动 review usage 进入独立账本。
- **U4 已完成部分验证。** 离线验收覆盖默认关闭、模型调用、完成前 review、修复后复审和 Pi 命令行扩展加载。switch、tree、reload 及恢复中断状态尚无独立端到端用例。
- **U5 尚未进行在线模型验收。** 首版尚未选择并配置真实顾问模型。当前验收仅使用本地假 provider，不产生在线模型费用。

当前可重跑的离线验收是 `node scripts/verify-advisor.mjs --offline`。脚本把命令输出和退出码保存到 `.artifacts/advisor/verification.json`。

## 结果与边界

首版提供一个 `advisor` 工具和一个 `/advisor` 命令。用户可以选择顾问模型、取得规划建议、手动咨询，并启用完成前自动审查。顾问的每次调用都显示状态、输入范围、结果和用量。

首版保持当前主模型。用户通过 Pi 原有的模型设置选择便宜模型。扩展不替用户猜测模型价格、修改默认模型或自动选择其他 provider。

首版使用一个顾问模型，同时承担 plan、consult 和 review。顾问没有执行工具，不能修改文件。所有建议由执行模型结合实际证据处理。

首版不包含长期顾问 agent、并行顾问、子进程、subagent 调度、Anthropic 服务端 advisor 协议适配、自动复杂度分类或虚拟模型路由。后续只有在验收暴露具体不足时才增加这些能力。

验收以真实 Pi session 的事件和保存的会话记录为准。模型给出通过结论，不代表测试或用户任务已经通过。

## 当前依据

当前工作目录为 `/home/qliu/.pi/agent`。安装的 SDK 为 `@earendil-works/pi-coding-agent` 1.2.0。

本机 SDK 根目录为 `/home/linuxbrew/.linuxbrew/lib/node_modules/@agegr/pi-web/node_modules/@earendil-works/pi-coding-agent`。以下路径相对该目录。

| 现有文件 | 已确认的能力及设计影响 |
| --- | --- |
| `docs/extensions.md` | 扩展可注册工具、命令、生命周期事件及自定义会话记录。 |
| `dist/core/extensions/types.d.ts` | `agent_before_settle` 可返回 entries 和 continue，适合作为完成前检查边界。 |
| `dist/core/extensions/types.d.ts` | `ExtensionContext.sessionManager` 为只读接口。事件 handler 没有 `executeTool`，不能假定它可生成原生工具调用。 |
| `dist/core/model-registry.d.ts` | `streamSimple` 提供 provider 中立调用及请求时鉴权。 |
| `dist/core/session-manager.d.ts` | `buildSessionProjection()` 返回应用 compaction 和 context edits 后的当前分支消息。 |
| `docs/session-format.md` | 原生 UsageEntry 支持独立模型用量，但扩展上下文没有公开的 appendUsage。 |
| `docs/message-types.md` | 工具结果可携带 usage，计入会话总量。 |
| `examples/extensions/jev-router.ts` | 阶段切换可以实现，但不作为本方案的主模型控制方式。 |

仓库现有 `tests/reload-runtime.test.mjs` 提供 SDK 定位、隔离目录、内存设置和真实扩展加载 fixture，可复用其测试组织方式。现有 `extensions/status-line.ts` 说明仓库已有状态栏扩展。新增 UI 使用独立的 `advisor` 状态键。

仓库已有其他未提交修改。实现只新增本方案指定文件。集成者不得覆盖、暂存或重置其他工作。

## 用户操作

命令采用文本参数，在 TUI、RPC 和 print 模式使用同一语义。首版不需要交互选择器。

| 命令 | 行为 |
| --- | --- |
| `/advisor status` | 显示启用状态、精确模型 ID、思考等级、自动 review 策略和当前检查状态。 |
| `/advisor model` | 列出已鉴权可用模型的精确 ID。 |
| `/advisor model <已列出的精确 ID>` | 将顾问模型保存到用户级配置。该表中的语法参数需要用户从实际列表选择。 |
| `/advisor on` | 启用已经配置的顾问。缺少模型时返回配置错误。 |
| `/advisor off` | 停止新咨询，取消在途咨询，保留历史记录。 |
| `/advisor plan` | 用当前会话证据请求强模型给出规划建议，并显示给用户。结果不会自动送回执行模型。 |
| `/advisor review` | 用当前工作证据请求强模型 review，并显示给用户。执行模型不会自动收到结果。 |
| `/advisor review auto` | 启用完成前自动审查。 |
| `/advisor review manual` | 关闭自动审查，保留手动和模型主动调用。 |
| `/advisor usage` | 显示全部顾问调用账本及 Pi 原生统计覆盖范围。 |

配置文件拟新增为 `~/.pi/agent/advisor.json`。默认关闭，model 为 null。用户设置有效模型并启用后，默认采用自动 review。首版只有用户级配置和当前会话开关，不增加项目配置继承。

建议默认值为 `thinking = high`、`maxOutputTokens = 4096`、`timeoutMs = 120000`、`maxCallsPerWork = 4`、`maxReviewPasses = 2`。这些是产品默认值，不是测量结果。模型不支持 high 时，配置命令列出支持的等级并拒绝该值，不静默替换。

每项工作预留一次 final review 配额。普通咨询最多消耗其余三次。review 的修复后复查也消耗同一四次额度。次数上限约束调用数量，不声称提供精确美元费用硬上限。

## 架构选择

直接比较了两种结构。未进行独立多模型评审。

| 候选 | 调用者需要理解的内容 | 隐藏的复杂度 | 判断 |
| --- | --- | --- | --- |
| 独立顾问调用 | 主模型持续执行，advisor 返回建议，结束前自动 review。 | 上下文组织、不同 provider、配额、审查状态和费用去重。 | 采用。一次调用即可完成咨询，规划和执行无需交接主模型控制权。 |
| 虚拟模型按 plan、build、review 路由 | 当前阶段及其切换条件，强模型在何时取得整个 agent 的控制权。 | 每次请求的物理模型选择。 | 暂不采用。顾问可能直接执行工具，阶段转换及缓存失效成为额外策略，难以表达纯建议角色。 |

选择第一种结构。命令和事件只接入同一个顾问服务，不能各自实现一份模型调用或配额逻辑。证据包模块隐藏 Git、上下文投影和截断策略。入口只消费 EvidenceSnapshot 和 AdvisorResult。

按设计红旗检查，状态只有 advisor.ts 一个写入者。入口不直接更改调用次数或审查结论。provider 响应类型不暴露给命令和事件处理器。文件数量不随生命周期事件数量增长。

## 组织结构与数据形状

计划新增以下文件。不要为每个生命周期事件再拆一层包装。

| 文件 | 职责 |
| --- | --- |
| `extensions/advisor/index.ts` | 注册工具和命令，连接生命周期事件，渲染状态。 |
| `extensions/advisor/advisor.ts` | 配置、模型调用、结果解析、用量和工作状态。 |
| `extensions/advisor/evidence.ts` | 从当前投影、Git 状态和文件快照构造证据包。 |
| `tests/advisor.test.mjs` | 使用真实 SDK 加载扩展，验证工具、状态、费用和恢复。 |
| `tests/advisor-evidence.test.mjs` | 验证 dirty Git、context edits、压缩、截断和文件变化。 |
| `scripts/verify-advisor.mjs` | 通过真实 CLI 跑离线协议和显式启用的在线验收，输出证据。 |

核心数据按下面的领域对象组织。

- `AdvisorConfig` 保存 enabled、精确模型、思考等级、输出限制、超时和配额。
- `WorkState` 保存 workId、根用户消息、调用次数、审查次数和当前状态。
- `EvidenceSnapshot` 保存 snapshotId、当前分支、任务约束、消息来源、文件内容摘要、Git 差异和覆盖范围。
- `AdvisorRequest` 保存 purpose、question 和 EvidenceSnapshot。purpose 取 plan、consult 或 review。
- `AdvisorResult` 是带 kind 的联合。kind 取 plan、advice、review、insufficient、unavailable 或 invalid。
- `ConsultationRecord` 保存 callId、workId、snapshotId、模型、purpose、结果、用量、费用和计费归属。

plan 返回 steps、risks 和 evidenceNeeded。advice 返回 actions 和 reasoningSummary。review 返回 pass 或 changes_requested，以及 findings。每个 finding 包含 severity、证据引用和建议动作。insufficient 返回缺少的具体证据。unavailable 和 invalid 永远不能转成 pass。

顾问返回 JSON 文本。扩展在边界解析并校验，不依赖某个 provider 专有的结构化输出参数。解析失败不自动再付费重试，不用正则从任意散文猜测通过结论。

内部接口草图如下。这里仅约定签名，不创建产品代码。

```typescript
type Purpose = "plan" | "consult" | "review";

type ReviewDecision =
	| { verdict: "pass"; findings: [] }
	| { verdict: "changes_requested"; findings: [Finding, ...Finding[]] };

interface AdvisorService {
	consult(request: AdvisorRequest, signal: AbortSignal): Promise<ConsultationRecord>;
	cancel(): void;
}

interface EvidenceCollector {
	capture(purpose: Purpose): Promise<EvidenceSnapshot>;
	isCurrent(snapshot: EvidenceSnapshot): Promise<boolean>;
}
```

其余领域类型沿用上文的字段约定，实施 U1 时补齐。服务隐藏配额预约、请求去重、provider 调用和结果校验。证据收集器隐藏工作起点及文件快照。consult 的调用者只负责将返回记录写到对应的 Pi 工具结果或 boundary entries。工具和事件都不能自己拼 provider 请求。

`WorkState` 用一个带状态的联合表达 idle、working、consulting、repairing 和 finished。finished 的 outcome 取 reviewed、unreviewed、aborted 或 error。不要用多个 running、reviewed、blocked 布尔值拼凑状态。

工作由真实外部用户输入开始。运行中收到的 steering 属于当前工作，但会使旧审查失效。运行结束后的新用户消息创建新工作。扩展自身注入的建议不创建新工作。命令触发的 plan 或 review 在进入 agent loop 前登记来源，避免被误判成新任务。

## 调用和事件流程

执行模型先读取代码、日志或任务资料。工具指南要求它在形成方案后、关键修改前调用 `advisor`，purpose 为 plan。遇到具体疑难时使用 consult。

首版的自动规划通过模型指南触发，属于软约束。它不会声称保证所有写入前都经过计划审批。任意 bash、MCP 和自定义工具都可能写文件，首版不靠命令字符串匹配伪造完整写入隔离。用户可在调查后用 `/advisor plan` 明确请求规划咨询，但该命令本身也不是工具权限隔离。

`advisor` 工具接收 purpose 和可选 question。扩展自己收集证据，不让执行模型只传一段自我总结。工具调用使用当前 workId 预约配额，取得快照，调用明确配置的物理模型，再返回经过校验的结果和 usage。

自动 final review 放在 `agent_before_settle`。

1. 仅处理 completed、可以继续且没有待处理用户消息的工作。取消和错误不触发新顾问调用。
2. 根据 boundary 的有效上下文与文件证据构造快照。已审查且证据内容未变时复用结论。
3. 预约审查配额并调用同一个 advisor 服务。调用不经过执行模型，也不要求它服从一次工具选择指令。
4. 将顾问记录与状态记录通过 boundary entries 保存。pass 允许工作结束，并追加可见的检查记录。
5. changes_requested 追加真实的顾问建议，返回 continue。执行模型修复并验证后，再次进入完成前检查。
6. 达到配额、结果无效、证据不足或顾问失败时，注入 unreviewed 状态并最多请求一次最终说明。后续结束边界不重复咨询。

`agent_before_settle` 发生时，执行模型的候选答复可能已经显示。首版明确接受“先看到候选完成答复，再看到 review 和修正”的呈现，不声称隐藏所有未审查文字。最后一条答复必须包含修正后的完整结果。真正的流式答复暂存不纳入首版。

`turn_end` 和 `tool_result` 仅用来失效旧证据及记录行为，不在并行工具结果回调中触发顾问网络请求。首版不实现“连续 N 个错误自动咨询”，因为不同工具的可预期失败容易被误算成卡住。

## 上下文与代码证据

普通工具调用使用 `buildSessionProjection()` 的消息。完成前检查优先使用 boundary context，避免遗漏同一边界已有扩展提出的上下文变更。保留当前有效系统约束和用户要求。不会直接转发整份原始 JSONL。

证据包使用固定的组织结构。

1. 原始目标、后续修正和适用约束。
2. 当前 plan 与关键事实，保留原始消息来源 ID。
3. 执行模型实际读取或修改的文件和行号。
4. 本项工作产生的差异，及与原有 dirty 内容的区分。
5. 工具错误、测试命令、退出状态和输出。
6. 执行模型的候选完成答复。
7. 覆盖范围、缺失文件和截断清单。

首版不转发隐藏思考块。它们既不是验证证据，也会扩大费用和不同 provider 的兼容负担。图片和其他非文本材料标成未审查，不能暗示顾问已经看过。

证据包序列化为顾问 user message 中的数据。顾问使用独立审查指令，保留任务中适用的仓库约束。原会话的工具声明不作为顾问可调用工具传入。文件、日志和对话中的指令文本按证据处理，不获得新的执行权限。

代码任务在工作开始时记录 Git HEAD、索引和工作区状态。Git 操作使用参数数组、`--no-ext-diff` 和 `--no-textconv`，避免 shell 拼接和项目定义的 diff 执行器。工作开始前已有的改动不归功于执行模型。

对已有 dirty 文件、工作期间读取的文件和即将编辑的文件记录内容快照。结束时比较前后内容，覆盖 staged、unstaged、未跟踪文件、删除和重命名。只记录 `git diff HEAD` 不足以确定本项工作的修改。

工具事件用于提前捕获 edit 和 write 的文件。未知工具修改而未取得起始内容的文件标记为 baseline_missing。非 Git 目录使用已知文件快照。非 Git 目录内未知工具产生的外部变化可能无法完整发现，覆盖范围必须明确标记。

snapshotId 对任务约束、有效消息贡献、文件内容与测试证据求摘要，不包含自己的顾问记录、渲染状态和时间戳。规划和审查结果通过 snapshotId 绑定证据。新用户输入、文件变化或新测试结果使旧审查失效。手动复查重复快照可复用已有结果，并标成 cached。

证据包使用 SDK 的会话投影和固定字符上限，不读取整份原始 JSONL。超长输入保留任务、最近对话、工作区状态和变更片段的摘要区域，并在每个截断片段旁标出覆盖缺口。字符上限是边界，不声称等同于 tokenizer 的 token 限制。

文本材料超长时记录 omitted 的来源、原始大小和原因。二进制文件及缺失的外部状态始终列入覆盖限制。review 的 pass 指证据范围内未发现阻塞问题，不等于仓库所有行为已通过验证。

## 并发、恢复与取消

每个会话同时只允许一个顾问请求。重复的同快照请求合并。不同请求遇到在途请求时返回 busy，不排队制造无限后续工作。配额在发请求前同步预约。

调用组合当前 turn signal、插件开关取消信号和超时信号。session shutdown、切换和 reload 取消请求。运行期间始终显示顾问模型及状态。RPC 和 print 输出包含同样的语义信息，不依赖 TUI widget。

持久化使用 `pi.appendEntry()`，类型为 `advisor.work` 和 `advisor.consultation`。自动审查在 boundary 返回等价的 custom entries。启动、resume 和 tree 切换后，从当前分支恢复，不扫描其他分支累计状态。

恢复时将遗留 consulting 标成 interrupted，不自动重发。被中断请求可能已在 provider 计费。它消耗的预约次数不返还，账本显示费用未知。不能承诺崩溃后网络请求 exactly once。

异步返回前重新核对会话、workId、分支锚点和快照。存在新用户消息或文件变化时，旧结果可保存为 stale，但不能用于结束审查。分支已被替换时，旧上下文不得继续写入新分支。不得通过旧上下文句柄绕过 Pi 的 stale 检查。

## 费用记录

每次请求只产生一条 ConsultationRecord。即使得到空文本、错误或取消，也尽可能保留 provider 已返回的 usage。费用缺失时显示 unknown，不显示 0。

工具发起的咨询把 usage 放入工具结果，由 Pi 纳入原生会话总量。自动审查把 usage 放入顾问自定义记录，由 `/advisor usage` 统计。后者在首版无法加入 Pi 原生总量。

`/advisor usage` 分别显示顾问总量、已包含在 Pi 原生总量的工具调用，以及未包含的自动审查。用户计算总费用时，只需在 Pi 原生费用上加未包含部分。扩展不会把两者整体相加导致工具调用重复计费。

首版不修改 Pi 核心，不通过类型断言取得可写 SessionManager，也不把顾问费用伪装成执行模型的 assistant usage。若以后 Pi 为扩展开放独立 usage entry，再统一迁移统计。

## 可验证交付单元

实现由一个集成者顺序完成。下面所有单元默认由同一实现者负责。没有授权并行写入或子代理委派。先写行为测试，再实现对应单元。每单元通过后再进入下一单元。

| 单元 | 文件边界和前置依赖 | 实施内容 | 完成条件与证据 |
| --- | --- | --- | --- |
| U1 | `index.ts`、`advisor.ts`、`tests/advisor.test.mjs`。无前置。 | 配置、显式模型选择、advisor 工具、文本命令、一次顾问请求和账本。 | 真实 SDK 加载无错误。假 provider 证明执行和顾问模型不同，顾问没有工具声明，建议作为工具结果返回，用量只计一次。 |
| U2 | `evidence.ts`、`tests/advisor-evidence.test.mjs`。依赖 U1。 | 投影、证据来源、dirty baseline、文件快照、截断清单和快照摘要。 | 临时仓库的 staged、unstaged、未跟踪和原有 dirty 内容均归类正确。context edits 删除的文本不会重新发送。 |
| U3 | `index.ts`、`advisor.ts`、两份测试。依赖 U2。 | 完成前 review、修复后复查、配额和终止状态。 | 脚本化执行模型先返回候选结果，顾问指出问题，执行模型修复，再经 pass 后结束。缺额和无效 JSON 不形成无限 continuation。 |
| U4 | 同上及 `scripts/verify-advisor.mjs`。依赖 U3。 | abort、reload、resume、tree、stale 结果及非 TUI 行为。 | 顾问中断后不重发。分支之间不泄漏状态。真实 CLI 的 JSON 输出和保存的 session 证明状态和费用一致。 |
| U5 | `scripts/verify-advisor.mjs`、本方案验收记录。依赖 U4。 | 使用明确配置的真实模型完成一次任务及人工检查。 | 保留模型 ID、事件顺序、建议、修改、验证结果和用量。无凭据时标 blocked，不用离线假响应充当在线通过。 |

计划中的离线验收命令为：

```bash
node --test tests/advisor.test.mjs tests/advisor-evidence.test.mjs
node scripts/verify-advisor.mjs --offline
```

计划中的在线验收命令为：

```bash
node scripts/verify-advisor.mjs --live
```

验收脚本先检查顾问模型已显式配置且有凭据。live 模式不得自动选择付费模型或退回其他 provider。offline 模式通过真实 Pi CLI 和本机协议 fixture 执行，不访问外部模型。证据写入 `.artifacts/advisor/`，脚本负责隔离及排除凭据。

U4 的 CLI 驱动实施时使用本地 control-cli 技能。在线测试只采用小型临时仓库，不修改当前用户配置。

必须覆盖下面的失败行为。

- 顾问拒绝、超时、限流、只返回思考、JSON 无效或输出截断。
- 一次 assistant 消息并行请求两个 advisor。
- 用户在 review 过程中 steering 或取消。
- 顾问 pass 后，外部进程改变已审查文件。
- review 连续请求修改，直至两次审查或总调用额度耗尽。
- work 状态仍是 consulting 时 reload 或恢复。
- 切换到旧 tree 节点，再开始新工作。
- 没有 Git、存在原有 dirty 内容或材料无法放入上下文。
- 单纯聊天没有代码证据，仍可审查答案，但不能伪造测试结果。

## 集成与交付

实现目录为 `extensions/advisor/`，行为测试为 `tests/advisor.test.mjs`，离线验收脚本为 `scripts/verify-advisor.mjs`。本地 SDK 的真实会话 fixture 同时验证了便宜模型调用 advisor、完成前指出问题、执行模型继续和第二次审查通过。证据文件是 `.artifacts/advisor/verification.json`。

实现完成后，再考虑把目录移为独立 Pi package。没有发布、PR 或提交请求时，不自动执行这些交付动作。

集成验收必须运行在最终合并后的目录，不能只引用某个隔离实现的测试结果。当前已有未提交工作不属于 advisor 的修改范围。

## 选择、限制和未决项

已选定自研原生扩展、单顾问模型、按需规划、完成前确定触发 review、显式模型配置和统一顾问账本。这些选择控制首版状态数量和调用频率。

规划属于模型驱动的软检查。完成 review 的触发由扩展保证，review 的结果仍受模型质量和证据覆盖限制。对所有任意工具实施写入前强制规划，需要另一套工具权限策略，不隐含在本方案中。

自动 review 期间可能已经显示候选完成答复。首版通过后续修正保持结果完整。如果产品要求只显示一份审查后的答复，需要单独设计消息暂存和流式 UI，不应混入首版。

自动 review 的费用不能进入 Pi 原生总量是已确认的接口限制。首版通过独立且去重的账本处理。若要求 `/session` 原生总量绝对完整，需要扩展 Pi 的公开 usage API，属于额外核心修改。

实际执行模型和顾问模型尚未选择。离线验收不依赖具体模型 ID。在线验收之前需要在 `/advisor model` 中明确选择顾问并开启 advisor。

输入软目标、调用限额和 review 次数是推荐默认值。首版不声称节省费用或提高通过率。后续可用相同任务比较纯便宜模型、全程强模型和 advisor 组合，单独记录质量、用量与延迟。
