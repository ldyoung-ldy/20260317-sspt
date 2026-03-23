# Step 5 评审与排名闭环

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

本仓库未内置 `PLANS.md`，但本文件必须按照 `~/.agents/PLANS.md` 的要求持续维护。

## Purpose / Big Picture

完成本次改动后，管理员可以在单个赛事下分配评委、查看各作品的评分汇总并发布排名；被分配的评委可以看到自己负责的赛事、按评分维度给终稿作品打分并反复修改；前台赛事详情页会在管理员发布排名后展示公开榜单。用户能够直接通过浏览器观察到“分配评委 -> 评委打分 -> 后台汇总 -> 前台公示”的完整闭环，而不是只有数据库模型。

## Progress

- [x] (2026-03-23 10:18Z) 读取仓库现状、Step 2-4 验收材料、Next 16 文档，确认 Step 5 尚未落地。
- [x] (2026-03-23 10:25Z) 确定本轮范围为：评委分配、评委打分、后台汇总、前台排名公示。
- [x] (2026-03-23 10:52Z) 实现评分 schema、评审查询、排名汇总 helper 与服务端写操作。
- [x] (2026-03-23 10:58Z) 实现管理员评审页、评委工作台、单赛事评分页与前台榜单展示。
- [x] (2026-03-23 11:03Z) 补充测试、验收文档，并完成 `bun run lint && bun run typecheck && bun run test` 验证。

## Surprises & Discoveries

- Observation: Prisma schema 里已经存在 `EventJudge`、`ProjectScore`、`rankingsPublished`，说明数据库层为 Step 5 预留好了结构，但 App Router 页面、查询层和 Server Actions 还没有真正接入。
  Evidence: `prisma/schema.prisma` 已定义三者；`rg -n "ProjectScore|EventJudge|rankingsPublished" src prisma` 只命中了 schema 和极少量占位文案。

- Observation: 仓库已经把 Step 2、Step 3、Step 4 的功能做成了“查询层 + Server Action + 页面 + acceptance 文档”的固定模式，本轮应保持同样结构，方便继续维护。
  Evidence: `src/app/admin/events/actions.ts`、`src/lib/projects/queries.ts` 与 `acceptance/step-4-project-submission-checklist.md` 的结构一致。

- Observation: Prisma 的 `Project` 关联字段名是 `scores`，不是 `projectScores`；如果沿用心智模型中的表名直接写 select，会在 typecheck 阶段立刻报错。
  Evidence: `tsc --noEmit` 首轮报错 `projectScores does not exist in type ProjectSelect`，修正为 `scores` 后恢复通过。

- Observation: 并列排名不能直接读取“未回写 rank 的上一项”，否则第二个并列项会拿到默认值 `0`。
  Evidence: `src/lib/reviews/ranking.test.ts` 首轮失败，`rankings[1].rank` 实际为 `0`；改为基于已生成结果数组回填 rank 后测试通过。

## Decision Log

- Decision: 本轮不新增新的数据库表或 enum，而是复用现有 `EventJudge` / `ProjectScore` / `rankingsPublished`。
  Rationale: 当前 schema 已能承载“评委分配”和“按作品打分”，新增结构会扩大迁移与验证成本，不符合继续推进 MVP 主线的目标。
  Date/Author: 2026-03-23 / Codex

- Decision: 评委身份继续沿用普通登录用户，通过 `EventJudge` 关联某赛事来判定其是否具备评审权限，而不是新增全局 `JUDGE` 角色。
  Rationale: 当前 `Role` 只有 `USER` / `ADMIN`，赛事级评委更符合现有模型；这样也能让同一用户在不同赛事中既是选手又是评委。
  Date/Author: 2026-03-23 / Codex

- Decision: 评分只面向当前赛事的终稿作品，并按赛事当前配置的评分维度校验。
  Rationale: MVP 里评审对象应该是已提交终稿的作品；沿用当前评分维度作为唯一真值，能避免引入另一套维度快照机制。
  Date/Author: 2026-03-23 / Codex

