# Step 7 测试与收尾闭环

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

本仓库未内置 `PLANS.md`，但本文件必须按照 `~/.agents/PLANS.md` 的要求持续维护。

## Purpose / Big Picture

完成本次改动后，这个 AI 赛事管理平台将不再只依赖零散单测和手工验收，而会具备一套能重复运行的完整测试基线。开发者可以在本地或 GitHub Actions 中一键验证三条核心业务链路：管理员创建并发布赛事、选手报名并提交作品、评委评分并发布排名。用户能直接看到的结果是，关键流程出现回归时，测试会在提交阶段暴露问题，而不是等到手工联调或上线前才发现。

本次工作的重点不是新增产品功能，而是把已经落地的 Step 2 到 Step 6 业务能力补成“可持续验证”的工程能力。验证成功的标志有三类：第一，`bun run lint`、`bun run typecheck`、`bun run test`、`bun run test:e2e` 在本地全部通过；第二，GitHub Actions 能在隔离数据库中自举并跑完全量测试；第三，`acceptance/` 中的测试收尾文档同步更新，明确哪些原本待补的手工边界已经转为自动化或已手工闭环。

## Progress

- [x] (2026-03-23 11:30 CST) 读取 `TODOS.md`、`PLAN.md`、`acceptance/step-5-review-ranking-*.md`、现有测试文件和关键 action/query，确认 Step 7 的目标是“测试收尾 + E2E + CI”，而不是新增业务功能。
- [x] (2026-03-23 11:30 CST) 确认当前基线：`bun run lint`、`bun run typecheck`、`bun run test` 全绿，现有为 17 个测试文件、71 个测试；仓库尚未接入 Playwright，也没有 `.github/workflows/`。
- [x] (2026-03-23 11:30 CST) 确认自动化登录策略：复用本地 `AUTH_SECRET` 生成 Auth.js JWT 会话 cookie，而不是引入新的测试登录页面或依赖真实 OAuth provider。
- [x] (2026-03-23 11:46 CST) 新建并维护本 ExecPlan，作为 Step 7 的唯一执行说明。
- [x] (2026-03-23 11:46 CST) 补齐 judge/admin 相关服务端写操作的单元与集成测试缺口，当前 Vitest 已增至 18 个文件、81 个测试。
- [x] (2026-03-23 11:46 CST) 接入 Playwright、E2E seed/reset/phase-shift 工具、cookie 登录 helper 与基础 fixture。
- [x] (2026-03-23 11:46 CST) 完成 3 条核心 E2E 流程代码，并将非评审窗口、多评委榜单汇总边界并入评审 spec。
- [x] (2026-03-23 11:46 CST) 新增 GitHub Actions，全量运行 lint、typecheck、Vitest 和 Playwright。
- [x] (2026-03-23 11:46 CST) 更新 `acceptance/` 文档与 `RESOLVED_ISSUES.md`，已新增 Step 7 文档；`RESOLVED_ISSUES.md` 待有真实缺陷修复后再追加。
- [x] (2026-03-23 11:46 CST) 执行 `bun run e2e:reset`，确认测试库保护会阻止对本地 `neondb` 执行 reset/seed。
- [x] (2026-03-23 11:53 CST) 同步更新 `acceptance/step-5-review-ranking-checklist.md` 与 `acceptance/step-5-review-ranking-manual-script.md`，关闭"非评审窗口阻断"和"多评委榜单 spot check"待补项，均已由 `e2e/specs/review-ranking.spec.ts` 覆盖。
- [x] (2026-03-23 12:00 CST) CI 首次全量绿灯已确认（Run 23422018389：lint + typecheck + Vitest 81 tests + Playwright 3 E2E specs）。本地 E2E 需隔离测试库，CI 不受影响。

## Surprises & Discoveries

- Observation: 仓库已经在手工验收文档中证明过“通过本地 `AUTH_SECRET` 生成 localhost 管理员 JWT，并注入浏览器 cookie”这一方案可行，因此 Playwright 不需要走真实 OAuth 登录。
  Evidence: `acceptance/step-2-events-manual-script.md` 的多次执行记录都明确写了“管理员会话来源：通过本地 `AUTH_SECRET` 生成 localhost 管理员 JWT，并注入浏览器 cookie”。

