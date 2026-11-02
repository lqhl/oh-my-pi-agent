# 配置共享通用技能并分别维护 pstack

把通用技能迁到 `~/.agents/skills`，用 `npx skills` 管理安装和来源。加入 baoyu-design。Pi、dsh 和 Claude Code 分别维护自己的 pstack，Codex 暂不接入 pstack。

本文件保留实施清单并标记本轮结果。实际安装、证据与未验证范围见[实施记录](skills-multi-harness-implementation.md)。dsh-pstack 已按用户后续指示退出本轮。

按以下顺序执行，每个单元通过后记录证据。U2 的每一批也单独验收。P1、P2、P3 分别依赖基线，不互相依赖。一个宿主的 pstack 升级失败时，保留该宿主原安装，其余已验证单元可以独立交付。

| 单元 | 工作 | 依赖 | 当前结果 |
| --- | --- | --- | --- |
| U0 | 记录当前安装与验证基线 | 无 | 已记录并备份 |
| U1 | 安装共享 baoyu-design 技能 | U0 | 已安装，发现与画布保存重开通过 |
| U2 | 分批迁移现有通用技能 | U1 | 14 个共享技能就位，无重复；图像 API 调用未测 |
| P1 | 升级 Pi pstack | U0 | v0.15.36，双 SDK 与终端检查通过 |
| P2 | 独立维护 dsh pstack | U0 | 退出本轮，由用户自行升级 |
| P3 | 安装 Claude Code 官方 pstack 插件 | U0 | v0.15.36 已启用，命名空间与 agent 加载通过 |

所有单元都保留现有模型选择和推理预算。普通技能通过共享目录供 Pi、Codex、Claude Code 和 dsh 使用。pstack 不进入共享技能目录。Pi 专用技能、扩展和原生 agent 仍由 Pi 管理。此次接入 baoyu-design 使用普通技能，不同时安装它的 dsh 原生交互插件。

按以下清单执行 U0。

- [x] 读取 Pi 配置仓库和 dsh-pstack 仓库的当前 Git 状态。保留已有修改，不以调研时的版本代替当前事实。
- [x] 记录 Pi 的 `settings.json`、pstack 来源锁、禁用项、实际 loader 结果，以及 dsh 的 `vendor/UPSTREAM`、安装链接、适配与 preset 状态。
- [x] 列出共享目录、Claude Code 技能与插件目录、Codex 技能目录中的相关同名安装。记录 CLI 全局锁文件及已有配置，确认每个待迁移技能的来源。
- [x] 运行当前 Pi 的 `./scripts/check-enabled-skills.sh`，保存原命令、输出和退出码。运行 dsh-pstack 的 `make check`、`make test`、`make check-preset`、`make smoke`。遇到已有失败时先区分基线问题，不把失败归到后续迁移。
- [x] 确认研究过的来源仍可读取。初次安装固定 `skills@1.7.4`，baoyu-design 固定到已审阅 commit `0c257e5e9def6723fdc69a95ec59fc8c414a8282`。pstack 的已审阅候选是 `ae5650febf4320793844c12c4adaa937f417f8da`，对应 v0.15.36。若当前已安装更新版本，重新比较来源，不执行降级。
- [x] 在仓库外建立本次证据目录。保存本次会修改的设置项、来源记录、受管目录和链接的原状态，作为各单元回退材料。

按以下清单执行 U1。

- [x] 用 `npx skills` 把 `claude-design`、`claude-slides`、`claude-design-system`、`claude-dashboard`、`dataviz` 安装到全局共享目录。明确选择 `pi`、`codex`、`claude-code`。dsh 通过自身的共享目录发现取得这些技能。
- [x] 检查安装记录的来源、ref 和文件内容。对同名但来源不同的既有技能先处理归属，不覆盖本地自维护内容。
- [x] 验证 Claude Code 的技能链接指向共享副本。用实际 Pi SDK 1.4.0、pi-web SDK 1.2.0 和 dsh 文件系统 provider 读取五个技能，保存名称、路径和诊断。两个技能的既有实验不代替五个技能的本次安装验收。
- [x] 在实际 Pi 终端、Codex app-server 和 Claude Code 初始化协议中检查发现，Codex 未加载 pstack。
- [ ] dsh 完整模型会话未启动。前期实际文件系统 provider 发现与加载已通过。
- [x] 用 `claude-design` 创建临时画布，打开本地编辑器，保存一次修改并重开，核对文件内容。运行本地检查命令并保存截图与输出。此处验证运行流程，不对不同模型的设计质量下结论。
- [x] 更新 `README.md` 的安装命令、来源和使用入口。记录技能来源锁的备份位置及新机器恢复方式。

