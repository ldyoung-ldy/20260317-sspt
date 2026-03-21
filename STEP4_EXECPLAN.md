# Step 4 作品提交落地 ExecPlan

这个 ExecPlan 是一份活文档。后续如果继续补 Step 4 的 live QA、修复联调问题或调整文案，需要同步更新 `Progress`、`Surprises & Discoveries`、`Decision Log` 和 `Outcomes & Retrospective`。

本文件遵循 `~/.agents/PLANS.md` 的要求编写，并以当前仓库工作树为唯一上下文。

## Purpose / Big Picture

完成这轮改动后，已经确认参赛的用户可以在作品提交窗口内进入 `/events/[slug]/submit`，保存草稿、提交终稿，并在截止前继续修改最新版本。用户还可以通过 `/my/projects` 查看自己跨赛事的作品列表，管理员则可以在 `/admin/events/[id]/projects` 按状态、赛道和关键字筛选作品、查看详情并导出 CSV。

这次实现的可见成果不是“新增了一些类型”而已，而是把赛事主链路从“报名确认”推进到了“作品提交完成、后台可管理”的下一阶段。验证方式包括静态校验、单元测试，以及后续需要补齐的真实登录态手工联调。

## Progress

- [x] (2026-03-21 11:40Z) 读取 `PLAN.md`、`TODOS.md`、`DESIGN.md`、Prisma schema、Step 3 报名流与后台导出实现，确认 Step 4 复用点与约束。
- [x] (2026-03-21 11:52Z) 新增 `src/lib/projects/*` 领域层，补齐作品表单 schema、配置解析、状态 helper、后台筛选解析和查询层。
- [x] (2026-03-21 11:58Z) 新增 `src/app/my/projects/actions.ts`，实现 `createProject`、`updateProject`、`submitProject`，并统一权限、时间窗口和 confirmed 校验。
- [x] (2026-03-21 12:04Z) 新增 `/events/[slug]/submit`、`/my/projects`、`/admin/events/[id]/projects` 与 CSV 导出路由，接通 Header、赛事详情页和后台赛事列表入口。
- [x] (2026-03-21 12:07Z) 补齐 Step 4 单元测试并执行 `bun run lint`、`bun run typecheck`、`bun run test`，全部通过。
- [x] (2026-03-21 12:13Z) 回写 `PLAN.md`、`TODOS.md`、`acceptance/step-4-project-submission-checklist.md`、`acceptance/step-4-project-submission-manual-script.md`。
- [ ] (2026-03-21 12:13Z) 使用真实数据库和浏览器登录态补一次完整 live QA，把结果回写到 acceptance 文档。

## Surprises & Discoveries

- Observation: Step 4 最容易和旧计划冲突的地方不是数据结构，而是“终稿是否锁定”这个交互口径。
  Evidence: `PLAN.md` 原文写的是“终稿状态：表单只读”，但本轮实现按照已确认方案落地为“截止前仍可继续编辑并再次提交”。

- Observation: Step 3 已经把 `safeActionWithSchema`、CSV 导出模式和后台筛选布局定型，所以 Step 4 最稳妥的做法是沿用这套模式，而不是引入新的页面状态管理或表格依赖。
  Evidence: `src/app/my/registrations/actions.ts`、`src/app/admin/events/[id]/registrations/page.tsx`、`src/app/admin/events/[id]/registrations/export/route.ts` 都能直接迁移实现思路。

- Observation: 作品查询层如果不给事件 select 补齐 `registrationStart` / `registrationEnd`，`getEventPhase()` 的推断会缺字段。
  Evidence: Step 4 查询层初版已经暴露出这一依赖，后续已补齐字段并统一通过 `bun run typecheck`。

## Decision Log

- Decision: 不修改 Prisma schema，继续使用 `Project` 的现有字段，只把作品提交限定为链接型交付物。
  Rationale: 当前模型已经覆盖 Step 4 所需的名称、描述、赛道、赛题、链接和状态字段；文件上传属于后续范围，不应在本轮扩大改动面。
  Date/Author: 2026-03-21 / Codex

- Decision: `submitProject` 采用 upsert，`updateProject` 只更新已有作品。
  Rationale: 这样可以支持“首次直接提交终稿”，同时保持“更新草稿”语义清晰，不把 `updateProject` 变成隐式创建。
  Date/Author: 2026-03-21 / Codex