- Observation: 当前 Step 5/6 的真正缺口不是业务实现，而是测试收尾，尤其是“非评审窗口阻断”和“多评委同赛事榜单汇总 spot check”。
  Evidence: `acceptance/step-5-review-ranking-checklist.md` 中这两项仍未勾选；`acceptance/step-5-review-ranking-manual-script.md` 也把它们标为待补边界。

- Observation: 报名、提交、评审三个时间窗口在产品设计上本来就不会重叠，因此 E2E 无法只靠单场赛事顺着自然时间一次跑完全部链路。
  Evidence: `src/lib/events/schema.ts` 强制时间顺序递增，`src/lib/events/phase.ts` 也按离散窗口计算阶段；如果不做测试数据切换或时间推进，单个测试会卡在窗口条件上。

- Observation: 当前仓库已存在 Prisma migration，可以在 CI 中用隔离 PostgreSQL 自举，而不需要继续依赖 Neon 开发库或手工建表。
  Evidence: `prisma/migrations/20260319173000_init/migration.sql` 已存在，且 `prisma/schema.prisma` 已覆盖 Auth.js 与业务表。

- Observation: 当前本地 `.env.local` 指向的数据库名是 `neondb`，不符合 Step 7 为 reset/seed 设计的测试库保护条件，因此本地 Playwright 实跑会被主动阻止。
  Evidence: 通过 `source .env.local` 后读取 `DATABASE_URL` 的数据库名为 `neondb`；当前 `e2e/helpers/env.ts` 仅允许非 CI 环境连接名包含 `test` 或 `e2e` 的数据库。

## Decision Log

- Decision: Step 7 只引入完成目标所需的新依赖，即 `@playwright/test` 作为开发依赖，不新增额外测试框架。
  Rationale: 仓库已有 Vitest，缺的是浏览器级 E2E；Playwright 是 `PLAN.md` 里已明确的目标方案，也是最小必要新增依赖。
  Date/Author: 2026-03-23 / Codex

- Decision: 自动化登录统一使用 Auth.js 会话 cookie 注入，不新增测试专用公开认证路由，不依赖 GitHub/Google OAuth provider。
  Rationale: 这样本地与 CI 都能稳定运行，不需要浏览器跳第三方登录，也避免把测试代码暴露成运行时产品入口。
  Date/Author: 2026-03-23 / Codex

- Decision: E2E 使用独立数据库并提供 reset/seed/phase-shift 工具，严禁直接对开发库或线上库执行清理。
  Rationale: Step 7 会重复创建和删除用户、赛事、报名、作品、评分，如果没有隔离数据库与保护逻辑，极易污染开发数据或误删真实样本。
  Date/Author: 2026-03-23 / Codex

- Decision: 三条主流程 E2E 保持“最少但完整”的覆盖面，边界场景优先下沉到 Vitest 或合并进相关 spec，而不是把 Playwright 套件扩成大量重复脚本。
  Rationale: 当前目标是形成稳定回归网，不是追求用例数量；过多 UI 脚本会显著增加维护成本和脆弱性。
  Date/Author: 2026-03-23 / Codex

- Decision: GitHub Actions 默认全量跑 lint、typecheck、Vitest 和 Playwright，而不是只跑单测。
  Rationale: 用户已明确选择“完整 Step 7 + CI 全量跑”；如果 E2E 只保留本地执行，Step 7 的“上线前兜底”目标并不完整。
  Date/Author: 2026-03-23 / Codex

- Decision: 在本地没有隔离测试库之前，不绕过安全保护去直接运行 Playwright；首次全量实跑优先依赖 CI 的 PostgreSQL service container。
  Rationale: 当前默认数据库名是 `neondb`，直接 reset 会污染开发数据；测试保护逻辑存在的目的就是阻止这种风险，因此不能为了“先跑通”而削弱它。
  Date/Author: 2026-03-23 / Codex

## Outcomes & Retrospective

当前已完成的实现包括：Playwright 依赖、配置、`e2e/helpers/` 工具层、三条主流程 spec、judge/admin 的测试补强、GitHub Actions workflow，以及本轮文档同步（step-5 边界项关闭、step-7 验收清单更新）。`bun run lint`、`bun run typecheck`、`bun run test` 全部通过，Vitest 为 18 个文件、81 个测试；Playwright 3 条 E2E spec 在 CI 的 PostgreSQL service container 中全部通过（Run 23422018389）。本地 E2E 实跑需提供隔离测试库（数据库名含 `test` 或 `e2e`），当前开发库受保护逻辑保护不会误清。

