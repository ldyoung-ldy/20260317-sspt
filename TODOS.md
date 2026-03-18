# TODOS — AI 赛事管理平台 MVP (v2)

> 进度跟踪文件 | 创建: 2026-03-19 | 关联: [PLAN.md](./PLAN.md)
> 基于 CEO Review (SCOPE REDUCTION) 重写，从零搭建现代技术栈

## 进度总览

```
  Step 1: 项目脚手架        [ ] 0/9    ░░░░░░░░░░  Day 1
  Step 2: 赛事管理          [ ] 0/8    ░░░░░░░░░░  Day 2-3
  Step 3: 报名流程          [ ] 0/7    ░░░░░░░░░░  Day 3-4
  Step 4: 作品提交          [ ] 0/7    ░░░░░░░░░░  Day 4-5
  Step 5: 评分系统          [ ] 0/6    ░░░░░░░░░░  Day 5-6
  Step 6: 排名系统          [ ] 0/5    ░░░░░░░░░░  Day 6-7
  Step 7: 测试              [ ] 0/7    ░░░░░░░░░░  Day 7-8
  Step 8: 部署上线          [ ] 0/5    ░░░░░░░░░░  Day 8
  ─────────────────────────────────────────────────
  TOTAL                     [ ] 0/54   ░░░░░░░░░░
```

---

## Step 1: 项目脚手架 — Day 1

> 优先级: P0 | 预估: 1 天 | 状态: ⬜ 未开始

- [ ] 1.1 创建 Next.js 15 项目 (`create-next-app` + App Router + TypeScript)
- [ ] 1.2 安装并配置 Tailwind CSS + shadcn/ui (基础组件: Button, Input, Card, Table, Dialog, Form)
- [ ] 1.3 安装并配置 Prisma + 连接 Neon PostgreSQL
- [ ] 1.4 定义 Prisma Schema (User, Event, Registration, Project, ProjectScore)
- [ ] 1.5 运行 `prisma migrate dev` 创建表
- [ ] 1.6 安装并配置 NextAuth.js v5 (GitHub + Google provider)
- [ ] 1.7 实现 Admin 角色自动匹配逻辑 (NextAuth callbacks 中检查 ADMIN_EMAILS)
- [ ] 1.8 基础布局组件 (Header 含用户头像/登录按钮 + 管理后台 Sidebar)
- [ ] 1.9 验证: `npm run dev` 启动 → GitHub 登录成功 → Admin 用户看到管理后台入口

### 完成标准
- 本地开发服务器正常启动
- 能通过 GitHub OAuth 登录
- ADMIN_EMAILS 中的用户登录后自动获得 admin 角色
- 数据库表已创建，Prisma Studio 可查看

---

## Step 2: 赛事管理 — Day 2-3

> 优先级: P0 | 预估: 1.5 天 | 状态: ⬜ 未开始

- [ ] 2.1 Server Actions: createEvent, updateEvent, deleteEvent, togglePublish
- [ ] 2.2 管理后台: 赛事列表页 (表格 + 状态筛选 + 创建按钮)
- [ ] 2.3 管理后台: 创建/编辑赛事表单 (基础信息 + 时间配置 + 赛道 + 奖项 + 评分维度 + 自定义字段)
- [ ] 2.4 管理后台: 发布/取消发布赛事 (toggle)
- [ ] 2.5 前台: 首页赛事列表 (仅已发布赛事，卡片展示)
- [ ] 2.6 前台: 赛事详情页 (描述 + 时间线 + 赛道 + 奖项 + 报名按钮)
- [ ] 2.7 Slug 自动生成 (从赛事名称生成 URL-safe slug，唯一)
- [ ] 2.8 验证: 管理员创建赛事 → 发布 → 前台可见 → 点击查看详情

### 完成标准
- 管理员能完整创建/编辑/发布赛事
- 前台只展示已发布赛事
- 赛事详情页信息完整展示

---

## Step 3: 报名流程 — Day 3-4

> 优先级: P0 | 预估: 1.5 天 | 状态: ⬜ 未开始

- [ ] 3.1 Server Actions: createRegistration, updateRegistrationStatus (批量), confirmRegistration, cancelRegistration
- [ ] 3.2 状态转换校验逻辑 (确保合法路径: pending→accepted→confirmed, pending→rejected, accepted/confirmed→cancelled)
- [ ] 3.3 前台: 报名表单页 (自定义字段渲染 + 队伍名填写 + 提交)
- [ ] 3.4 前台: 我的报名页 (状态展示 + 确认/取消操作)
- [ ] 3.5 管理后台: 报名管理页 (列表 + 筛选 + 批量接受/拒绝 + CSV 导出)
- [ ] 3.6 时间窗口校验: registrationStart ≤ now ≤ registrationEnd
- [ ] 3.7 验证: 用户报名 → 管理员批量接受 → 用户确认参加