- Decision: 点击“保存草稿”时统一把状态写成 `DRAFT`，即使之前是 `FINAL`。
  Rationale: 这让两个主要动作的语义稳定明确：“保存草稿”就是当前版本回到草稿，“提交终稿”就是把当前版本设为终稿。
  Date/Author: 2026-03-21 / Codex

- Decision: 后台作品详情不新增独立路由，沿用列表页同页展开详情卡片。
  Rationale: 这符合 Step 4 MVP 范围，也和现有后台“顶层列表 + 子页面入口”结构保持一致。
  Date/Author: 2026-03-21 / Codex

## Outcomes & Retrospective

Step 4 的代码面已经闭环：confirmed 用户能获得作品提交入口，提交页能保存草稿和终稿，我的作品页能查看状态，管理员后台能筛选、看详情和导出 CSV。新增的单元测试和全量 `lint/typecheck/test` 已证明这批代码在当前仓库里是可编译、可通过测试的。

当前仍未完成的部分是 live QA。因为这需要真实数据库、真实 OAuth 登录态和至少一组管理员/普通用户数据，所以本次实现会话只把验收脚本和清单先归档到 `acceptance/`，等待下一次联调把最后一条“真实链路验证”补齐。

## Context and Orientation

本仓库是一个 Next.js 16 + Prisma + Auth.js 的 AI 赛事管理平台，已经完成到 Step 3 报名流程。Step 4 需要接在“用户报名被管理员接受并确认参赛”之后。与本轮工作最相关的文件如下：

- `prisma/schema.prisma`：`Project` 模型已存在，本轮不做 migration。
- `src/lib/action-result.ts`：定义了 `safeActionWithSchema` 与统一错误返回结构，Step 4 的 server action 全部复用这套模式。
- `src/lib/events/phase.ts`：原本负责赛事阶段推断，本轮新增作品提交窗口 helper。
- `src/lib/registrations/*` 与 `src/app/my/registrations/actions.ts`：Step 3 的数据校验、写操作和后台导出实现，是 Step 4 的直接参考。
- `src/lib/projects/*`：本轮新增的作品领域层，包括 schema、状态 helper、查询与筛选解析。
- `src/app/my/projects/actions.ts`：本轮新增的作品写操作入口。
- `src/app/events/[slug]/submit/page.tsx`、`src/app/my/projects/page.tsx`、`src/app/admin/events/[id]/projects/page.tsx`：本轮新增的三张核心页面。
- `src/app/admin/events/[id]/projects/export/route.ts`：后台作品 CSV 导出。
- `acceptance/step-4-project-submission-checklist.md` 与 `acceptance/step-4-project-submission-manual-script.md`：本轮新增的验收归档。

这里的“confirmed 用户”指 `Registration.status === CONFIRMED` 的参赛者；“终稿”指 `Project.status === FINAL`；“live QA”指接真实数据库和真实浏览器登录态跑完整业务链路，而不是只跑单元测试。

## Plan of Work

第一步，在 `src/lib/projects/schema.ts` 定义作品表单输入 schema，负责基础字段的必填与 URL 校验，并提供一个结合赛事配置的二次校验函数，用来校验赛道和赛题是否合法。然后在 `src/lib/projects/queries.ts` 实现三类查询：作品提交页查询、我的作品列表查询、后台作品管理查询与筛选解析。与此同时，在 `src/lib/projects/status.ts` 统一作品状态枚举和值到文案的映射。

第二步，在 `src/app/my/projects/actions.ts` 实现三个 server action。它们必须统一检查用户已登录、赛事已发布、当前时间处于提交窗口内、当前用户报名状态为 `CONFIRMED`，并在成功后 revalidate `/events/[slug]`、`/events/[slug]/submit`、`/my/projects` 和 `/admin/events/[id]/projects`。其中 `createProject` 负责首次保存草稿，`updateProject` 只更新已有作品并把状态写成 `DRAFT`，`submitProject` 则允许首次直接提交终稿或更新已有终稿。

第三步，补前台与后台页面。`src/app/events/[slug]/submit/page.tsx` 负责处理三种阻断态和一个可编辑态，并复用 `src/components/projects/project-form.tsx` 这个客户端表单。`src/app/my/projects/page.tsx` 负责汇总用户作品、展示状态与下一步提示。`src/app/admin/events/[id]/projects/page.tsx` 则采用与报名管理页相似的结构，提供统计卡片、筛选表单、表格列表、同页详情卡片与导出入口。最后还需要修改 `src/components/app-header.tsx`、`src/app/events/[slug]/page.tsx` 和 `src/app/admin/events/page.tsx`，把作品入口联动接起来。

