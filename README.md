# oh-my-pi-agent

我的 [pi coding agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) 个人配置。放到 `~/.pi/agent/` 下即可拥有一个功能完备的终端 AI 编程助手。

## 概览

| 组件 | 路径 | 说明 |
|------|------|------|
| 扩展 | `extensions/` | 14 个 TUI 扩展，涵盖安全、UX 和工作流 |
| 技能 | `skills/` | 30+ 个可安装技能，集成外部服务 |
| 提示词 | `prompts/` | 多智能体工作流模板（侦察→规划→实现→审查） |
| 设置 | `settings.json` | 提供商、模型与思考级别配置 |
| 快捷键 | `keybindings.json` | 自定义 TUI 键盘快捷键 |

## 快速开始

```bash
git clone git@github.com:lqhl/oh-my-pi-agent.git ~/.pi/agent
```

运行 `pi` 即可使用。

## 扩展

### 安全与守护

| 扩展 | 功能 |
|------|------|
| `plan-mode` | 只读探索模式：智能体只能读取和分析，禁止编辑文件 |
| `reload-runtime` | 热重载扩展、技能、提示词和主题，无需重启 |

### 工作流与体验

| 扩展 | 功能 |
|------|------|
| `status-line` | 持久化状态栏，显示当前轮次进度和主题配色 |
| `todo` | 持久化待办列表，存储在会话状态中（分支切换后仍保留） |
| `notify` | 智能体完成操作等待输入时，发送桌面原生通知 |
| `interactive-shell` | 在 TUI 中运行交互式命令（如 `vim`、`git rebase -i`） |
| `inline-bash` | 在聊天中内联显示 bash 命令输出 |
| `handoff` | 将会话上下文转移到新的专注会话中 |
| `summarize` | 对长输出自动生成摘要 |
| `truncated-tool` | 用于构建输出截断工具的工具函数 |
| `working-indicator` | 显示智能体工作状态指示器 |
| `question` / `qna` / `questionnaire` | 向用户提问的交互组件（单问、问答、问卷） |

### 通过 settings.json 安装的扩展包

| 扩展 | 功能 |
|------|------|
| `pi-intercom` | 会话间 1:1 直连通信。同一机器上的 pi 会话可互相发送消息、提问等待回复、传递代码片段与上下文。支持 planner-worker 协作模式，以及子智能体向父会话的决策升级（`need_decision` / `interview_request` / `progress_update`）。内置 `pi-intercom` 技能提供常用协调模式。快捷键 `Alt+M` 打开会话列表面板 |
| `pi-subagents` | 子智能体编排系统。内置 8 个专用智能体：`scout`（代码侦察）、`researcher`（文献研究）、`planner`（方案规划）、`worker`（执行实现）、`reviewer`（代码审查）、`context-builder`（上下文构建）、`oracle`（第二意见）、`delegate`（通用委托）。支持单智能体、链式流水线、并行执行、异步后台运行、分支上下文隔离、intercom 协同等工作流。附带提示词模板和审查循环 |
| `pi-web-access` | 网页搜索与内容提取。零配置即用（Exa MCP 免费搜索），支持 Exa / Perplexity / Gemini API / Gemini Web 多提供商自动回退。提供 `web_search`（搜索含引用来源）、`code_search`（代码/文档搜索）、`fetch_content`（页面内容提取、GitHub 仓库克隆、YouTube 视频理解、本地视频分析、PDF 文本提取）、`get_search_content`（检索已存储内容）。支持视频帧提取、Chrome 浏览器 cookie 认证、搜索策展面板（`/websearch`） |

## 技能

### Google Workspace

| 技能 | 功能 |
|------|------|
| `gccli` | Google 日历：列出、创建、更新活动，查询空闲时间 |
| `gdcli` | Google 云端硬盘：搜索、上传、下载、分享文件 |
| `gmcli` | Gmail：搜索邮件、阅读会话、发送消息、管理草稿与标签 |

### 飞书 / Lark Suite