### 完成标准
- 报名状态转换严格按状态机执行
- 非报名时间窗口内无法提交报名
- 管理员能批量审核 + 导出数据

---

## Step 4: 作品提交 — Day 4-5

> 优先级: P0 | 预估: 1.5 天 | 状态: ⬜ 未开始

- [ ] 4.1 Server Actions: createProject, updateProject, submitProject (draft→final)
- [ ] 4.2 权限校验: 只有 confirmed 状态的用户才能提交
- [ ] 4.3 时间窗口校验: submissionStart ≤ now ≤ submissionEnd
- [ ] 4.4 前台: 作品提交页 (名称 + 描述 + 链接 + 赛道选择 + 保存草稿/提交终稿)
- [ ] 4.5 前台: 我的作品页 (查看 + 截止前可编辑)
- [ ] 4.6 管理后台: 作品管理页 (列表 + 筛选 + 详情查看 + CSV 导出)
- [ ] 4.7 验证: confirmed 用户提交作品 → 管理员查看 → 非 confirmed 用户被拦截

### 完成标准
- 只有 confirmed 用户能在时间窗口内提交
- 草稿可编辑，终稿在截止前可修改
- 管理员能查看和导出所有作品

---

## Step 5: 评分系统 — Day 5-6

> 优先级: P0 | 预估: 1.5 天 | 状态: ⬜ 未开始

- [ ] 5.1 Server Actions: assignJudge (将用户标记为某赛事的评委), submitScore, getScoreSummary
- [ ] 5.2 管理后台: 评分管理页 (评委列表 + 分配评委 + 评分进度总览)
- [ ] 5.3 评委视图: 待评作品列表 + 评分表单 (按赛事配置的 scoringCriteria 渲染各维度打分)
- [ ] 5.4 唯一约束校验: (projectId, judgeId) — 每个评委对每个作品只评一次
- [ ] 5.5 评分时间窗口校验: reviewStart ≤ now ≤ reviewEnd
- [ ] 5.6 验证: 管理员分配评委 → 评委逐一评分 → 管理员查看评分进度和详情

### 完成标准
- 评委能按维度打分 + 填写评语
- 不能重复评分同一作品
- 管理员能看到评分进度

---

## Step 6: 排名系统 — Day 6-7

> 优先级: P0 | 预估: 1 天 | 状态: ⬜ 未开始

- [ ] 6.1 排名计算逻辑: 各评委评分加权平均 → 按维度 weight 加权 → 排名
- [ ] 6.2 管理后台: 排名管理页 (完整排名 + 各维度分数 + 发布/取消 + CSV 导出)
- [ ] 6.3 前台: 排名公示页 (仅管理员发布后可见，按赛道/挑战分组)
- [ ] 6.4 排名边界处理: 同分处理 (同名次)、无评分作品处理、评分不完整提示
- [ ] 6.5 验证: 评分完成 → 管理员查看排名 → 发布 → 前台可见

### 完成标准
- 排名计算正确 (加权平均)
- 同分并列处理正确
- 管理员发布前前台不可见

---

## Step 7: 测试 — Day 7-8

> 优先级: P0 | 预估: 1.5 天 | 状态: ⬜ 未开始

- [ ] 7.1 安装配置 Vitest + @testing-library/react
- [ ] 7.2 安装配置 Playwright
- [ ] 7.3 单元测试: 注册状态机 + 评分计算 + 排名排序 + 时间窗口校验 + Admin 角色匹配
- [ ] 7.4 集成测试: Event CRUD + Registration 状态流转 + Project 提交 + Score 提交 + 排名计算
- [ ] 7.5 E2E 测试: 管理员创建赛事→发布 + 用户报名→确认 + 提交作品 + 评委评分→排名
- [ ] 7.6 CI 配置 (GitHub Actions): push 时自动运行测试
- [ ] 7.7 验证: 所有测试通过，核心流程有覆盖

### 完成标准
- 单元测试覆盖核心业务逻辑
- E2E 测试覆盖完整赛事流程
- CI 绿灯

---

## Step 8: 部署上线 — Day 8

