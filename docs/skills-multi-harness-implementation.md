# 多宿主技能管理实施记录

14 个通用技能已安装到 `~/.agents/skills`，由 `skills@1.7.4` 管理。Pi pstack 已独立升级到 v0.15.36，Claude Code 官方 pstack 插件 v0.15.36 已安装并启用。Codex 未接入 pstack。

dsh-pstack 按用户后续指示退出本轮，由其自身升级。本轮停止对该仓库和安装态的后续操作。普通技能仍可通过 dsh 原生的共享目录发现。

| 内容 | 当前来源 | 安装与更新入口 |
| --- | --- | --- |
| 五个 baoyu-design 技能 | `JimLiu/baoyu-design@0c257e5e9def6723fdc69a95ec59fc8c414a8282` | `npx skills` |
| 八个宝玉技能 | `JimLiu/baoyu-skills@1567581c26ec29f4216c6e6835415bf30343b0e3` | `npx skills` |
| guizang | `op7418/guizang-ppt-skill@c91369c449d34755d320a8b81d0734000d99d1ab` | `npx skills` |
| Pi pstack | `cursor/plugins@ae5650febf4320793844c12c4adaa937f417f8da` | 原有 `scripts/pstack-sync.mjs` |
| Claude Code pstack | 官方 `pstack@cursor-plugins`，v0.15.36 | Claude Code 插件管理器 |

共享目录中的 14 个技能分别为 `claude-design`、`claude-slides`、`claude-design-system`、`claude-dashboard`、`dataviz`、`guizang-ppt-skill`、`baoyu-post-to-wechat`、`baoyu-markdown-to-html`、`baoyu-format-markdown`、`baoyu-cover-image`、`baoyu-article-illustrator`、`baoyu-image-gen`、`baoyu-youtube-transcript`、`baoyu-url-to-markdown`。

Pi 和 Codex 使用共享副本。Claude Code 的技能链接指向这些副本。Pi 的八个旧宝玉挂载项已经移除，原有 pstack 挂载与七个排除项保留。guizang 和宝玉的旧 submodule 已归档到本机备份，两个 gitlink 和 `.gitmodules` 已移除。Pi 专用技能、扩展、本地技能及原生角色继续由本仓库维护。

Pi pstack 的 573 个文件通过原样上游完整性检查。新版 `interrogate` 的执行角色映射写入 Pi adapter，复现由获授权的执行角色在隔离工作区进行，父会话复跑命令。`pstack-reviewer` 继续只读。原有禁用与不支持能力未自动启用，模型与推理预算保持原值。

检查脚本继续调用真实 Pi SDK。新增的共享目录参数供离线 fixture 使用。检查覆盖必要技能缺失、同名冲突、错误来源及 pstack 禁用项，测试不会从作者机器的共享目录补齐缺失 fixture。迁移完成后，测试保留真实配置，不再过滤已移除的旧挂载。

宝玉四个脚本目录的 npm 依赖已安装。Bun 1.4.4 已安装并运行。npm 首次阻止了 Bun 的 postinstall，随后使用仅针对 Bun 的 `--allow-scripts=bun` 完成安装，没有修改全局 npm 策略。原有公众号凭据及配置值保留，未发送公众号内容或创建远端草稿。

完整恢复命令见 [README](../README.md)。全局来源记录仍由 CLI 维护，默认位于 `~/.agents/.skill-lock.json`。本机证据与备份位于 [/home/qliu/.cache/skills-multi-harness-X3eZi1Bf](/home/qliu/.cache/skills-multi-harness-X3eZi1Bf)，不纳入仓库。

已完成的验证如下。

