# Step 7 测试与收尾验收清单

> 验收日期: 2026-03-23 | 状态: 🟢 全部工程交付完成，CI 全量绿灯（lint + typecheck + Vitest + Playwright E2E）

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
- [x] GitHub Actions 首次全量绿灯已确认（Run 23422018389）

## 5. 当前验证结论

- [x] `bun run typecheck` 通过
- [x] `bun run test` 通过
- [x] `bun run test:e2e` CI 通过（GitHub Actions，隔离 PostgreSQL `sspt_e2e`）

## 6. 本地 E2E 说明

本地 E2E 需要隔离测试库（数据库名含 `test` 或 `e2e`）。当前 `.env.local` 的 `neondb` 受保护逻辑阻止，reset/seed 不会执行。