## Context and Orientation

本仓库是一个基于 Next.js 16 App Router、Prisma、Auth.js v5 和 Vitest 的 AI 赛事管理平台。代码主要位于 `src/`，数据库 schema 位于 `prisma/schema.prisma`，当前已经完成 Step 2 到 Step 6 的主业务闭环，但 Step 7 还未落地。当前 `package.json` 里已有 `lint`、`typecheck`、`test`，尚无 Playwright 脚本；仓库根目录也没有 `.github/workflows/`，说明 CI 尚未配置。

本次实现涉及四个主要区域。第一是服务端写操作，它们决定业务约束是否正确执行，关键文件包括 `src/app/admin/events/actions.ts`、`src/app/my/registrations/actions.ts`、`src/app/my/projects/actions.ts`、`src/app/judge/actions.ts`。第二是查询与页面层，关键文件包括 `src/lib/reviews/queries.ts`、`src/app/admin/events/[id]/judging/page.tsx`、`src/app/judge/page.tsx`、`src/app/judge/events/[id]/page.tsx`、`src/app/events/[slug]/page.tsx`。第三是现有测试与验收资料，当前测试文件集中在 `src/**/*.test.ts`，验收文档位于 `acceptance/`。第四是认证与数据库初始化，认证核心在 `src/auth.ts`、`src/auth.config.ts`，数据库迁移位于 `prisma/migrations/20260319173000_init/migration.sql`。

这里会反复提到三个术语。所谓“E2E”是端到端浏览器自动化测试，即真的启动应用、打开页面、点击按钮、提交表单并观察页面结果。所谓“seed”是向隔离测试数据库写入一套稳定且可重复的样本数据，例如 admin、选手、评委、测试赛事和示例作品。所谓“phase-shift”是为了测试不同时间窗口，把赛事的报名、提交、评审时间在数据库层切换到指定阶段，而不是等待真实时间流逝。

## Plan of Work

第一步，搭建测试基础设施。在 `package.json` 中新增 `test:e2e`、`test:e2e:headed`、`test:ci` 脚本，并新增 `playwright.config.ts`。Playwright 配置要负责两件事：其一，在本地和 CI 中统一启动 Next.js 服务；其二，指向固定的 `baseURL`，避免 spec 里硬编码端口。实现这一层时，优先沿用 Bun 命令和仓库现有约定，不增加无关工具链。

第二步，实现认证态 E2E 工具。在新建的 `e2e/helpers/` 中提供 cookie 生成与上下文注入能力，使用 `@auth/core/jwt` 的 `encode` 基于 `AUTH_SECRET` 生成 `authjs.session-token`。不要新增运行时测试登录页面，也不要在产品代码中暴露任何“仅测试可用”的公开入口。Playwright spec 应通过 helper 在浏览器上下文里直接注入 admin、选手、评委的会话 cookie，同时 seed 工具负责保证这些用户在数据库里存在且主键稳定。

第三步，实现隔离数据库的 reset/seed/phase-shift 工具。建议在 `e2e/fixtures/` 或 `scripts/` 下新增 TypeScript 脚本，通过 Prisma 连接测试库。工具至少要支持三类能力：清空与重建一套专用测试数据；为三条 E2E 主流程分别准备可复用赛事样本；把赛事切到报名窗口、提交窗口或评审窗口。因为时间窗口存在严格递增约束，所以 phase-shift 不应走 UI 表单，而应直接通过 Prisma 更新对应赛事时间字段。所有脚本都必须先校验 `DATABASE_URL`，只允许在测试库运行。

第四步，补齐 Vitest 覆盖。新增 `src/app/judge/actions.test.ts`，重点覆盖未登录、未被分配为评委、作品不是终稿、当前不在评审窗口、评分维度与赛事配置不一致，以及重复保存时覆盖旧评分。扩展 `src/app/admin/events/actions.test.ts`，补重复分配评委、分配不存在邮箱、没有有效评分时尝试公开榜单、已有有效评分后允许公开榜单等路径。若实现过程中发现 `src/lib/reviews/queries.ts` 或相关 helper 也存在明显测试空白，再在最贴近业务逻辑的层级补充，而不是把所有行为都堆进 Playwright。