## Outcomes & Retrospective

- 已完成：Step 5 第一版业务闭环已经落地，管理员可以在 `src/app/admin/events/[id]/judging/page.tsx` 分配评委并公开排名，评委可以在 `src/app/judge/page.tsx` 与 `src/app/judge/events/[id]/page.tsx` 完成评分，前台 `src/app/events/[slug]/page.tsx` 会在公开开关打开后展示榜单。
- 已验证：`bun run lint`、`bun run typecheck`、`bun run test` 全部通过，测试总数为 62。
- 剩余工作：尚未做完整浏览器 live QA，特别是“真实管理员分配评委 -> 真实评委打分 -> 前台公开榜单”的人工回归还需要后续补跑。

## Context and Orientation

本仓库是一个基于 Next.js 16 App Router 的 AI 赛事管理平台，代码位于 `src/`。公开赛事页位于 `src/app/page.tsx` 与 `src/app/events/[slug]/page.tsx`；后台赛事管理位于 `src/app/admin/events/*`；报名与作品提交已经分别在 `src/app/my/registrations/*` 和 `src/app/my/projects/*` 落地。所有写操作统一使用顶层带 `"use server"` 的 Server Action 文件，并通过 `src/lib/action-result.ts` 返回显式的成功/失败结构，避免直接把预期错误抛成未捕获异常。数据库访问统一经由 Prisma，客户端构造在 `src/lib/prisma.ts`。

本次会新增一个“评审”子域。这里的“评委分配”指管理员把某个已存在的用户邮箱加入某个赛事，使该用户能访问对应赛事的评审页面；“评分”指评委针对某个终稿作品，按赛事配置的多个评分维度输入分数与评语；“排名汇总”指把所有评委的分数汇总成每个作品的平均加权总分，并按总分降序生成榜单；“排名公示”指管理员显式打开开关后，公开赛事详情页才展示榜单。

关键文件如下。`prisma/schema.prisma` 已定义 `EventJudge`、`ProjectScore`、`rankingsPublished`。`src/lib/events/queries.ts` 是赛事查询模式的参考。`src/lib/projects/queries.ts` 展示了如何把 Prisma 记录转成页面可直接消费的视图模型。`src/app/admin/events/actions.ts` 是管理员侧 Server Action 的现有入口，本轮会继续扩展这一文件。`src/components/app-header.tsx` 是全局导航；如需要暴露评审入口，可在这里补充。

## Plan of Work

第一步，在 `src/lib/reviews/` 下建立纯函数和查询层。新增评分输入 schema，用 Zod 校验“作品 ID、各评分维度分数、评语”；新增汇总 helper，把单个评委的 JSON 评分转换为可计算的记录，再汇总为平均总分、参与评分人数、每个维度平均分与排名。这里需要同时提供管理员视角、评委视角和公开榜单视角的数据查询函数，尽量保持输入输出明确，避免页面里直接写 Prisma 细节。

第二步，扩展管理员写操作。在 `src/app/admin/events/actions.ts` 中加入“按邮箱分配评委”“移除评委”“切换排名是否公开”的 Server Action，沿用 `safeActionWithSchema`、认证校验和 `revalidatePath`。评分提交动作放到新的 `src/app/judge/actions.ts`，只允许已登录且已被分配到该赛事的用户执行，并对赛事、作品、时间窗口和评分维度做完整校验。

第三步，实现页面。新增 `src/app/admin/events/[id]/judging/page.tsx` 作为后台评审页，展示已分配评委、终稿作品数量、已评分覆盖率、当前汇总榜单，并提供分配评委和公开榜单开关。新增 `src/app/judge/page.tsx` 作为评委工作台，列出当前用户被分配的赛事和待评分进度；新增 `src/app/judge/events/[id]/page.tsx`，展示作品列表、已保存评分和评分表单。已有赛事详情页 `src/app/events/[slug]/page.tsx` 则追加公开榜单 section，仅在 `rankingsPublished` 为真且存在汇总结果时展示。

