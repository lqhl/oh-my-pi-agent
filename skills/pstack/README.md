# pstack for Pi

本目录包含 54 个技能。来源与保留差异记录在 [upstream.json](upstream.json)。

这是 Poteto pstack 的本地 Pi 适配。工程原则、设计探索、审查标准和日常流程来自 pstack，执行使用已有的 Pi、`pi-subagents`、`pi-goal` 和会话工具。文件直接保存在当前仓库，按固定上游版本手工审查更新，不自动覆盖 Pi 改写。本版已审查到上游 v0.15.28。

## 日常使用

重启 Pi，或在当前会话运行 `/reload-runtime`，使新增扩展和 skills 生效。

```text
/skill:poteto-mode 给这个 CLI 增加 --json。保留现有文本输出，运行真实命令检查 JSON、文本和退出码。
```

持续使用这套流程时：

```text
/pstack on
/pstack status
```

然后直接描述任务。`/pstack off` 关闭持续模式。开关只影响当前会话及其分支，会随恢复、压缩和分支切换重建；新会话默认关闭。模式不会自行启动任务、目标或定时循环。普通闲聊不会创建 playbook。

显式调用一个含委派步骤的工作流 skill，表示运行其限定的流程。只打开模式、任务很大或自动匹配到 playbook，不等于授权启动子 agent。没有委派授权时，由主会话直接完成，并如实标记未进行独立审查。

## 入口

| 需求 | 入口 |
| --- | --- |
| 按任务执行工程流程 | `/skill:poteto-mode` |
| 查用法、选流程 | `/skill:poteto-help` |
| 配置原生 agent 的模型与思考等级 | `/skill:setup-pstack` |
| 复述目标，核对理解 | `/skill:in-your-own-words` |
| 调整任务方法后执行 | `/skill:sharpen` |
| 理解代码、调查历史、讲解 | `/skill:how`、`/skill:why`、`/skill:teach` |
| 汇总本次聊天的进展和待决事项 | `/skill:ketchup` |
| 恢复同一项目的历史工作背景 | `/skill:recall` |
| 比较设计或候选实现 | `/skill:architect`、`/skill:arena` |
| 两个模型独立审查 | `/skill:interrogate` |
| 本地并行覆盖或隔离写入 | `/skill:swarm` |
| 添加或修改 Pi skill | `/skill:create-skill` |
| 创建或维护形式化验证 | `/skill:create-formal-verification-skill`、`/skill:maintain-formal-verification-skill` |
| 生成或维护真实项目验证流程 | `/skill:create-verification-skill`、`/skill:maintain-verification-skill` |
| 驱动真实本地 CLI/TUI 或浏览器 | `/skill:control-cli`、`/skill:control-ui` |

`ketchup` 从你上次发言之后的当前聊天整理进展，逐项列全仍等待你的决定，并用已有证据解释变化。事项数量不受总字数上限限制。`in-your-own-words` 只复述目标和问题，`sharpen` 调整工作方法后执行已授权任务。四者都保持各自的执行边界。

`recall` 默认查当前工作目录最近七天更新过的 Pi 会话，跳过当前会话和子 agent 记录，再核对相关 Git、GitHub PR 和 issue。它复用 `analyze-sessions` 的解析库，通过只读选择脚本先检查会话头的项目路径，再读取匹配内容。`vcc_recall` 只查当前会话。

```text
/skill:ketchup
/skill:recall 我上周做的 pstack 集成，现在到哪一步了？
```

其余 skill 包括 `blast-radius`、`tdd`、`benchmark-checklist`、`no-comments`、`deslop`、`typescript-best-practices`、`technical-writing`、`unslop`、`show-me-your-work`，以及 24 个 `principle-*`。完整列表由本地目录维护。

[poteto-mode](poteto-mode/SKILL.md) 内含九个 playbook：Investigation、Bug fix、Feature、Refactoring、Perf issue、Prototype、Authoring a skill、Multi-phase plan、Opening a PR。它们是步骤文件，按任务匹配，没有独立 slash command。

## 原生执行

执行规范集中在 [pi-runtime.md](poteto-mode/references/pi-runtime.md)。