第五步，编写 Playwright 主流程。第一个 spec 覆盖“管理员创建赛事并发布，首页和详情页同步可见”。第二个 spec 覆盖“选手报名，管理员接受，选手确认，赛事切到提交窗口后提交作品”。第三个 spec 覆盖“管理员分配两名评委，两名评委对至少两份终稿作品评分，后台榜单按加权平均和评分人数稳定排序，管理员公开排名后前台赛事详情页出现榜单”。第三个 spec 同时补原有待补边界：先将赛事切到评审窗口外，断言评分页提示“当前不在评审时间窗口内”且按钮禁用；再切回评审窗口并完成评分。多评委榜单 spot check 通过事先确定的样本分数验证排名顺序与评分人数，不依赖人工观察。

第六步，补必要的稳定选择器与页面提示。优先使用现有文本、role 和 `aria-label`。只有在同页重复元素过多、文本不稳定或需要精确定位列表项时，才为对应组件补最少量 `data-testid`。如评审页作品列表、评委分配面板、排名发布按钮、评分表成功或失败提示出现定位不稳定，再在组件中增加测试标识。任何新增标识都应保持中性，不泄露内部实现细节。

第七步，新增 GitHub Actions。创建 `.github/workflows/ci.yml`，在 Ubuntu runner 上安装 Bun、启动 PostgreSQL service container、安装依赖、生成 Prisma Client、执行 migration、运行 lint、typecheck、Vitest 和 Playwright。CI 使用专用测试数据库连接串和 `AUTH_SECRET`，不要求配置 GitHub/Google OAuth，因为自动化登录不依赖 provider。workflow 中若需要安装 Playwright 浏览器与系统依赖，应显式加入对应步骤。

第八步，更新文档与归档。新增 `acceptance/step-7-testing-checklist.md` 与 `acceptance/step-7-testing-manual-script.md`，记录本轮自动化覆盖范围、如何本地执行、哪些边界已被自动化替代、哪些仍保留手工 spot check。同步更新 `acceptance/step-5-review-ranking-checklist.md` 与 `acceptance/step-5-review-ranking-manual-script.md`，把这轮补完的边界项改为已验证。如果本轮测试过程中发现并修复真实缺陷，修复完成且验证通过后，将其追加到 `RESOLVED_ISSUES.md`。

## Concrete Steps

在仓库根目录按下面顺序实施并验证。每完成一个阶段，都要把结果回写到本文件的 `Progress`、`Surprises & Discoveries`、`Decision Log` 和 `Outcomes & Retrospective`。

先搭建和验证当前基线：

  1. `bun install`
  2. `bun run lint`
  3. `bun run typecheck`
  4. `bun run test`

预期当前基线仍为全部通过，其中 `vitest` 输出应接近：

  Test Files  17 passed (17)
  Tests       71 passed (71)

接着接入 Playwright 与测试工具后，执行本地数据库初始化与 E2E：

  1. 准备隔离测试数据库连接串，并确保其不是开发库。
  2. 运行 Prisma 迁移或 schema 初始化命令，使测试库具备完整表结构。
  3. 运行 reset/seed 脚本，创建 admin、选手、评委与测试赛事。
  4. `bun run test:e2e`

预期 Playwright 至少会输出 3 个通过的主流程 spec，不应依赖人工登录。任一 spec 失败时，应先看测试数据是否成功 reset/seed，再检查 cookie 注入或页面选择器是否失效。

最后执行全量校验命令，确保本地与 CI 保持一致：

  1. `bun run lint`
  2. `bun run typecheck`
  3. `bun run test`
  4. `bun run test:e2e`
  5. 在 GitHub Actions 对应 workflow 中观察上述命令全部成功。

## Validation and Acceptance

验收分为自动化与文档两部分。自动化验收要求本地和 CI 都能在隔离数据库中完成 `lint + typecheck + Vitest + Playwright` 全绿，其中 Playwright 必须至少覆盖三条主流程：管理员创建发布赛事、选手报名确认并提交作品、评委评分并发布榜单。Step 5/6 遗留的两个待补边界必须在本轮被明确关闭：非评审窗口下评分表禁用并提示，多评委同赛事时后台榜单与前台公示按期望顺序展示。

