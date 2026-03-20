# AI 赛事业务管理平台 — MVP 实施计划 (v2)

> 从零搭建方案 — 基于 CEO Review (SCOPE REDUCTION) 决策
> 审查日期: 2026-03-19 | 模式: SCOPE REDUCTION
> 参考项目: [JunctionApp](https://github.com/hackjunction/JunctionApp) (业务逻辑参考，不 Fork)

## 项目概述

构建一个 AI 赛事管理平台 MVP，支撑核心赛事流程：**赛事配置 → 报名 → 作品提交 → 评委评分 → 排名公示**。

MVP 为**单租户**模式，多租户隔离推迟到 Phase 1.5。

## 技术栈

| 层 | 技术 | 理由 |
|---|------|------|
| 全栈框架 | Next.js 16 (App Router) | SSR + API Routes 一体化，零配置 |
| UI | Tailwind CSS + shadcn/ui | 快速出页面，组件质量高 |
| ORM | Prisma | 类型安全，迁移工具好 |
| 数据库 | PostgreSQL (Neon) | JSONB 处理半结构化数据，免费 0.5GB |
| 认证 | NextAuth.js (Auth.js v5) | 零成本，GitHub/Google 登录 |
| 部署 | Vercel | 零运维，git push 即上线 |
| 测试 | Vitest + Playwright | 单元/集成 + E2E |

## 架构决策记录

| # | 决策 | 选项 | 结论 | 理由 |
|---|------|------|------|------|
| 1 | 开发模式 | Fork JunctionApp / 从零搭建 | 从零搭建 | JunctionApp 用 Node 12/CRA/MUI v4，升级成本 ≥ 重写 |
| 2 | 审查模式 | EXPANSION / HOLD / REDUCTION | REDUCTION | 从零搭建工作量大，必须砍到最小可用 |
| 3 | 租户模型 | 单租户 / 极简多租户 / 完整多租户 | 单租户 | MVP 阶段不需要组织隔离，后续加字段即可 |
| 4 | 数据库 | PostgreSQL / MongoDB / SQLite | PostgreSQL + Neon | 类型安全 + Prisma + JSONB + 外键约束 |
| 5 | Admin 产生 | 环境变量 / 首个注册用户 / 种子脚本 | 环境变量 ADMIN_EMAILS | 最简单最安全，零代码 |
| 6 | 测试策略 | 不写 / 只测核心 / 标准套件 | 标准套件 | 单元 + 集成 + E2E，赛事公正性不能出错 |
| 7 | 状态管理 | Redux / Zustand / RSC | React Server Components | 减少客户端状态，CRUD 应用不需要全局状态库 |
| 8 | API 风格 | GraphQL / REST / Server Actions | Server Actions + Route Handlers | 最简单，Next.js 原生支持 |

## 系统架构

```
  ┌─────────────────────────────────────────────────────┐
  │                    Vercel                             │
  │  ┌───────────────────────────────────────────────┐   │
  │  │           Next.js 16 (App Router)             │   │
  │  │                                               │   │
  │  │  ┌─────────────┐    ┌──────────────────────┐  │   │
  │  │  │  前台页面     │    │  管理后台页面         │  │   │
  │  │  │ /            │    │ /admin/events        │  │   │
  │  │  │ /events      │    │ /admin/registrations │  │   │
  │  │  │ /events/[slug]│   │ /admin/projects      │  │   │
  │  │  │ /submit/[slug]│   │ /admin/scoring       │  │   │
  │  │  │ /rankings/[..]│   │ /admin/rankings      │  │   │
  │  │  └──────┬───────┘    └──────────┬───────────┘  │   │
  │  │         │                       │              │   │
  │  │         ▼                       ▼              │   │
  │  │  ┌──────────────────────────────────────────┐  │   │
  │  │  │     Server Actions + Route Handlers      │  │   │
  │  │  └──────────────────┬───────────────────────┘  │   │
  │  │                     │                          │   │
  │  │              ┌──────▼──────┐                    │   │
  │  │              │   Prisma    │                    │   │
  │  │              └──────┬──────┘                    │   │
  │  └─────────────────────┼──────────────────────────┘   │
  └────────────────────────┼──────────────────────────────┘
                           │
                    ┌──────▼──────┐       ┌──────────────┐
                    │  Neon PG    │       │  NextAuth    │
                    │ (PostgreSQL)│       │ (GitHub/     │
                    └─────────────┘       │  Google)     │
                                          └──────────────┘
```

## 数据模型

### 核心表 (6 张)

```
  User ──────────< Registration >────────── Event
                                              │
                                              ├──< EventJudge >──── User (judge)
                                              │
  User (judge) ──< ProjectScore >── Project ──┘
```

#### Event (赛事)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | String | 赛事名称 |
| slug | String (unique) | URL 标识 |
| description | Text | 赛事描述 (Markdown) |
| startDate | DateTime | 赛事开始 |
| endDate | DateTime | 赛事结束 |
| registrationStart | DateTime | 报名开始 |
| registrationEnd | DateTime | 报名截止 |
| submissionStart | DateTime | 提交开始 |
| submissionEnd | DateTime | 提交截止 |
| reviewStart | DateTime | 评审开始 |
| reviewEnd | DateTime | 评审结束 |
| published | Boolean | 是否公开 |
| rankingsPublished | Boolean | 排名是否已发布 |
| tracks | Json | 赛道配置 |
| challenges | Json | 挑战/赛题 |
| prizes | Json | 奖项/奖金 |
| scoringCriteria | Json | 评分维度配置 [{name, maxScore, weight}] |
| customFields | Json | 自定义报名表单字段 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

#### Registration (报名)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| eventId | UUID → Event | 关联赛事 |
| userId | UUID → User | 关联用户 |
| status | Enum | pending / accepted / confirmed / rejected / cancelled |
| teamName | String? | 队伍名称 |
| answers | Json | 自定义表单字段答案 |
| createdAt | DateTime | 报名时间 |

```
  注册状态机 (5 态):

  pending ──(管理员接受)──▶ accepted ──(选手确认)──▶ confirmed
     │                        │
     └──(管理员拒绝)──▶ rejected    └──(选手取消)──▶ cancelled
```

#### Project (作品)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| eventId | UUID → Event | 关联赛事 |
| submittedBy | UUID → User | 提交者 |
| name | String | 作品名称 |
| description | Text | 作品描述 (Markdown) |
| teamName | String? | 队伍名称 |
| sourceUrl | String? | 源代码链接 |
| demoUrl | String? | 演示链接 |
| videoUrl | String? | 视频链接 |
| track | String? | 参加赛道 |
| challenges | Json | 参加的挑战 |
| status | Enum | draft / final |
| createdAt | DateTime | 提交时间 |
| updatedAt | DateTime | 更新时间 |

#### ProjectScore (评分)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| projectId | UUID → Project | 关联作品 |
| judgeId | UUID → User | 评委 |
| eventId | UUID → Event | 关联赛事 |
| scores | Json | 各维度分数 {维度名: 分数} |
| comment | Text? | 评语 |
| createdAt | DateTime | 评分时间 |

**唯一约束**: `(projectId, judgeId)` — 每个评委对每个作品只能评一次

#### EventJudge (评委分配)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| eventId | UUID → Event | 关联赛事 |
| userId | UUID → User | 评委用户 |
| assignedAt | DateTime | 分配时间 |

**唯一约束**: `(eventId, userId)` — 每个评委在每个赛事中只分配一次

#### User (用户 — NextAuth 管理)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | String? | 用户名 |
| email | String (unique) | 邮箱 |
| emailVerified | DateTime? | 邮箱验证时间 |
| image | String? | 头像 URL |
| role | Enum | user / admin (默认 user) |

> Admin 角色通过环境变量 `ADMIN_EMAILS` 自动匹配赋予

## 页面路由

### 前台 (公开 + 已登录用户)

| 路由 | 页面 | 认证 |
|------|------|------|
| `/` | 首页 — 赛事列表 | 公开 |
| `/events/[slug]` | 赛事详情 + 报名入口 | 公开 |
| `/events/[slug]/register` | 报名表单 | 需登录 |
| `/events/[slug]/submit` | 作品提交 | 需登录 + confirmed |
| `/events/[slug]/rankings` | 排名公示 | 公开 |
| `/my/registrations` | 我的报名 | 需登录 |
| `/my/projects` | 我的作品 | 需登录 |

### 管理后台 (Admin only)

| 路由 | 页面 |
|------|------|
| `/admin` | 管理后台首页 (概览) |
| `/admin/events` | 赛事管理列表 |
| `/admin/events/new` | 创建赛事 |
| `/admin/events/[id]/edit` | 编辑赛事 |
| `/admin/events/[id]/registrations` | 报名管理 (审核/导出) |
| `/admin/events/[id]/projects` | 作品管理 (查看/导出) |
| `/admin/events/[id]/scoring` | 评分管理 (分配评委 + 查看评分) |
| `/admin/events/[id]/rankings` | 排名管理 (查看/发布) |

## 实施步骤

### Step 1: 项目脚手架 (Day 1)

**目标**: 项目初始化，核心基础设施就位，能跑起来。

- [x] 创建 Next.js 16 项目 (App Router + TypeScript)
- [x] 安装并配置 Tailwind CSS + shadcn/ui
- [x] 安装并配置 Prisma + 连接 Neon PostgreSQL
- [x] 定义 Prisma Schema (Auth + 赛事核心表)
- [x] 生成首个 migration SQL，并将初始表结构写入 Neon 开发库
- [x] 安装并配置 NextAuth.js v5 (GitHub + Google provider)
- [x] 实现 Admin 角色自动匹配 (ADMIN_EMAILS 环境变量)
- [x] 基础布局组件 (Header + Admin Sidebar + Admin Shell)
- [x] 配置 Vitest 测试框架并补首批单测
- [x] 实现 `proxy.ts` 路由保护 (`/admin/*` 需 admin 角色)
- [x] Server Action 统一返回类型 `ActionResult<T>` + `safeAction` wrapper
- [x] 验证: 本地 `dev/build/lint/typecheck/test` 通过，OAuth provider 已加载

**Step 1 完成说明**

- 当前项目实际运行在 `Next.js 16.2.0`，因此将原计划中的 `middleware.ts` 调整为 `proxy.ts`
- Neon 数据库已连通，Prisma schema 已验证通过，初始 SQL migration 已执行并创建核心表
- Google / GitHub provider 已在 `/api/auth/providers` 返回，后台未登录保护已在本地冒烟验证通过
- 已通过 `/setup-browser-cookies` 导入 `localhost` 管理员会话并验证 `/admin/events` 可访问；后续仍需系统化补齐 provider 细节、未登录回退与认证异常场景 QA

**Step 2 当前进度（2026-03-20，项目进度存档）**

1. 已完成功能：`/admin/events` 列表页、`/admin/events/new` 创建页、`/admin/events/[id]/edit` 编辑页、首页赛事列表、赛事详情页，以及 `createEvent / updateEvent / togglePublish / deleteEvent`、slug 生成、赛事阶段计算、时间窗口顺序校验、安全删除策略
2. 已完成 review：pre-landing `/review` 已执行，发现并修复“编辑页时间字段因服务端时区导致的回填偏移”P1 问题；对应修复与回归测试已落地，并通过 `lint / typecheck / test`
3. 已完成 QA：管理员登录态下已补跑 create / edit / publish / unpublish / delete 主链路、非法表单校验、slug 边界样本、空配置详情页展示，以及“存在关联数据时删除被阻止”的真实后台验证；acceptance 记录已同步回写
4. 当前 Step 2 功能与使用层面的验收已完成；剩余事项仅为历史验收数据去留这类非阻塞收尾，不影响继续进入 Step 3
5. 按当前决策，Step 2 剩余非阻塞收尾项统一延期到 Step 3 开发完成后处理

### Step 2: 赛事管理 (Day 2-3)

**目标**: 管理员可以创建、编辑、发布赛事，前台可以浏览赛事；并在进入 Step 3 前补齐 review / qa 收尾。

- [x] 管理后台: 赛事列表页 (`/admin/events`)
- [x] 管理后台: 创建赛事表单 (`/admin/events/new`)
  - 基础信息 (名称/描述/时间段)
  - 赛道/赛题配置 (JSON 编辑)
  - 奖项配置
  - 评分维度配置 [{name, maxScore, weight}]
  - 自定义报名表单字段
- [x] 管理后台: 编辑赛事 (`/admin/events/[id]/edit`)
- [x] 管理后台: 删除 / 归档赛事策略（当前实现为“仅未发布且无关联数据的草稿可删除”）
- [x] 管理后台: 发布/取消发布赛事
- [x] 前台: 赛事列表页 (`/`) — 仅显示已发布赛事
- [x] 前台: 赛事详情页 (`/events/[slug]`)
  - 赛事描述、时间线、赛道、奖项
  - 报名按钮 (时间窗口内)
- [x] Server Actions: createEvent, updateEvent, togglePublish
- [x] Server Actions: deleteEvent（安全删除草稿赛事）
- [x] 时间窗口顺序校验 (Zod refine: regStart < regEnd ≤ subStart < subEnd ≤ revStart < revEnd)
- [x] getEventPhase() 纯计算函数 (从时间窗口推断赛事阶段)
- [x] Slug 生成 + 冲突自动重试
- [x] Happy path 验证: 管理员创建赛事 → 发布 → 在前台看到 → 详情页可访问
- [x] 编辑页时间回填时区问题修复（在客户端按浏览器时区标准化 `datetime-local`）

#### Step 2 Review / QA 收尾计划

- [x] Pre-landing review / diff review：
  - 已对 Step 2 相关改动执行结构化 review，范围覆盖 `actions / queries / schema / event-form / admin pages`
  - review 结果中已确认并修复编辑页时区回填 P1 问题；修复已补测试并归档到 `RESOLVED_ISSUES.md`
- [x] Authenticated admin flow QA：
  - 已导入 `localhost` 管理员登录态并验证 `/admin/events`、`/admin/events/new`、`/admin/events/[id]/edit`
  - 已完成 create → publish → home visible → detail visible → edit sync → unpublish → home hidden 回归
  - 已验证未发布草稿可删除、已发布状态不展示删除按钮
- [x] 非法表单校验 QA：
  - 已覆盖非法时间顺序、重复评分维度名称、`select` 类型自定义字段无选项
  - 已覆盖空赛道 / 空赛题 / 空奖项赛事发布后前台详情页不崩
- [x] slug / 边界 QA：
  - 已覆盖空白名称、英文名称、中文改名后 slug 更新、旧 slug 失效、纯符号名称 fallback 行为
  - 已确认并接受当前策略：纯符号名称 `!!` 生成 `/event`；中文 / 纯数字名称可读性保持现状，不作为当前阻塞项
- [x] acceptance 收尾：
  - `acceptance/step-2-events-checklist.md` 与 `acceptance/step-2-events-manual-script.md` 已补齐三轮实际执行记录
  - 已标明“已通过 / 未覆盖 / 已知风险 / 待确认策略”
- [x] Step 2 最后一项 QA 缺口：
  - 已补齐“已有报名 / 作品 / 评分 / 评委分配数据时删除被阻止”的真实手工验证
  - 通过 QA 脚本构造报名关联数据，再经真实后台删除入口确认前端收到阻止提示，验证完成后已清理测试数据

#### 当前非阻塞遗留 / 延期项

- 数据库中仍保留一条历史验收赛事 `管理员流程回归赛 2026`（已发布），需决定保留还是清理
- 上述遗留项不影响当前系统使用，按当前决策延期到 Step 3 开发完成后处理

#### 下一步最高优先级

1. 进入 Step 3 报名流程开发
2. Step 3 完成后再回头处理历史验收赛事 `管理员流程回归赛 2026` 的去留
3. 若 Step 3 开发中产生新的验收数据，再统一整理 Step 2 / Step 3 的测试数据清理策略

#### 旧计划校正（与实际代码 / 验收记录对齐）

- 旧计划中“编辑页未实现 / 删除策略未定义”已过期：这两项功能已实现并完成主要 QA
- 旧计划中“authenticated admin flow QA 尚未执行”已过期：create / edit / publish / unpublish / delete / 负向校验已完成，当前只剩删除拦截真实数据场景
- 旧计划中“acceptance 待补 edit / delete / unpublish 回写”已过期：对应 acceptance 文件已同步到第三轮 QA 结果
- 旧计划中“slug 策略待确认”已过期：用户已接受当前 slug 行为，不再阻塞 Step 3
- 旧计划中“Step 2 仍有功能级缺口”已过期：当前仅剩非阻塞收尾项，并已明确延期到 Step 3 完成后处理

### Step 3: 报名流程 (Day 3-4)

**目标**: 用户可以报名，管理员可以审核。

- [ ] 前台: 报名表单页 (`/events/[slug]/register`)
  - 填写自定义表单字段
  - 填写队伍名称 (可选)
  - 提交后状态为 pending
- [ ] 前台: 我的报名页 (`/my/registrations`)
  - 查看报名状态
  - accepted 状态可确认参加 → confirmed
  - 可取消报名
- [ ] 管理后台: 报名管理页 (`/admin/events/[id]/registrations`)
  - 报名列表 + 筛选/搜索
  - 批量操作: 接受 / 拒绝
  - 导出报名数据 (CSV)
- [ ] Server Actions: createRegistration, updateRegistrationStatus, confirmRegistration, cancelRegistration
- [ ] 状态转换校验: 确保只能按合法路径转换
- [ ] 抽取 lib/registration-status.ts 状态机纯函数 (canTransition, getAvailableTransitions)
- [ ] 验证: 用户报名 → 管理员接受 → 用户确认 流程走通

### Step 4: 作品提交 (Day 4-5)

**目标**: confirmed 的参赛者可以提交作品。

- [ ] 前台: 作品提交页 (`/events/[slug]/submit`)
  - 填写作品信息 (名称/描述/链接)
  - 选择赛道/挑战
  - 保存草稿 / 提交终稿
  - 时间窗口外禁止提交
- [ ] 前台: 我的作品页 (`/my/projects`)
  - 查看已提交作品
  - 在截止前可编辑
- [ ] 管理后台: 作品管理页 (`/admin/events/[id]/projects`)
  - 作品列表 + 筛选
  - 查看作品详情
  - 导出作品数据 (CSV)
- [ ] Server Actions: createProject, updateProject, submitProject (draft→final)
- [ ] 权限校验: 只有 confirmed 的用户才能提交
- [ ] 时间窗口校验: submissionStart ≤ now ≤ submissionEnd
- [ ] 验证: confirmed 用户提交作品 → 管理员能看到

### Step 5: 评分系统 (Day 5-6)

**目标**: 评委可以对作品打分，支持多维度评分。

- [ ] 管理后台: 评分管理页 (`/admin/events/[id]/scoring`)
  - 显示评分进度 (已评/总数)
  - 分配评委 (通过邮箱邀请 — MVP 直接将用户标记为评委)
  - 查看各评委评分详情
- [ ] 评委视图: 评分页面
  - 作品列表 (分配给该评委的)
  - 逐项评分 (按赛事配置的评分维度)
  - 填写评语 (可选)
  - 提交评分
- [ ] Server Actions: assignJudge (写入 EventJudge 表), submitScore, getScoreSummary
- [ ] 唯一约束: 每个评委对每个作品只评一次
- [ ] 评分时间窗口: reviewStart ≤ now ≤ reviewEnd
- [ ] 评分维度匹配校验 (scores key 必须与 scoringCriteria name 一致)
- [ ] 抽取 lib/scoring.ts 纯函数 (calculateWeightedScore, calculateRankings)
- [ ] 验证: 评委打分 → 管理员查看评分结果

### Step 6: 排名系统 (Day 6-7)

**目标**: 自动计算排名，可公开展示。

- [ ] 排名计算逻辑:
  - 每个作品的最终得分 = 各评委评分的加权平均
  - 加权方式: 按评分维度的 weight 加权
  - 排名按最终得分降序
- [ ] 管理后台: 排名管理页 (`/admin/events/[id]/rankings`)
  - 查看完整排名 (含各维度详细分数)
  - 发布/取消发布排名
  - 导出排名 (CSV)
- [ ] 前台: 排名公示页 (`/events/[slug]/rankings`)
  - 仅在管理员发布后可见
  - 显示排名、作品名、队伍名、总分
  - 按赛道/挑战分组展示
- [ ] Server Actions: calculateRankings, publishRankings
- [ ] 无评分作品不参与排名，管理员页面显示警告
- [ ] 验证: 所有评委评分完成 → 查看排名 → 发布排名

### Step 7: 测试 (Day 7-8)

**目标**: E2E 测试覆盖完整流程，CI 配置，补齐测试漏洞。

- [ ] 安装配置 Playwright (E2E)
- [ ] E2E 测试:
  - [ ] 管理员创建赛事 → 发布
  - [ ] 用户报名 → 管理员接受 → 用户确认
  - [ ] 用户提交作品
  - [ ] 评委评分 → 查看排名
- [ ] 验证: 所有测试通过，覆盖核心流程

### Step 8: 部署上线 (Day 8)

**目标**: 生产环境可访问。

- [ ] Neon 数据库创建生产实例
- [ ] NextAuth 配置生产环境 (OAuth 回调 URL)
- [ ] Vercel 项目创建 + 环境变量配置
  - DATABASE_URL
  - NEXTAUTH_SECRET
  - NEXTAUTH_URL
  - GITHUB_ID / GITHUB_SECRET
  - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
  - ADMIN_EMAILS
- [ ] `git push` 自动部署
- [ ] 域名配置 (可选 — Vercel 提供免费 .vercel.app 域名)
- [ ] 冒烟测试:
  - [ ] 创建赛事 → 发布
  - [ ] 用户报名 → 审核 → 确认
  - [ ] 提交作品
  - [ ] 评委评分
  - [ ] 查看排名

---

## 安全设计

| 项目 | 方案 | 状态 |
|------|------|------|
| 认证 | NextAuth JWT + OAuth providers | 框架保障 |
| Admin 鉴权 | ADMIN_EMAILS 环境变量 + middleware | Step 1 实现 |
| 路由保护 | Next.js middleware + Server Action 校验 | 每个 Step 实现 |
| XSS 防护 | React 默认转义 | 框架保障 |
| CSRF 防护 | Server Actions 内置 CSRF token | 框架保障 |
| SQL 注入 | Prisma 参数化查询 | 框架保障 |
| 数据校验 | Zod schema 校验所有输入 | 每个 Step 实现 |

## 性能设计

| 项目 | 方案 |
|------|------|
| 页面加载 | React Server Components (零客户端 JS) |
| 数据库查询 | Prisma + PostgreSQL 索引 |
| 排名计算 | 按需计算 (MVP 数据量小，不需要缓存) |
| 静态页面 | 赛事详情页可 ISR (增量静态生成) |

---

## 工程审查决策记录

> 审查日期: 2026-03-19 | 模式: BIG CHANGE | 结果: 16 issues, 0 critical gaps

| # | 决策 | 选项 | 结论 |
|---|------|------|------|
| 1 | 评委分配数据模型 | 联表/隐式推断/JSON字段 | 新增 EventJudge 联表 |
| 2 | 排名发布状态 | 复用 published / 独立字段 | Event 加 rankingsPublished 字段 |
| 3 | 赛事生命周期 | 显式 status / 时间窗口驱动 | 时间窗口驱动 + getEventPhase() 函数 |
| 4 | JSONB 校验 | 拆表 / Zod 校验 | Zod schema 校验 |
| 5 | Slug 冲突 | 手动输入 / 自动重试 | 自动生成 + 冲突重试 |
| 6 | 时间窗口校验 | 无校验 / Zod refine | Zod refine 校验顺序 |
| 7 | NextAuth role 集成 | — | 扩展 User + signIn/session callbacks |
| 8 | 路由保护 | 单层 / 双层 | middleware + Server Action 双层防护 |
| 9 | 错误处理 | throw / ActionResult | 统一 ActionResult<T> + safeAction |
| 10 | 状态机逻辑 | 内联 / 独立模块 | 抽取 lib/registration-status.ts |
| 11 | 评分计算 | 内联 / 独立模块 | 抽取 lib/scoring.ts |
| 12 | 自定义字段 | 自由格式 / 类型规范 | 4 种字段类型 + Zod 校验 |
| 13 | 新增测试项 | 忽略 / 补入 | 7 项补入各 Step |
| 14 | 测试节奏 | 集中 Step 7 / 随 Step 编写 | 随 Step 同步编写 |
| 15 | 排名查询 | 逐个查询 / 批量 include | Prisma include 一次查齐 |
| 16 | 批量操作 | 逐个更新 / 事务 | Prisma $transaction |

## NOT in scope (MVP 明确排除)

| 项目 | 理由 | 何时做 |
|------|------|--------|
| 多租户隔离 | MVP 先单租户，后续加 orgId 字段 | Phase 1.5 |
| Gavel 配对评审 | 手动评分够用，算法可后续移植 | Phase 1.5 |
| 组队系统 | 报名时填队名字符串即可 | Phase 1.5 |
| 文件上传 | 作品提交用链接 | Phase 1.5 |
| 邮件通知 | 管理员手动通知 | Phase 1.5 |
| 公众投票 | 锦上添花 | Phase 2 |
| i18n 多语言 | 直接中文硬编码 | Phase 2 |
| AI 辅助评审 | LLM 集成 | Phase 2 |
| 数据分析仪表盘 | 运营分析 | Phase 2 |
| 赛事模板 | 一键克隆赛制 | Phase 2 |
| 作品 Gallery | 赛后公开展示 | Phase 2 |

## JunctionApp 参考资产

| 资产 | 位置 | 复用方式 |
|------|------|---------|
| Gavel 评审算法 | `backend/modules/reviewing/gavel/maths.js` | Phase 1.5 直接移植数学核心 |
| 注册状态机 | `shared/constants/registration-statuses.js` | 简化为 5 态参考 |
| 表单字段定义 | `shared/constants/` | 参考字段结构设计 |
| updateAllowed 模式 | `common/plugins/updateAllowed.js` | Prisma middleware 实现类似保护 |
| 评审 REST API 设计 | `backend/modules/reviewing/gavel/routes.js` | 参考 API 端点设计 |

## 12 个月路线图

```
  Month 1:     MVP 上线 (当前计划 — 8 天)
  Month 2:     Phase 1.5 — 多租户 + Gavel 评审 + 文件上传 + 邮件通知
  Month 3-4:   Phase 2 — AI 评审辅助 + 数据分析 + 赛事模板
  Month 5-6:   Phase 2 — 作品 Gallery + 公众投票 + i18n
  Month 7-9:   Phase 3 — 性能优化 + 开放 API
  Month 10-12: Phase 3 — 支付集成 + 白标定制
```
