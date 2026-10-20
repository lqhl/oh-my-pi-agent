# pstack v0.15.28 Pi 适配验收

本次按 [实施计划](pstack-update-plan.md) 更新本地 Pi 快照，上游终点固定为 `d457567332aa6989e753ea289f30ea2bfbc80bc0`。来源和保留差异见 [upstream.json](../skills/pstack/upstream.json)。调查时的 [原始清单](pstack-upstream-audit.json) 保留更新前状态。

## 已交付的变化

- 同步测试行为、合法状态的根因处理、共同假设检验和幂等恢复的四个原则，并更新入口摘要。
- 逐项审查其余变化原则。保留必要的独立说明，采用有价值的精简，不要求正文与上游逐字相同。
- 同步 TypeScript 品牌类型守卫示例，以及迁移、种子数据和替代验证环境的可用性要求。
- ketchup 列全待决事项，使用已有视觉证据，保留当前聊天、只读状态和授权边界。
- 新增显式调用的 sharpen、in-your-own-words、create-formal-verification-skill 和 maintain-formal-verification-skill。本地 pstack 技能总数为 54。
- 将任务推理投入的选择集中到 Pi 执行契约。保留原生模型家族、预算、resume 和失败处理。未修改 settings.json、扩展或 agent 定义。
- 检查脚本新增来源覆盖、来源格式、文档数量和公开命令检查。隔离 fixture 会故意制造错误，确认检查真正失败。

## 离线检查

最终整合命令如下，具体输出保存在 `/tmp/pstack-update-evidence/U5/`。

```bash
./scripts/check-enabled-skills.sh
node --test tests/*.test.mjs
python3 -B -m unittest discover -s tests -p test_pstack_checks.py -v
python3 docs/pstack-upstream-audit.py --upstream /tmp/pstack-upstream-research-20261019
git diff --check
```

离线测试覆盖实际 Pi loader、54 个技能及新增入口的显式调用属性、模式注入与删除、分支与压缩后恢复、会话恢复、延迟重载和历史选择。Python 测试调用真正的检查脚本，覆盖正常快照、文档数量错误、后续重复数量错误、缺失来源、无效 commit 和不存在的公开命令。

新增检查先在旧实现上观察失败。加载测试也分别观察到 50 与 52、52 与 54 的预期差异，再添加对应技能。失败日志保存在 `/tmp/pstack-U0-red.log`、`/tmp/pstack-doc-second-count-red.log`、`/tmp/pstack-U3-red.log` 和 `/tmp/pstack-U4-red.log`。

最终整合检查已通过。Node 的 15 项离线行为测试和 Python 的 6 项检查器测试全部通过，共 21 项。来源与文档检查、54 个技能的实际加载、清单工具和 diff 空白检查均通过。输出分别保存在 `/tmp/pstack-update-evidence/U5/skills.log`、`node-tests.log`、`checker-tests.log` 和 `inventory.json`。

## 真实 CLI 检查

使用隔离的配置、工作目录和 tmux server 启动实际 Pi v1.1.0。显式加载本仓库的模式扩展和技能目录，关闭自动网络、MCP 和其他扩展。没有配置模型，也没有发送代理任务。

启动屏幕列出了全部技能及四个新增入口。依次执行以下命令，通知和状态栏符合预期。

| 命令 | 观察结果 |
| --- | --- |
| `/pstack status` | off。 |
| `/pstack on` | on，状态栏出现 pstack。 |
| `/pstack status` | on。 |
| `/reload` | 资源重载完成。 |
| `/pstack status` | 重载后仍为 on。 |
| `/pstack off` | off。 |
| `/pstack status` | off。 |

屏幕、终端输出和命令摘要保存在 `/tmp/pstack-update-evidence/U5/cli-verified/`。测试创建的 tmux server 已关闭，证据仍在。当前工作会话的模式没有被切换。

纯命令会话可以在内存中保留自定义事件而不创建磁盘会话。此次不以缺失 JSONL 文件判断持久化是否成功。磁盘恢复、分支和压缩后的状态由实际 SDK 测试验证。

## 形式化流程的限定范围试跑

按新技能的规则，在 `/tmp/pstack-update-evidence/U4/fixture/` 生成了项目验证技能、模型、覆盖记录和单命令检查器。原配置 checkout 未被破坏性修改。

验证的性质是，在准备一个回合时，是否注入模式指令由当前选择的分支决定。模型覆盖 `extensions/pstack-mode.ts` 中的 restore、命令处理和 before_agent_start。它只表示两个抽象分支及布尔模式值，并假设完成的处理器串行执行。Pi SDK 的完整分支图、任意交错事件和模型调用均不在证明范围内。

工具是隔离目录中的 Temurin JRE `21.0.12.1+1` 和发布包 `tla2tools.jar v1.7.4`，后者运行时报告 TLC2 2.19。Java 包通过下载元数据的 SHA-256 校验。TLC JAR 的固定 SHA-256 为 `936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88`。

完整基线搜索得到 32 个不同模型状态，未发现违反性质的路径。结果只覆盖上述模型。

试跑得到以下结果。

| 检查 | 真实结果 |
| --- | --- |
| 生成技能的单命令检查 | 基线返回 model_pass，实际 SDK 分支测试通过。 |
| 覆盖代码在 sync commit 之后改变 | 检查返回 needs_review，阻止复用旧模型结果。 |
| 按移除 restore 的代码更新模型 | TLC 返回 counterexample，实际 SDK 分支测试也失败。 |
| 恢复隔离变体 | 模型检查与实际 SDK 测试重新通过。 |
| 指定不存在的 Java | 返回 blocked，覆盖记录的 sync commit 保持不变。 |

反例包含以下步骤。先在左分支打开模式，再切换到模式关闭的右分支。若回合开始时仍使用缓存的 enabled，右分支会错误地得到模式指令。实际 SDK 变体在恢复到默认关闭的分支后也错误地注入了 pstack_mode。这确认了发现的故障机制，而不是模块加载失败。

[保留的反例日志](/tmp/pstack-update-evidence/U4/counterexample-trace.log)、[SDK 故障日志](/tmp/pstack-update-evidence/U4/sdk-counterexample.log) 和 [试跑摘要](/tmp/pstack-update-evidence/U4/summary.json) 提供具体证据。复核时发现最初的公共 TLC 日志会被后续检查覆盖，随后改成每次运行独立保留，并重新捕获了反例及恢复后的结果。

在这些临时工具仍存在时，复跑命令如下。

```bash
cd /tmp/pstack-update-evidence/U4/fixture
python3 .pi/skills/verify-mode-branch/run.py
node --test --test-name-pattern 'branch navigation' tests/pstack-mode.test.mjs
```

缺少临时工具时，按 [形式化工作流验证](../.pi/skills/verify-pstack/features/formal-workflows.md) 重新准备隔离环境。不能把这个有限模型的通过表述为整个 Pi 系统正确。

## 证据边界

技能的文字变化经过内容与引用审查。没有另行调用模型做提示词评估，也没有独立跨模型审查。形式化工作流由当前实施者跟随执行，不是另一个模型完成的评估。静态检查、实际 loader、真实 CLI 和限定模型检查分别证明各自的范围。

没有修改全局 Java、Pi 模型设置、现有会话或原生 agent 配置。没有提交仓库变更、创建 PR、发消息或启动后台目标。下载和试跑产物留在仓库外，作为本次证据保留。