- `agents/poteto-agent.md` 定义本地实现角色。子任务边界由主会话给出，叶子 agent 不再次编排。
- `agents/comment-sicko.md` 定义只读评论审查角色，只报告候选删除和具体问题，由主会话接受并修复。
- 编码角色继承当前模型。判断和评论审查使用 `settings.json` 的原生角色覆盖。双模型面板给两个席位显式传入已确认、不同家族的实际 provider/model ID。任务推理投入和原生 fast 选项的限制集中在 Pi 执行规范中，本次更新不修改现有模型配置。
- 多步或并行委派使用一个原生 async workflow。输出绑定在 run 参数上，依赖步骤等待真实终态与证据。运行时或工具加载失败会阻止依赖步骤。
- 并行写入使用从干净源树分配的独立 managed worktree。原生执行器捕获 patch 和 handoff 后可能回收临时 worktree；主会话依据真实 artifact references 审查、整合，再验证整合结果。
- 项目验证 skill 放在 `.pi/skills/verify-<app>/`。优先使用项目已有 harness；缺少工具、服务或凭据时报告阻塞，不能用构建成功替代真实行为验证。

`why` 的数据源限于 Git、GitHub PR/issue、仓库文档、注释和测试。本适配不包含团队消息、工单/异常追踪服务集成，也不包含远程 cloud worker。长期任务只在用户明确请求 goal mode 时使用现有 `pi-goal`，没有额外调度器。上游的 Autopilot、Orchestrate、Babysit、Shipping、Reflect、Automate-me、Correct 与完整 prompt eval 未纳入这版。

形式化验证使用显式入口 `/skill:create-formal-verification-skill` 和 `/skill:maintain-formal-verification-skill`。前者选择性质、工具与边界，生成 `.pi/skills/` 项目验证流程。后者从覆盖代码和 sync commit 检查漂移，区分模型错误与代码缺陷。工具缺失时报告阻塞。默认不修改产品代码，破坏性实验只在隔离副本运行。生成输入测试不能称为形式化证明。

## 维护和检查

新增本地 skill 会由 Pi 递归发现，不需要增加一条 vendor 白名单。不要把另一个同名 skill 放进自动发现目录。

```bash
./scripts/check-enabled-skills.sh
node --test tests/*.test.mjs
python3 -B -m unittest discover -s tests -p test_pstack_checks.py -v
```

检查脚本覆盖显式白名单、本地自动发现目录、重复名称、pstack 名称与目录匹配、相对 Markdown 链接、来源清单和文档数量及公开命令。Python CLI 测试用隔离副本确认错误会导致检查失败。Pi 的实际资源加载还应检查 YAML 解析和运行时 diagnostics。模式测试使用安装在本机的 Pi SDK，检查事件行为、会话分支和资源加载，不调用模型 API。修改扩展后还要在实际会话中验证命令。

按变化选择验证强度。文字调整检查元数据、引用和加载；状态逻辑运行行为测试；脚本运行真实命令；流程变更试跑代表性任务。静态检查通过不等于独立审查或真实产品路径已经通过。

## 来源和许可

本地快照最初基于 [cursor/plugins 的 pstack v0.15.15](https://github.com/cursor/plugins/tree/d73344bee8cf22e53b9d5f4cf5749d38ba38c174/pstack)，commit `d73344bee8cf22e53b9d5f4cf5749d38ba38c174`。本版已逐项审查到 [pstack v0.15.28](https://github.com/cursor/plugins/tree/d457567332aa6989e753ea289f30ea2bfbc80bc0/pstack)，commit `d457567332aa6989e753ea289f30ea2bfbc80bc0`。逐技能的实际来源 commit、采用方式与保留理由见 [upstream.json](upstream.json)。这不表示完整移植了上游所有技能或 playbook。

`ketchup` 最初从上游 commit `978ca6e9c0e012047cd5058b8e829240336e704e` 补入，本次继续同步后续改进。`recall` 来自原始快照，历史查询改为本地 Pi 会话。`control-cli`、`control-ui` 和 `deslop` 来自原始快照的 [cursor-team-kit](https://github.com/cursor/plugins/tree/d73344bee8cf22e53b9d5f4cf5749d38ba38c174/cursor-team-kit)。`create-skill`、Pi 执行规范和模式扩展由本仓库新增。

上游检查工具按来源记录比较，不切换或覆盖 checkout。先在仓库外准备 cursor/plugins clone，再运行：

```bash
python3 docs/pstack-upstream-audit.py --upstream /tmp/pstack-upstream-research-20261019
```

调查时的原始清单保留在 `docs/pstack-upstream-audit.json`。它记录更新前状态。更新后的验证与证据边界见 [实施验收记录](../../docs/pstack-update-verification.md)。

本次按实际范围修改了加载方式、角色/模型配置、委派、异步、隔离、会话恢复和验证路径，并收窄自动发布与越界清理行为。其余原则和参考资料保留上游内容。原始 MIT 许可见 [pstack LICENSE](LICENSE) 和 [cursor-team-kit LICENSE](LICENSE.cursor-team-kit)。