| 验证面 | 结果 | 证据 |
| --- | --- | --- |
| baoyu-design 安装与内容 | 五个目录与已审阅上游一致，固定 ref 已记录 | [安装日志](/home/qliu/.cache/skills-multi-harness-X3eZi1Bf/u1-install.log) |
| 宝玉迁移内容 | 八个技能的 220 个受版本控制文件逐个一致 | [文件核对](/home/qliu/.cache/skills-multi-harness-X3eZi1Bf/u2-baoyu-files.json) |
| Pi 双 SDK 发现 | 1.4.0 和 1.2.0 均加载新设计技能，诊断为空 | [发现结果](/home/qliu/.cache/skills-multi-harness-X3eZi1Bf/u1-discovery.json) |
| Codex 实际 app-server | 14 个共享技能可发现，pstack 不在目录中 | [发现结果](/home/qliu/.cache/skills-multi-harness-X3eZi1Bf/codex-discovery.json) |
| Claude Code 实际启动协议 | 共享技能与 `pstack:*` 命令、官方 agent 可发现 | [原生加载结果](/home/qliu/.cache/skills-multi-harness-X3eZi1Bf/claude-discovery.json) |
| 设计画布 | 浏览器渲染、改名、保存到文件、重开均通过 | [重开截图](/home/qliu/.cache/skills-multi-harness-X3eZi1Bf/canvas-reopened.png) |
| guizang、排版与抓取 | 演示稿前后翻页、Markdown 转 HTML、浏览器渲染、本地网页抓取通过 | [浏览器结果](/home/qliu/.cache/skills-multi-harness-X3eZi1Bf/u2-browser.json) |
| 图像配置与字幕解析 | 上游 28 项测试通过，未调用图像服务 | [上游测试](/home/qliu/.cache/skills-multi-harness-X3eZi1Bf/u2-upstream-tests.log) |
| Pi Node 测试 | 两套 SDK 各 33 项通过 | [CLI SDK](/home/qliu/.cache/skills-multi-harness-X3eZi1Bf/p1-node-cli.log)、[pi-web SDK](/home/qliu/.cache/skills-multi-harness-X3eZi1Bf/p1-node-web.log) |
| Pi 原生终端 | status、on、热重载、status、off 通过，没有发送模型任务 | [终端结果](/home/qliu/.cache/skills-multi-harness-X3eZi1Bf/p1-cli-live-final.log)、[终端记录](/home/qliu/.cache/skills-multi-harness-X3eZi1Bf/pi-cli-transcript.txt) |

浏览器测试使用本轮创建的临时文件、Chromium profile 和 CDP。guizang 的 Motion 来自技能自带文件，Lucide 使用官方 npm 包缓存，字体网络请求被禁用。网页抓取针对本地测试文章。浏览器流程最终无页面错误，没有更改上游模板。它证明本地运行与迁移后的资源可用，不代表外部站点的登录、验证码或字幕服务都已验证。

现有的原样上游、加载、会话恢复、模式移除、分支恢复与延迟重载测试均保留。Python 检查与打包用例在两个 SDK 环境下通过。最终检查汇总见证据目录中的 `final-checks.json`。

未验证的范围如下。

- 真实图像生成。当前没有配置图像服务 API key。配置读取、参数解析和现有测试通过，没有替用户选择服务或填写凭据。
- 真实跨模型委派、对抗复现和独立模型审查。本轮没有启动子代理，也没有把同族模型配置计作多模型审查。
- Claude Code 的模型任务执行。此次验证了官方插件安装、启用、命名空间与 agent 加载，没有发送模型任务。
- dsh 模型会话与原生设计交互插件。共享技能在前期使用实际文件系统 provider 验证，dsh-pstack 后续操作由用户接管。
- 外部站点登录、YouTube 真实下载和公众号远端发布。本轮只检查本地运行、解析与预览。

原配置及旧来源的回退材料如下。

| 材料 | 本机位置 |
| --- | --- |
| 原 Pi 设置、来源锁和 `.gitmodules` | `backup/home/qliu/.pi/agent/` |
| 原 Claude Code 设置与插件登记 | `backup/home/qliu/.claude/` |
| 原 guizang checkout | `backup/legacy/guizang-ppt-skill/` |
| 原宝玉 checkout | `backup/legacy/baoyu-skills/` |
| Pi 升级前的原样 vendor | `backup/pi-pstack-before.tar` |

以上位置均相对于本次证据目录。回退通用技能时，恢复对应旧目录与原技能挂载项，再移除本次受管副本、链接和对应锁记录。只恢复相关设置字段，保留后续新增的模型或凭据配置。Pi pstack 的回退只恢复自己的 vendor、来源锁和本次 adapter 修改。Claude Code 插件由其管理器停用或卸载。不要对 dsh-pstack 执行本记录中的回退。

本轮保留了执行前已有的 `pi-vcc-config.json` 本机修改。仓库提交只包含技能迁移、Pi 适配、原样上游快照与相关文档，不包含本机证据、备份和凭据。决策与失败修正保存在 [decisions.tsv](/home/qliu/.cache/skills-multi-harness-X3eZi1Bf/decisions.tsv)。独立模型审查未执行。