第四步，完善导航和文档。在后台赛事列表页和赛事编辑页加入“评审管理”入口，在需要处补充“评审中心”导航。新增 `acceptance/step-5-review-ranking-checklist.md` 与 `acceptance/step-5-review-ranking-manual-script.md`，记录本轮闭环的人工验收口径。纯函数部分补齐 Vitest，至少覆盖评分 schema 校验与排名汇总逻辑。

## Concrete Steps

在仓库根目录执行以下命令并观察结果：

  1. `bun run lint`
  2. `bun run typecheck`
  3. `bun run test`

在本地开发环境可用时，还应启动：

  `bun run dev`

然后按手工脚本验证：

  1. 管理员访问 `/admin/events/[id]/judging`，为一个已存在用户邮箱分配评委。
  2. 该用户登录后访问 `/judge`，能看到赛事卡片和作品数量。
  3. 进入 `/judge/events/[id]`，对终稿作品完成打分并保存。
  4. 管理员刷新 `/admin/events/[id]/judging`，能看到榜单与评分人数汇总。
  5. 管理员打开“公开排名”后，前台 `/events/[slug]` 出现榜单；关闭后榜单消失。

## Validation and Acceptance

自动化验证以 `bun run lint && bun run typecheck && bun run test` 为准，必须全部通过。新增测试要能证明两件事：第一，评分输入会拒绝缺失维度、重复维度、越界分数；第二，多个评委的评分会被正确汇总成平均总分与稳定排名。手工验收则以“管理员分配评委、评委打分、后台看到汇总、前台按开关公示”这个闭环是否真实可操作为准。

## Idempotence and Recovery

本次实现不修改 Prisma schema，因此不需要数据库迁移。分配评委动作必须是幂等的：重复分配同一邮箱应返回明确冲突，而不是写入重复关系。评分动作采用 upsert 语义，同一评委可反复覆盖自己对同一作品的最新评分。若页面或脚本验证过程中产生测试数据，应优先复用已有测试赛事，必要时手动在后台关闭排名公示并移除测试评委。

## Artifacts and Notes

预期会新增或修改的关键产物包括：

  - `plans/step-5-review-and-ranking-execplan.md`
  - `src/lib/reviews/*`
  - `src/app/judge/*`
  - `src/app/admin/events/[id]/judging/page.tsx`
  - `acceptance/step-5-review-ranking-checklist.md`
  - `acceptance/step-5-review-ranking-manual-script.md`

## Interfaces and Dependencies

在 `src/lib/reviews/schema.ts` 中定义：

  - `judgeScoreInputSchema`
  - `type JudgeScoreInput`
  - `parseJudgeScoreEntries(...)`

在 `src/lib/reviews/queries.ts` 中定义：

  - `getAdminEventJudgingData(eventId: string)`
  - `listJudgeAssignedEvents(userId: string)`
  - `getJudgeEventReviewData(eventId: string, userId: string)`
  - `getPublishedEventRankingBySlug(slug: string)`

在 `src/app/admin/events/actions.ts` 中新增：

  - `assignJudgeToEvent(input: { eventId: string; email: string })`
  - `removeJudgeFromEvent(input: { eventId: string; judgeUserId: string })`
  - `toggleRankingsPublish(input: { eventId: string; rankingsPublished: boolean })`

在 `src/app/judge/actions.ts` 中定义：

  - `upsertProjectScore(input: JudgeScoreInput)`

这些接口都必须返回 `ActionResult<T>` 风格的显式结果，并在服务端完成认证、授权和输入校验。

Change note: 2026-03-23 初版 ExecPlan 建立，用于把 Step 5 的实现范围、约束和验收方式固定下来，避免继续沿用后台首页中的旧占位文案。
Change note: 2026-03-23 回写实现结果与验证状态，补充了 Prisma 关系名和并列排名两个实现中发现的问题，确保文档与当前代码状态一致。