第四步，补测试与文档。测试至少覆盖作品表单 schema、赛道/赛题合法性、作品状态 helper、后台筛选解析以及作品提交窗口 helper。文档层需要同步实际行为，尤其是“终稿在截止前仍可继续编辑”这一决策，并把 Step 4 的手工验收脚本放进 `acceptance/`。

## Concrete Steps

在仓库根目录执行以下命令：

    bun run lint
    bun run typecheck
    bun run test

本次实现的实际结果如下：

    $ bun run lint
    $ eslint .

    $ bun run typecheck
    $ tsc --noEmit

    $ bun run test
    Test Files  13 passed (13)
    Tests       50 passed (50)

如果下一位执行者要继续做 live QA，按 `acceptance/step-4-project-submission-manual-script.md` 的步骤，在本地启动开发环境并导入登录态后完成浏览器联调，再把结果回写到 checklist。

## Validation and Acceptance

当前已经完成的验证是：

- `bun run lint` 通过。
- `bun run typecheck` 通过。
- `bun run test` 通过，且总计 13 个测试文件、50 个测试用例全部通过。
- 新增的 Step 4 测试覆盖了作品 schema、窗口 helper、后台筛选解析和项目状态 helper。

当前尚未完成但必须补齐的验收是：

- confirmed 用户首次保存草稿。
- confirmed 用户直接提交终稿。
- `FINAL` 状态截止前继续修改并再次提交。
- 非 confirmed 用户访问 `/events/[slug]/submit` 被阻断。
- 管理员后台查看作品详情并导出当前筛选结果。

这些场景的详细步骤已经记录在 `acceptance/step-4-project-submission-manual-script.md`。

## Idempotence and Recovery

本轮改动没有数据库 migration，也没有新增依赖，因此重复运行 `bun run lint`、`bun run typecheck`、`bun run test` 是安全的。作品写操作本身受 `@@unique([eventId, submittedBy])` 限制，重复提交不会生成多份作品，只会更新当前用户在该赛事下的同一条记录。

如果后续 live QA 发现问题，优先修改 `src/lib/projects/*` 或 `src/app/my/projects/actions.ts` 里的领域逻辑和校验逻辑，再重新执行三条验证命令。回滚时不需要处理数据库 schema，只需要回退相关 TypeScript 文件即可。

## Artifacts and Notes

本轮最重要的新增文件与行为如下：

- `src/lib/projects/schema.ts`：作品表单 schema、赛道/赛题合法性校验、挑战赛题 JSON 解析。
- `src/lib/projects/queries.ts`：作品提交页、我的作品页、后台作品管理页查询，以及后台筛选解析。
- `src/app/my/projects/actions.ts`：作品创建、更新草稿、提交终稿。
- `src/components/projects/project-form.tsx`：双动作表单，提供“保存草稿”和“提交/更新终稿”。
- `src/app/events/[slug]/submit/page.tsx`：提交页与阻断态。
- `src/app/my/projects/page.tsx`：我的作品。
- `src/app/admin/events/[id]/projects/page.tsx` 与 `export/route.ts`：后台列表、详情与导出。

## Interfaces and Dependencies

本轮没有新增第三方依赖，仍只依赖现有的 Next.js、Prisma、Auth.js、Tailwind CSS 和仓库内已有 UI 组件。

实现完成后，以下接口必须存在并保持语义稳定：

- `src/lib/events/phase.ts` 中的 `canSubmitProjectForEvent(...)`：判断当前是否处于作品提交窗口。
- `src/lib/projects/schema.ts` 中的 `projectFormSchema`、`parseProjectConfig(...)`、`validateProjectFormInput(...)`：负责表单输入和赛事配置合法性校验。
- `src/lib/projects/queries.ts` 中的 `getProjectSubmissionPageData(...)`、`getUserEventProject(...)`、`listUserProjects(...)`、`getAdminEventProjects(...)`、`parseAdminProjectFilters(...)`。
- `src/app/my/projects/actions.ts` 中的 `createProject(...)`、`updateProject(...)`、`submitProject(...)`。

更新说明：2026-03-21 首次写入本 ExecPlan，并按实际实现结果补齐了最终文件列表、验证命令和“live QA 仍待补”的当前状态，目的是让后续执行者可以直接接着做联调和验收归档。
