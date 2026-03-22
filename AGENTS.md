# 仓库 Agent 指南

## 关键框架说明

- 本项目使用 `next@16.2.0`，不要按旧版 Next.js 习惯写代码。
- 修改路由、`proxy.ts`、认证处理、Server Components、Server Actions 前，先阅读 `node_modules/next/dist/docs/` 里的对应文档，并留意废弃提示。

## 常用命令

- 安装依赖：`bun install`
- 启动开发环境：`bun run dev`
- 运行 lint：`bun run lint`
- 运行类型检查：`bun run typecheck`
- 运行测试：`bun run test`
- 运行单个测试文件：`bunx vitest run src/lib/access-control.test.ts`
- 运行常用校验：`bun run lint && bun run typecheck && bun run test`
- 生成 Prisma Client：`bun run db:generate`
- 创建并应用开发迁移：`bun run db:migrate`
- 直接推送 schema 到数据库：`bun run db:push`
- 打开 Prisma Studio：`bun run db:studio`

## 验收资料归档

- 后续所有验收类清单、手工验收脚本、验收记录统一放在仓库根目录 `acceptance/`。
- 新增验收文件时，优先沿用 `step-x-主题-checklist.md`、`step-x-主题-manual-script.md` 这类命名，保证同一阶段资料可连续维护。
- 更新功能后如果补充了新的验收口径，优先同步到对应的 `acceptance/` 文件，而不是只保留在对话里。

## 已解决问题归档

- 当开发过程中遇到明确问题，并且已经完成“根因定位 + 实际修复 + 验证通过”后，需要将该问题自动补录到仓库根目录 `RESOLVED_ISSUES.md`。
- 只记录已解决问题，不记录尚未确认、尚未修复或仅停留在猜测阶段的问题。
- 每条记录至少包含：现象、根因、解决方案、验证结果、涉及文件。
- 新记录按时间追加，保证后续会话能够基于该文档快速继承上下文。

## 环境变量

- 按 `.env.sample` 填写：`DATABASE_URL`、`AUTH_SECRET`、`ADMIN_EMAILS`、`AUTH_GITHUB_ID`、`AUTH_GITHUB_SECRET`、`AUTH_GOOGLE_ID`、`AUTH_GOOGLE_SECRET`。
- `src/lib/auth-session.ts` 会在缺少 `AUTH_SECRET` 时直接返回 `null`，这样在认证未配置完成前，首页和进度页仍可正常渲染。

## 设计系统

- 做任何视觉或 UI 决策前，先阅读 `DESIGN.md`。
- 所有字体选择、颜色、间距和美学方向都在 `DESIGN.md` 中定义。
- 不要在没有明确用户批准的情况下偏离设计系统。
- QA 模式中，标记任何不符合 `DESIGN.md` 的代码。
- 新页面优先使用 DESIGN.md 中的零圆角设计体系，现有页面在修改时逐步迁移。

## 架构总览

- `src/app` 使用 App Router。`src/app/layout.tsx` 挂载全局 `AppHeader`。当前首页和后台页面大多还是脚手架/占位实现，尚未进入完整业务流。
- Admin 鉴权是双层防护：`src/proxy.ts` 在请求层拦截 `/admin/:path*`，`src/lib/auth-guards.ts` 在服务端页面/布局里再次校验。新增后台页面时保留这两层，不要只留一层。
- Auth.js 接线分散在三处：`src/auth.ts` 负责 NextAuth 实例和可选 Prisma Adapter，`src/auth.config.ts` 放 providers 与 JWT/session callbacks，`src/app/api/auth/[...nextauth]/route.ts` 导出路由处理器。管理员角色来自 `ADMIN_EMAILS`，逻辑在 `src/lib/access-control.ts`。
- 数据层使用 Prisma，schema 在 `prisma/schema.prisma`。目前同时包含 Auth.js 适配器模型和业务模型：`Event`、`Registration`、`Project`、`ProjectScore`、`EventJudge`。获取 Prisma Client 统一走 `src/lib/prisma.ts`。
- 通用应用工具集中在 `src/lib`。`src/lib/action-result.ts` 定义了标准的 `ActionResult<T>`、`safeAction` 和 `safeActionWithSchema`，后续 Server Action 应优先沿用这套返回约定，并结合 Zod 做校验。
- 测试使用 Vitest，配置在 `vitest.config.ts`，匹配 `src/**/*.{test,spec}.{ts,tsx}`，运行环境为 Node。现有测试采用与实现文件相邻放置的方式。
- UI 使用 Tailwind CSS v4 + shadcn/ui，基础配置见 `components.json`，通用 UI 组件位于 `src/components/ui/*`，项目级布局与导航组件位于 `src/components/*`。新增页面时保持当前圆角卡片式后台风格。
- `tsconfig.json` 中配置了 `@/* -> src/*` 的路径别名，优先使用它，不要写很深的相对路径。

## 当前产品进度

- Step 1 已完成：项目脚手架、Tailwind/shadcn、Prisma schema、Auth.js、管理员角色映射、后台基础布局、首批 Vitest 测试都已接入。
- 当前主线是 Step 2：赛事 schema、赛事 Server Actions、后台赛事 CRUD/发布流程、前台赛事浏览尚未完整实现。
- `src/app/admin/events/page.tsx` 仍是占位页面，`src/app/page.tsx` 目前展示的是环境配置与项目进度，而不是真实赛事数据。
