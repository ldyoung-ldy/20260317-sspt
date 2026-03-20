# 已解决问题记录

> 记录在实际开发过程中遇到、已经定位根因、并已完成修复和验证的问题。
> 仅记录“已解决”问题，不记录尚未确认或尚未修复的猜测。

## 2026-03-20 — Google 登录出现 `Configuration` 错误

- 现象：点击“登录 -> 使用 Google 登录”后，页面跳到 `Server error`，Auth.js 返回 `error=Configuration`。
- 根因：服务端 Auth.js 在拉取 Google OIDC 配置时使用 Node/undici 的 `fetch`，当前环境下该请求没有自动走 `HTTP_PROXY` / `HTTPS_PROXY`，导致访问 Google 超时。
- 解决方案：新增 `src/lib/server-proxy.ts`，在 `src/auth.ts` 初始化阶段为服务端请求配置代理；同时显式加入 `undici` 依赖，确保运行时可以通过代理访问 Google。
- 验证：本地已验证 Auth.js 登录入口可正确生成并跳转到 Google 授权地址，不再返回 `Configuration` 错误。
- 涉及文件：`src/lib/server-proxy.ts`、`src/auth.ts`、`package.json`、`bun.lock`

## 2026-03-20 — Server Component 调用 `buttonVariants()` 导致构建失败

- 现象：`next build` 失败，报错 `Attempted to call buttonVariants() from the server but buttonVariants is on the client`。
- 根因：`buttonVariants` 定义在客户端组件文件 `src/components/ui/button.tsx` 中，但被多个 Server Component 页面直接调用。
- 解决方案：新增服务端可用的链接按钮样式工具 `src/lib/button-link.ts`，并将首页、后台赛事页、赛事详情页中的链接按钮切换到该工具生成的 className。
- 验证：修复后 `bun run build` 成功通过。
- 涉及文件：`src/lib/button-link.ts`、`src/app/page.tsx`、`src/app/admin/events/page.tsx`、`src/app/admin/events/new/page.tsx`、`src/app/events/[slug]/page.tsx`

## 2026-03-20 — 构建期数据库不可达导致首页预渲染失败

- 现象：`next build` 在预渲染 `/` 时失败，Prisma 查询抛出数据库连接错误，导致整个构建中断。
- 根因：前台公开赛事查询默认直接访问数据库；当构建阶段数据库暂时不可达时，公开页没有降级兜底逻辑。
- 解决方案：在 `src/lib/events/queries.ts` 中对公开查询和后台列表查询增加失败兜底，在 Prisma 不可用或查询异常时返回空数组 / `null`，让页面展示空状态而不是直接崩溃。
- 验证：在数据库不可达条件下，项目已可成功执行 `bun run build`。
- 涉及文件：`src/lib/events/queries.ts`