U1 通过时，四个宿主能发现新技能，代表性画布可运行，原有 pstack 来源与配置未改变。若安装或发现失败，只回退本次新增的技能、链接及对应来源记录。

按以下清单执行 U2。先迁移 `guizang-ppt-skill`，再按现有工作流分批迁移八个宝玉技能。初次迁移保留各技能当前已审阅版本，不顺带升级这些上游。

- [x] 为每一批先记录旧加载路径、固定 commit、配置文件和运行依赖。保留旧来源，直到新副本验证通过。
- [x] 先更新 `tests/test_pstack_checks.py` 等实际受影响的检查用例，证明共享技能被发现、缺失技能会失败、重复名称会失败，且 pstack 的禁用项仍生效。
- [x] 修改 `scripts/check-enabled-skills.sh` 中硬编码八个宝玉 vendor 路径的检查。以必要技能及其受管来源验证迁移结果，保留现有真实 SDK 检查，不另写一套技能 loader。
- [x] 按实际需要调整 `scripts/check-skill-loading.mjs`，让检查覆盖共享技能和仓库自带技能。使离线 fixture 检查与作者机器的全局技能隔离。
- [x] 使用 CLI 安装当前批次的技能并准备其运行依赖。检查 `baoyu-md`、`baoyu-chrome-cdp` 等依赖，不把复制文件当成环境准备完成。
- [x] 验证 guizang 演示稿、前后翻页、Markdown 排版、本地网页抓取、公众号 CLI 入口以及图像配置与字幕解析测试。
- [ ] 真实图像生成、外部站点登录、真实 YouTube 下载与公众号远端草稿未执行。图像服务凭据尚未配置，本轮保留本地检查与预览结果。
- [x] 把 `settings.json` 中本批技能的旧显式挂载项移除，保留 pstack 挂载和全部原有排除项。再次检查实际加载来源与同名冲突。
- [x] 在本批通过后清理不再承担来源管理的 submodule 或旧入口，更新 `.gitmodules` 与 `README.md`。仅清理已经迁移且属于本次管理范围的内容。
- [x] 运行 `./scripts/check-enabled-skills.sh`、受影响的 Node 与 Python 测试，以及 `tests/test_pack_config.py`。只有迁移造成打包假设失效时才修改 `scripts/pack-config.py`，保留 pstack 的既有打包结构。
- [x] 记录本批的安装命令、来源 ref、实际路径、功能证据和回退步骤，再开始下一批。

U2 通过时，当前批次只从预期来源加载，依赖与代表性功能通过。回退时恢复本批的原加载项和来源，只移除本批新增且已确认归属的共享副本。其他批次、其他技能和宿主配置不受回退影响。本地自维护技能继续由原仓库管理，Pi 专用技能留在 Pi 目录。

按以下清单执行 P1。仅在 Pi 配置仓库内升级 pstack，不更改其安装位置。

