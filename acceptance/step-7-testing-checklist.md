# Step 7 测试与收尾验收清单

> 验收日期: 2026-03-23 | 状态: 🟢 全部工程交付完成，CI workflow 已配置；E2E 本地实跑需隔离测试库（见阻塞项）

## 1. 自动化基础设施

- [x] `@playwright/test` 已接入
- [x] `playwright.config.ts` 已新增
- [x] `package.json` 已新增 `test:e2e`、`test:e2e:headed`、`test:ci`、`e2e:reset`
- [x] `e2e/helpers/` 已提供 Auth.js cookie、reset/seed、phase-shift、UI helper
- [x] `e2e/fixtures/test.ts` 已提供认证态 Playwright fixture
- [x] reset/seed 工具带测试库保护逻辑，非 CI 下仅允许连接名包含 `test` 或 `e2e` 的数据库
- [x] `bun run e2e:reset` 已验证会拒绝本地 `neondb`，不会误清开发库

## 2. Vitest 覆盖补强

- [x] 新增 `src/app/judge/actions.test.ts`
- [x] 覆盖未登录、未分配评委、非终稿、非评审窗口、stale 评分维度、upsert 覆盖路径
- [x] 扩展 `src/app/admin/events/actions.test.ts`
- [x] 覆盖未知邮箱、重复分配、无有效评分不可公开排名、有有效评分可公开排名
- [x] 当前 `bun run test` 通过，测试文件增至 18 个，测试用例增至 81 个

## 3. Playwright 主流程

- [x] 管理员创建赛事 → 发布 → 前台可见 spec 已编写
- [x] 用户报名 → 管理员接受 → 用户确认 → 提交作品 spec 已编写
- [x] 管理员分配评委 → 双评委评分 → 后台汇总 → 前台公示 spec 已编写
- [x] 非评审窗口阻断验证已并入评审 spec
- [x] 多评委同赛事榜单汇总 spot check 已并入评审 spec
- [ ] 本地 Playwright 实跑完成

## 4. CI

- [x] `.github/workflows/ci.yml` 已新增
- [x] GitHub Actions 使用 PostgreSQL service container（`sspt_e2e`）
- [x] workflow 已包含 `lint`、`typecheck`、`test`、`test:e2e`
- [ ] GitHub Actions 首次全量绿灯待触发推送后确认

## 5. 当前验证结论

- [x] `bun run typecheck` 通过
- [x] `bun run test` 通过
- [ ] `bun run test:e2e` 本地通过

## 6. 当前阻塞

- [ ] 本地 `.env.local` 的 `DATABASE_URL` 指向 `neondb`，不是隔离测试库；出于保护逻辑，当前不会在本地直接执行 reset/seed 与 Playwright
- [ ] 如需本地实跑，需要额外提供一条数据库名包含 `test` 或 `e2e` 的 PostgreSQL 连接串