全套飞书平台集成，来自 [LarkSuite CLI](https://github.com/larksuite/cli)。

### 工程开发

| 技能 | 功能 |
|------|------|
| `diagnose` | 严谨的诊断循环：复现 → 最小化 → 假设 → 插桩 → 修复 → 回归测试 |
| `tdd` | 测试驱动开发：红-绿-重构循环 |
| `prototype` | 快速构建可丢弃的原型以验证设计 |
| `grill-with-docs` | 基于项目文档（CONTEXT.md、ADR）对方案进行严格审查 |
| `improve-codebase-architecture` | 发现代码库中的架构改进机会 |
| `zoom-out` | 拉远视角，获得更高层次的代码理解 |
| `to-issues` | 将计划/规格/PRD 拆分为可独立领取的 Issue |
| `to-prd` | 将当前对话上下文转为 PRD 并发布到项目 Issue 追踪器 |
| `triage` | 通过状态机对 Issue 进行分类 |

### 效率工具

| 技能 | 功能 |
|------|------|
| `caveman` | 超精简通信模式，节省约 75% token 消耗 |
| `grill-me` | 对方案进行无死角拷问，直到达成共识 |
| `handoff` | 将当前对话压缩为交接文档，供其他智能体继续工作 |
| `write-a-skill` | 创建结构规范、支持渐进式加载的新技能 |
| `reflect` | 回顾对话历史，找出错误和改进机会 |
| `learn` | 智能教学：让用户彻底理解本次会话的所有内容 |

### 媒体与文档

| 技能 | 功能 |
|------|------|
| `brave-search` | 通过 Brave Search API 进行网页搜索和内容提取 |
| `browser-tools` | 通过 Chrome DevTools Protocol 进行交互式浏览器自动化 |
| `obsidian-cli` | Obsidian 知识库管理：读写笔记、插件开发 |
| `obsidian-bases` | Obsidian Bases：创建数据库视图、过滤器、公式、摘要 |
| `obsidian-markdown` | Obsidian 风格 Markdown：wikilink、callout、属性等语法 |
| `pdf` | PDF 全套操作：读取、提取、合并、拆分、OCR、表单填写 |
| `transcribe` | 通过 Groq Whisper API 进行语音转文字 |
| `youtube-transcript` | YouTube 视频字幕获取与摘要 |

### 其他

| 技能 | 功能 |
|------|------|
| `find-skills` | 从社区发现和安装新技能 |
| `session-handoff` | 创建详尽交接文档，实现无缝的智能体会话转移 |
| `vscode` | 在 VS Code 中查看 diff 和对比文件 |

## 提示词工作流

| 模板 | 流程 |
|------|------|
| `scout-and-plan` | 侦察→规划：收集上下文，创建计划（不执行实现） |
| `implement` | 实现：智能体在隔离上下文中执行任务 |
| `implement-and-review` | 实现→审查：智能体实现后由审查专家检查并应用反馈 |

## 设置

```json
{
  "lastChangelogVersion": "0.78.0",
  "defaultProvider": "deepseek",
  "defaultModel": "deepseek-v4-pro",
  "defaultThinkingLevel": "xhigh",
  "packages": [
    "npm:pi-intercom",
    "npm:pi-subagents",
    "npm:pi-web-access"
  ]
}
```

模型由提供商动态解析，无需静态白名单。

## 快捷键

```json
{
  "tui.input.newLine": ["ctrl+j", "shift+enter"]
}
```

`Ctrl+J` 和 `Shift+Enter` 均在 TUI 输入框内插入换行（而非发送消息）。

## 目录结构

```
~/.pi/agent/
├── extensions/        # TUI 扩展（TypeScript）
├── prompts/           # 多智能体工作流模板
├── sessions/          # 会话历史（gitignore）
├── skills/            # 已安装的技能模块
├── intercom/          # 会话间通信数据（gitignore）
├── npm/               # npm 缓存（gitignore）
├── .gitignore
├── settings.json      # 提供商与模型配置
├── keybindings.json   # 自定义快捷键
└── README.md
```

## 许可

MIT