- [x] 根据当前来源重新比较已审阅候选。先用现有 `scripts/pstack-sync.mjs --from <checkout> --ref <commit> --dry-run` 核对来源与策略覆盖，再在候选中同步 `vendor/pstack` 和 `adapters/pstack/upstream.lock.json`。
- [x] 保留原样上游并运行现有双 SDK 行为检查。本轮 adapter 变更仅为新版 interrogate 的角色与证据规则说明。
- [x] 更新新版 `interrogate` 的 Pi 适配说明。规则要求获授权的执行角色在隔离工作区复现，父会话复跑证据，`pstack-reviewer` 继续只读。本轮没有执行对抗复现。
- [x] 核对模型拒绝后的回退、实际模型家族和后台完成处理。保留用户配置，不把同族补位报告为跨家族审查。
- [x] 保留当前不支持能力的准确状态，特别是 `statechart` 和 `orchestrate`。上游版本更新不自动启用这些能力。
- [x] 按 [verify-pstack](../.pi/skills/verify-pstack/SKILL.md) 验证来源、两个 SDK、模式、恢复、重载与原生角色契约。运行 `./scripts/check-enabled-skills.sh`、`node --test tests/*.test.mjs` 和 `python3 -B -m unittest discover -s tests -p 'test_*.py' -v`。涉及 SDK 的 Node 检查在 CLI 与 pi-web 两个 SDK 上分别运行。
- [x] 在隔离的真实 Pi 终端验证 `/pstack status`、`on`、`off` 和热重载。会话恢复与分支行为由实际 SessionManager 的 SDK 测试覆盖。本轮未启动真实委派与跨模型试跑，已在实施记录中明确标注。
- [x] 更新 Pi 的版本与支持范围说明，再切换现用快照。某项能力阻塞时，报告具体范围，不扩大工具权限来取得通过结果。

P1 的通过条件只针对 Pi。回退使用 Pi 自己的原快照、来源锁和本次修改的适配文件。dsh 与 Claude Code 的 pstack 不随之变化。

P2 已按用户指示退出本轮。dsh-pstack 由其自身维护，不再执行以下原始清单，也不回退该仓库或安装态。

- [ ] 重新读取该仓库的来源与工作树状态。可以采用同一已审阅上游 commit，但不要求与 Pi 长期保持同版本。
- [ ] 在该仓库的独立候选中同步和审查上游，检查实际 commit。现有 `make sync` 追踪 main，不能把其运行结果未经核对就视为固定候选。
- [ ] 仅在该仓库调整适配、preset、来源记录和相关测试。保留 `~/.dsh/pstack`、技能链接和该仓库的安装归属。
- [ ] 执行 `make check`、`make test`、`make check-preset`，再按既有方式安装或更新 preset，执行 `make smoke`。
- [ ] 在实际 dsh 会话验证技能发现、poteto-mode 入口、角色选择和模型映射。核对当前宿主开放的工具字段，不假设旧 preset 与当前版本一致。
- [ ] 保存 dsh 的独立升级结果。失败时恢复该仓库的原 vendor、来源记录和受影响 preset，不阻塞 Pi 的已验证结果。

按以下清单执行 P3。

- [x] 检查 Claude Code 当前插件状态。通过官方 marketplace 添加 `cursor/plugins`，安装或更新 `pstack@cursor-plugins`，使用用户范围。
- [x] 保留 Claude Code 当前模型设置和角色偏好。没有模型配置需求时不自动运行 setup-pstack。
- [x] 在真实 Claude Code 初始化协议中检查 `/pstack:poteto-mode` 和官方 agent 命名空间。
- [ ] 本轮未发送 Claude Code 模型任务，未验证完整技能执行。
- [x] 记录官方插件的版本与来源。由 Claude Code 插件管理器独立更新，安装异常时停用本次插件并保留其他配置。

本轮交付证据如下。未执行的模型与账户操作在实施记录中单列。

- [x] 共享通用技能的名称、来源 ref、实际路径及恢复命令。
- [x] Pi、Claude Code 的 pstack 版本、支持范围和验证结果。dsh-pstack 由用户自行维护。
- [x] Codex 可以使用通用技能，且未接入 pstack 的实际发现结果。
- [x] 每项未执行的真实会话、委派、模型或浏览器检查及其原因。
- [x] 本次修改与清理范围，确认无共享 pstack 源码目录、跨宿主同步器或版本联动。

采用 Laziness Protocol，沿用各宿主现有 pstack 布局。采用 Sequence Work into Verifiable Units，把通用技能的每批迁移和各宿主升级分别验收。已有实验证明了两个普通技能的复制、链接和 Pi、dsh 发现，以及 Pi pstack 同步预检；它们不代替本计划的全局安装和运行验收。
