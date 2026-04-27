# Step 7 测试与收尾手工说明

## 当前状态

- 自动化范围：Vitest 缺口已补齐，Playwright 三条主流程与 GitHub Actions workflow 已编写完成
- 本地 E2E 隔离：已通过 `E2E_DATABASE_URL` 环境变量覆盖机制解锁——开发库 `DATABASE_URL` 与 E2E 测试库可并存，互不干扰
- 当前建议：本地实跑前先准备一条数据库名包含 `test` 或 `e2e` 的测试库连接串，并写入 `.env.local` 的 `E2E_DATABASE_URL`

## 本地执行前置条件

1. 已安装依赖：`bun install`
2. 已准备隔离测试数据库，数据库名包含 `test` 或 `e2e`（推荐：Neon 测试 branch 命名 `neondb_e2e`，或本地 Docker PostgreSQL `sspt_e2e`）
3. 已配置最少环境变量：
   - `DATABASE_URL`（开发库，可与测试库不同）
   - `E2E_DATABASE_URL`（指向上面准备的测试库，可选；若不设置则回退到 `DATABASE_URL`，仍受 test/e2e 名称保护）
   - `AUTH_SECRET`
   - `ADMIN_EMAILS=admin-e2e@example.com`
4. OAuth provider 不是必需项，E2E 登录通过 Auth.js session cookie 注入完成

## 本地执行命令

### 先跑当前稳定基线

1. `bun run typecheck`
2. `bun run test`

### 准备测试库

1. `bunx prisma generate`
2. `E2E_DATABASE_URL="$E2E_DATABASE_URL" bunx prisma migrate deploy --schema prisma/schema.prisma`
   （或 `DATABASE_URL=$E2E_DATABASE_URL bunx prisma migrate deploy`，确保 schema 应用到测试库而非开发库）
3. `bun run e2e:reset`

### 运行浏览器自动化

1. `bunx playwright install chromium`
2. `bun run test:e2e`

如需可视化调试，可改为：

1. `bun run test:e2e:headed`

## 预期覆盖

### Spec 1: 管理员创建与发布

- 管理员通过后台新建赛事
- 在赛事列表页发布
- 前台首页与赛事详情页可见

### Spec 2: 报名到提交

- 选手报名
- 管理员接受报名
- 选手确认参赛
- 测试工具切到提交窗口
- 选手提交终稿

### Spec 3: 评分到公示

- 管理员分配两名评委
- 非评审窗口下评分页禁用
- 测试工具切回评审窗口
- 两名评委完成对两份作品的评分
- 后台榜单按预期汇总
- 管理员公开排名后前台出现榜单

## 首次执行后需要回写的文件

1. `acceptance/step-7-testing-checklist.md`
2. `acceptance/step-5-review-ranking-checklist.md`
3. `acceptance/step-5-review-ranking-manual-script.md`
4. `plans/step-7-testing-and-closeout-execplan.md`
5. 如果测试暴露并修复了真实缺陷，再更新 `RESOLVED_ISSUES.md`
