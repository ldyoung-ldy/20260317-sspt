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

## 2026-03-20 — 登录页错误展示占位 GitHub OAuth 入口

- 现象：`/api/auth/signin` 页面会展示 GitHub 登录按钮，但点击后跳转到了带有 `client_id=replace-with-github-client-id` 的 GitHub 授权地址，属于无效配置暴露给真实用户。
- 根因：`src/lib/auth-providers.ts` 仅判断环境变量是否“有值”，没有过滤 `.env.sample` 风格的占位值，导致占位 GitHub 配置被当成真实 Provider 注册。
- 解决方案：在 `src/lib/auth-providers.ts` 中增加占位值识别逻辑，过滤 `YOUR_` / `replace-with-` 这类样例值；同时新增 `src/lib/auth-providers.test.ts` 作为回归测试，覆盖占位值与真实值混用场景。
- 验证：`bun run lint && bun run typecheck && bun run test && bun run build` 全部通过；浏览器实测 `/api/auth/signin` 页面已只展示真实可用的 Google 登录按钮，不再暴露占位 GitHub 按钮。
- 涉及文件：`src/lib/auth-providers.ts`、`src/lib/auth-providers.test.ts`

## 2026-03-20 — 赛事编辑页时间字段因服务端时区出现回填偏移

- 现象：进入 `/admin/events/[id]/edit` 编辑已有赛事时，`datetime-local` 字段使用服务端时区格式化，部署环境与管理员浏览器时区不一致时，页面会显示整体偏移后的时间；即使用户不改时间直接保存，也可能把赛事时间错误重写。
- 根因：服务端页面在渲染前就把数据库中的 `Date` 转成了 `datetime-local` 字符串，这一步依赖 Node 运行时所在机器的时区，而不是管理员浏览器的本地时区。
- 解决方案：将时间字段标准化逻辑挪到客户端表单初始化阶段；新增 `EventFormInitialValues` 与 `normalizeEventFormValues`，让编辑页直接传递原始日期值，由浏览器按本地时区生成 `datetime-local` 输入值。
- 验证：`bun run lint && bun run typecheck && bun run test` 全部通过；新增 `src/lib/events/schema.test.ts` 回归测试，覆盖 ISO/UTC 时间输入在运行时区内的标准化行为。
- 涉及文件：`src/components/events/event-form.tsx`、`src/app/admin/events/[id]/edit/page.tsx`、`src/lib/events/schema.ts`、`src/lib/events/schema.test.ts`