> 优先级: P0 | 预估: 0.5 天 | 状态: ⬜ 未开始

- [ ] 8.1 Neon 创建生产数据库 + 运行 migration
- [ ] 8.2 Vercel 项目创建 + 环境变量配置 (DATABASE_URL, NEXTAUTH_*, OAuth, ADMIN_EMAILS)
- [ ] 8.3 `git push` 部署 + 域名配置 (可选)
- [ ] 8.4 冒烟测试: 创建赛事→报名→审核→提交→评分→排名 全流程
- [ ] 8.5 验证: 生产 URL 可访问，核心流程走通

### 完成标准
- 生产环境可公开访问
- 完整赛事流程走通
- 无 500 错误

---

## Deferred TODOs (CEO Review 产出)

> 以下为 CEO Review 中识别的后续改进项，当前不实施

### DT-1: 多租户隔离
- **What:** 所有数据表加 organizationId 字段，加全局中间件做租户隔离
- **Why:** 当多个组织需要使用平台时必须隔离数据
- **Pros:** 支持 SaaS 模式，多客户共用一个部署
- **Cons:** 所有查询需加 organizationId 条件，需完整测试覆盖
- **Context:** MVP 单租户，Prisma 后续加字段 + migrate 即可。参考 JunctionApp 的 Organization 模型设计
- **Effort:** M (3-5 天)
- **Priority:** P1 — Phase 1.5 第一批
- **Depends on:** MVP 上线后

### DT-2: Gavel 配对评审
- **What:** 移植 JunctionApp 的 Gavel 贝叶斯配对投票算法
- **Why:** 大量作品时手动评分效率低，Gavel 能自动优化评审分配
- **Pros:** 评审效率大幅提升，结果更客观
- **Cons:** 算法复杂度高，需额外 3 张表 (GavelProject/Annotator/Decision)
- **Context:** 数学核心在 JunctionApp `backend/modules/reviewing/gavel/maths.js`，约 200 行纯函数可直接移植
- **Effort:** L (5-7 天)
- **Priority:** P1 — Phase 1.5
- **Depends on:** MVP 评分系统完成后

### DT-3: 文件上传
- **What:** 作品支持上传图片/文件，而非仅链接
- **Why:** 部分参赛者的作品不在线上，需要上传截图/文档
- **Pros:** 提交体验更完整
- **Cons:** 需引入对象存储 (S3/Cloudinary)，增加成本和复杂度
- **Context:** 可用 Vercel Blob 或 Cloudinary 免费额度
- **Effort:** S (1-2 天)
- **Priority:** P2 — Phase 1.5
- **Depends on:** MVP 作品提交完成后

### DT-4: 邮件通知
- **What:** 报名状态变更、评审分配等关键节点自动发送邮件
- **Why:** 管理员手动通知效率低且容易遗漏
- **Pros:** 自动化通知，减少运营工作量
- **Cons:** 需引入邮件服务 (Resend/SendGrid)，需处理送达率
- **Context:** 可用 Resend 免费额度 (100 封/天)
- **Effort:** S (1-2 天)
- **Priority:** P2 — Phase 1.5
- **Depends on:** MVP 上线后

### DT-5: 组队系统
- **What:** 正式的组队功能：创建队伍、邀请码加入、队伍管理
- **Why:** MVP 的 "填队名字符串" 无法保证同队成员关联
- **Pros:** 队伍成员之间可共享作品提交权限
- **Cons:** 新增 Team 表 + 邀请流程，增加复杂度
- **Context:** 参考 JunctionApp 的 Team 模型和邀请码机制
- **Effort:** M (2-3 天)
- **Priority:** P2 — Phase 1.5
- **Depends on:** MVP 上线后

---

## Phase 2 待办 (MVP 后)

- [ ] P2-1 AI 辅助评审 — LLM 自动初筛/打标/生成评语
- [ ] P2-2 数据分析仪表盘 — 报名漏斗/提交率/评审进度
- [ ] P2-3 赛事模板 — 一键克隆成熟赛制
- [ ] P2-4 作品 Gallery — 赛后公开展示
- [ ] P2-5 公众投票 — 观众投票环节
- [ ] P2-6 i18n 多语言 — next-intl 中英文切换

## Phase 3 待办

- [ ] P3-1 支付集成 — 报名费/赞助
- [ ] P3-2 开放 API — 赛事嵌入第三方官网
- [ ] P3-3 白标定制 — 品牌色/Logo/域名