文档验收要求 `acceptance/step-7-testing-checklist.md`、`acceptance/step-7-testing-manual-script.md` 新增完成；`acceptance/step-5-review-ranking-checklist.md` 与 `acceptance/step-5-review-ranking-manual-script.md` 更新完成；若本轮有真实缺陷被定位和修复，`RESOLVED_ISSUES.md` 也要同步追加。没有这些回写，本轮视为工程实现完成但收尾未闭环。

## Idempotence and Recovery

所有测试数据库操作都必须可重复执行。reset/seed 脚本应设计为幂等：重复运行时，要么先删除旧的专用测试数据再重建，要么使用固定唯一键覆盖原数据，但不能越跑越脏。phase-shift 工具也要可重复调用，每次都把赛事时间改成目标阶段，而不是相对当前时间继续叠加偏移。

最重要的恢复策略是数据库保护。任何会删除或覆盖数据的脚本，在执行前都必须检查连接串并拒绝对非测试库运行。如果误配置导致脚本拒绝执行，应先修正 `DATABASE_URL`，不要移除保护逻辑。若 Playwright 失败并留下脏数据，优先重新执行 reset/seed，而不是手工去数据库里逐条清理。

## Artifacts and Notes

本轮预计会新增或修改以下关键产物：

  - `plans/step-7-testing-and-closeout-execplan.md`
  - `package.json`
  - `playwright.config.ts`
  - `e2e/` 下的 spec、helper、seed/reset/phase-shift 工具
  - `src/app/judge/actions.test.ts`
  - `src/app/admin/events/actions.test.ts`
  - 必要时的少量页面或组件稳定选择器
  - `.github/workflows/ci.yml`
  - `acceptance/step-7-testing-checklist.md`
  - `acceptance/step-7-testing-manual-script.md`
  - `acceptance/step-5-review-ranking-checklist.md`
  - `acceptance/step-5-review-ranking-manual-script.md`
  - `RESOLVED_ISSUES.md`

当前最关键的证据片段是：

  - 现有基线：`bun run lint`、`bun run typecheck`、`bun run test` 已通过，`vitest` 当前为 17 个文件、71 个测试通过。
  - 手工 QA 已证明 cookie 注入可用：`acceptance/step-2-events-manual-script.md` 多次记录“通过本地 AUTH_SECRET 生成 localhost 管理员 JWT，并注入浏览器 cookie”。
  - Step 5 待补边界明确存在：`acceptance/step-5-review-ranking-checklist.md` 中“非评审窗口时表单禁用并显示提示”和“多评委同赛事真实榜单汇总 spot check”仍未完成。

## Interfaces and Dependencies

新增依赖只允许包含完成 Step 7 所必须的部分。仓库需要新增 `@playwright/test` 作为开发依赖，用于浏览器级 E2E。除非实现过程中遇到 Bun 与 Playwright 的明确兼容问题，否则不要再额外引入其他测试框架。

在 `package.json` 中新增以下脚本：

  - `test:e2e`，用于执行 Playwright headless 测试。
  - `test:e2e:headed`，用于本地可视化调试。
  - `test:ci`，用于串联 lint、typecheck、Vitest 与 Playwright。

在新的 E2E helper 层中，最终需要具备以下稳定接口或等价能力：

  - 一个生成 Auth.js session cookie 的函数，输入为用户标识与角色，输出为可注入浏览器上下文的 `authjs.session-token` cookie。
  - 一个 reset 测试数据库的函数或脚本。
  - 一个 seed 样本用户和赛事的函数或脚本。
  - 一个把赛事切到指定阶段的函数或脚本，至少支持报名、提交、评审三个阶段。
  - 一组 Playwright fixture，用于获取 admin、选手、judge A、judge B 的已登录页面上下文。

在 CI 层，workflow 至少需要依赖以下服务与环境变量：

  - PostgreSQL service container，作为隔离测试数据库。
  - `DATABASE_URL`，指向 CI 内的测试数据库。
  - `AUTH_SECRET`，用于生成和验证 Auth.js JWT cookie。
  - `ADMIN_EMAILS`，确保 admin 测试账号在 session 回调中拥有管理员身份。

Change note: 2026-03-23 新建 Step 7 ExecPlan，基于当前仓库现状、验收缺口和用户选择的“完整 Step 7 + CI 全量跑”策略，固定后续实现范围、测试数据方案和 CI 目标。
