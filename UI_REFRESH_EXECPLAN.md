# 统一已完成页面的设计语言

这个 ExecPlan 是一份活文档。后续如果我在实施中发现新的设计取舍、字体接入问题或页面结构冲突，会同步更新 `Progress`、`Surprises & Discoveries` 和 `Decision Log`。

本计划与仓库根目录的 `DESIGN.md` 保持一致，并且遵守 `~/.agents/PLANS.md` 的要求。

## Purpose / Big Picture

当前已经完成的页面功能是可用的，但视觉语言还没有完全统一到设计系统里。完成这次调整后，首页、赛事详情、报名页、后台概览、赛事管理、报名审核和“我的报名”页面会共享同一种工业 / 工具型气质：更清晰的字体层级、更克制的蓝色主操作、更统一的卡片与表格密度，以及更稳定的页面头部结构。用户打开这些页面时，会明显感觉这是同一个成熟产品，而不是多个脚手架页面拼在一起。

## Progress

- [x] (2026-03-21 读取阶段) 读取 `DESIGN.md`、设计预览页和已完成页面，确认当前问题集中在全局字体、页面壳层和各页头部/卡片密度。
- [x] (2026-03-21) 统一全局字体、背景和基础间距，让页面默认气质靠近设计预览。
- [x] (2026-03-21) 调整共享展示组件与导航组件，使标题、指标、空状态、徽章和侧边栏遵循同一层级体系。
- [x] (2026-03-21) 重排已完成功能页面的头部、信息区和操作区，让首页、赛事页、报名页和后台页形成一致的结构。
- [x] (2026-03-21) 运行 lint / typecheck / 相关测试，修复由于 UI 调整引入的问题。

## Surprises & Discoveries

- Observation: 设计预览页已经把字体、蓝色主色和圆角层级明确写死在 `design-preview.html` 里，说明这次 UI 调整最应该先从基础字体和壳层入手。
  Evidence: `design-preview.html` 使用 Satoshi、DM Sans、JetBrains Mono，并且页面头部和卡片都采用更克制的 8/12/16px 圆角阶梯。

- Observation: 仓库当前的 `src/app/layout.tsx` 仍在使用 Geist 字体，和设计系统语言不一致。
  Evidence: 读取布局文件后确认 `next/font/google` 里仍然是 `Geist` 与 `Geist_Mono`。

- Observation: 事件详情、报名页和用户中心都可以共享同一套 `PageHeaderCard`、`MetricCard`、`InfoItem` 和统一的表单圆角方案，不需要为每个页面单独发明一套新的视觉语言。
  Evidence: 通过把多个页面改造成同一套头部结构和卡片层级后，`bun run lint`、`bun run typecheck`、`bun run test` 仍然全部通过。

## Decision Log

- Decision: 先统一全局字体和背景，再改页面局部排版。
  Rationale: 字体和背景是用户感知最强的第一层视觉信号，先解决它们能让后续页面改动自然收敛到同一套语言。
  Date/Author: 2026-03-21 / Codex

- Decision: 这次调整优先覆盖“已完成的功能页面”和共享组件，不触碰业务流程与数据结构。
  Rationale: 用户请求的是 UI 对齐，而现有业务逻辑已经可用；保持改动面收敛可以降低回归风险。
  Date/Author: 2026-03-21 / Codex

## Outcomes & Retrospective

这次调整完成后，首页、赛事详情、报名页、后台概览、赛事列表、赛事编辑、报名审核和“我的报名”页面已经收敛到同一套工业 / 工具型语言。全局字体切换为 Satoshi / DM Sans / JetBrains Mono 的组合，页面背景加入了更克制的浅色层次，头部卡片和共享组件也统一到更紧凑的圆角与密度。验证结果是 `bun run lint`、`bun run typecheck`、`bun run test` 全部通过。

仍保留少量旧页面结构的原因是它们本来就承担功能密集型任务，完全重写会增加回归风险；当前做法是在不碰业务逻辑的前提下，让视觉语气先统一起来。

## Context and Orientation

仓库里与本次工作最相关的文件是：

- `DESIGN.md`：设计系统的正式来源，定义字体、颜色、间距和圆角。
- `design-preview.html`：视觉参考页，提供更接近成品的排版与色彩样例。
- `src/app/layout.tsx`：全局字体与应用壳层入口。
- `src/app/globals.css`：全局颜色变量、基础排版与背景。
- `src/components/page-header-card.tsx`、`src/components/metric-card.tsx`、`src/components/empty-state.tsx`、`src/components/info-item.tsx`：页面内复用的展示组件。
- `src/components/app-header.tsx`、`src/components/admin-sidebar.tsx`、`src/components/mobile-nav.tsx`：全站导航。
- `src/app/page.tsx`、`src/app/events/[slug]/page.tsx`、`src/app/events/[slug]/register/page.tsx`、`src/app/admin/page.tsx`、`src/app/admin/events/page.tsx`、`src/app/admin/events/[id]/edit/page.tsx`、`src/app/admin/events/[id]/registrations/page.tsx`、`src/app/my/registrations/page.tsx`：这次要对齐设计语言的已完成页面。

这里的“页面壳层”指顶部导航、页面背景、统一内容宽度和首屏标题区。这里的“共享展示组件”指那些被多个页面重复使用的小组件，例如标题卡片、指标卡、空状态和信息行。

## Plan of Work

第一步，修改 `src/app/layout.tsx` 和 `src/app/globals.css`，把基础字体切换到设计系统所需的组合，并加上更克制的浅色背景层与更统一的正文行高。第二步，调整共享展示组件和导航组件，让所有页面在标签、标题、按钮、徽章、空状态和侧边栏上使用同一套密度与圆角。第三步，回到首页、赛事详情、报名页、后台概览、赛事列表、赛事编辑、报名审核和我的报名页面，收紧首屏信息层级、合并重复说明文字，并把操作区整理成更像控制台的布局。最后，运行项目校验命令确认 UI 调整没有破坏类型、构建或现有测试。

## Concrete Steps

在仓库根目录执行：

    bun run lint
    bun run typecheck
    bun run test

如果 lint 或 typecheck 报错，先修复与字体变量、组件属性或 Tailwind 类名相关的问题，再重新执行同一命令。UI 调整不应引入数据库迁移或新增依赖，因此不需要额外的安装步骤。

## Validation and Acceptance

完成后，启动开发服务并手动检查以下结果：

- 首页、赛事详情、报名页和“我的报名”页面都应显示更统一的标题层级、卡片边界和按钮密度。
- 后台页顶部应更像控制台：先给出页面目标，再给出表格、指标和操作区，而不是单纯的空白标题。
- 表单页与审核页的输入、提示和批量操作区应更清楚地分组，视觉上更接近设计预览页。

同时，`bun run lint`、`bun run typecheck` 和 `bun run test` 都应通过，没有新增的失败。

## Idempotence and Recovery

这些改动是纯前端样式和布局调整，重复运行不会破坏数据。如果某一步视觉效果不理想，可以只回退对应的共享组件或页面文件，不需要回退数据库或认证配置。验证命令也可以反复执行，作为回退后的检查手段。

## Artifacts and Notes

后续如果需要记录关键差异，我会把最重要的页面截图或终端输出简要补到这里，便于复盘。

## Interfaces and Dependencies

本次调整只会依赖现有的 Next.js、Tailwind CSS v4、shadcn/ui 组件和仓库里已有的 `src/lib` 工具函数，不新增第三方依赖。若需要新字体加载，会优先使用仓库已有的 Next 字体方案或全局 CSS 导入，而不是引入新的包。
