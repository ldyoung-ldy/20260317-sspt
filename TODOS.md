# TODOS — AI 赛事管理平台 MVP

> 进度跟踪文件 | 创建: 2026-03-18 | 关联: [PLAN.md](./PLAN.md)

## 进度总览

```
  Step 1: Fork & Clean       [ ] 0/12   ░░░░░░░░░░  Day 1
  Step 2: 多租户改造          [ ] 0/20   ░░░░░░░░░░  Day 2-4
  Step 3: 中文化              [ ] 0/12   ░░░░░░░░░░  Day 5-6
  Step 4: 赛事公开页优化      [ ] 0/5    ░░░░░░░░░░  Day 7
  Step 5: 部署上线            [ ] 0/10   ░░░░░░░░░░  Day 8
  ─────────────────────────────────────────────────
  TOTAL                       [ ] 0/59   ░░░░░░░░░░
```

---

## Step 1: Fork & Clean — Day 1

> 优先级: P0 | 预估: 1 天 | 状态: ⬜ 未开始

- [ ] 1.1 Fork hackjunction/JunctionApp
- [ ] 1.2 克隆到本地，配置开发环境 (nvm + MongoDB Docker)
- [ ] 1.3 配置 Auth0 开发 tenant (免费版)
- [ ] 1.4 配置 `.env` 文件 (backend + frontend)
- [ ] 1.5 验证原始项目可正常启动运行
- [ ] 1.6 删除后端不需要的模块 (travel-grant/recruitment/hackerpack/meeting/newsletter/banner/discord)
- [ ] 1.7 清理 `backend/modules/routes.js` 路由注册
- [ ] 1.8 清理 `backend/modules/graphql.js` schema 注册
- [ ] 1.9 删除前端对应的页面、路由、Redux slices
- [ ] 1.10 删除 Azure Pipelines 配置 (`azure-pipelines*.yml`)
- [ ] 1.11 验证: 前后端正常启动，无报错
- [ ] 1.12 验证: 创建赛事 → 发布 → 报名 核心流程可走通

### 完成标准
- `npm start` 前后端均正常启动
- 无控制台错误（除 auth 相关配置警告外）
- 至少一个赛事可以创建并发布

---

## Step 2: 多租户改造 — Day 2-4

> 优先级: P0 | 预估: 3 天 | 状态: ⬜ 未开始
> 安全等级: CRITICAL — 跨租户隔离是硬性要求

### 2.1 Tenant 模型 (Day 2)
- [ ] 2.1.1 创建 `backend/modules/tenant/model.js` (name/slug/admins/members/logo/config)
- [ ] 2.1.2 创建 `backend/modules/tenant/controller.js` (CRUD + 成员管理)
- [ ] 2.1.3 创建 `backend/modules/tenant/routes.js` (REST API)
- [ ] 2.1.4 注册到 `backend/modules/routes.js`

### 2.2 tenantId 注入到现有模型 (Day 2-3)
- [ ] 2.2.1 创建 `backend/misc/tenant-plugin.js` (Mongoose Global Plugin)
- [ ] 2.2.2 Event 模型添加 `tenantId` 字段
- [ ] 2.2.3 Registration 模型添加 `tenantId` 字段
- [ ] 2.2.4 Project 模型添加 `tenantId` 字段
- [ ] 2.2.5 Team 模型添加 `tenantId` 字段
- [ ] 2.2.6 ProjectScore 模型添加 `tenantId` 字段
- [ ] 2.2.7 WinnerVote 模型添加 `tenantId` 字段
- [ ] 2.2.8 GavelProject/GavelAnnotator/GavelDecision 添加 `tenantId`
- [ ] 2.2.9 Organization 模型关联到 Tenant

### 2.3 中间件 & Auth0 配置 (Day 3)
- [ ] 2.3.1 创建 `backend/common/middleware/tenant.js` (从 JWT 提取 tenantId)
- [ ] 2.3.2 Auth0 Rule: 将 tenantId 注入 id_token `app_metadata`
- [ ] 2.3.3 修改 Event slug 索引: 全局唯一 → `(tenantId, slug)` 联合唯一
- [ ] 2.3.4 前端: 租户切换选择器 (Header 区域)

### 2.4 数据库索引 (Day 3)
- [ ] 2.4.1 MongoDB migration: 创建复合索引
  - `Event: { tenantId: 1, slug: 1 }`
  - `Registration: { tenantId: 1, event: 1, user: 1 }`
  - `Project: { tenantId: 1, event: 1 }`
  - `Team: { tenantId: 1, event: 1 }`
  - `ProjectScore: { tenantId: 1, event: 1, project: 1 }`

### 2.5 测试 (Day 4)
- [ ] 2.5.1 单元测试: tenantScope 中间件 — 正确 tenantId 通过
- [ ] 2.5.2 单元测试: tenantScope 中间件 — 无 tenantId 返回 403
- [ ] 2.5.3 单元测试: tenantScope 中间件 — 不存在 tenantId 返回 404
- [ ] 2.5.4 集成测试: 跨租户查询返回空结果
- [ ] 2.5.5 集成测试: Tenant CRUD API
- [ ] 2.5.6 集成测试: Event 创建/查询租户隔离

### 完成标准
- 租户 A 的管理员无法看到租户 B 的赛事/报名/作品
- 所有 API 端点均强制 tenantId scope
- 复合索引创建完成，查询性能无退化

---

## Step 3: 中文化 — Day 5-6

> 优先级: P1 | 预估: 2 天 | 状态: ⬜ 未开始

- [ ] 3.1 安装 `react-i18next` + `i18next` + `i18next-browser-languagedetector`
- [ ] 3.2 创建 i18n 初始化配置 `frontend/src/i18n/index.js`
- [ ] 3.3 创建 `frontend/src/i18n/en.json` — 提取现有英文硬编码
- [ ] 3.4 创建 `frontend/src/i18n/zh-CN.json` — 中文翻译
- [ ] 3.5 翻译: 赛事列表页 + 赛事详情页
- [ ] 3.6 翻译: 报名表单 + 报名状态提示
- [ ] 3.7 翻译: 作品提交页
- [ ] 3.8 翻译: 评审面板 (Gavel + 手动评分)
- [ ] 3.9 翻译: 排名/结果页
- [ ] 3.10 翻译: 登录/注册/账户设置
- [ ] 3.11 翻译: 管理后台关键操作
- [ ] 3.12 语言切换器组件 (Header) + 验证所有页面无缺失 key

### 完成标准
- 切换到中文后，核心用户流程（报名→提交→评审→排名）全中文显示
- 无明显的 i18n key 暴露 (如 `common.submit`)
- 英文版本不受影响

---

## Step 4: 赛事公开页优化 — Day 7

> 优先级: P1 | 预估: 1 天 | 状态: ⬜ 未开始

- [ ] 4.1 赛事详情页布局优化 (突出报名 CTA + 截止倒计时)
- [ ] 4.2 赛事时间线可视化组件
- [ ] 4.3 奖项/奖金信息展示区
- [ ] 4.4 移动端响应式检查 & 修复
- [ ] 4.5 分享功能 (复制链接) + SEO meta 标签

### 完成标准
- 赛事页在手机端可正常浏览和报名
- 关键信息（时间/奖金/报名入口）一屏可见

---

## Step 5: 部署上线 — Day 8

> 优先级: P0 | 预估: 1 天 | 状态: ⬜ 未开始

### 5.1 外部服务配置
- [ ] 5.1.1 Auth0: 创建生产 Tenant + SPA Client + M2M Client + Social Login + Rule
- [ ] 5.1.2 Cloudinary: 创建生产账号 + 配置 upload preset
- [ ] 5.1.3 SendGrid: 创建账号 + 验证发件域名 + 创建模板
- [ ] 5.1.4 域名: 购买 + DNS 配置 + SSL 证书

### 5.2 服务器部署
- [ ] 5.2.1 云服务器准备 (2C4G, Docker + Docker Compose)
- [ ] 5.2.2 生产 `docker-compose.prod.yml` (MongoDB + Backend + Nginx)
- [ ] 5.2.3 Nginx 配置 (反向代理 + HTTPS + 静态文件)
- [ ] 5.2.4 环境变量配置 (`.env.production`)

### 5.3 冒烟测试
- [ ] 5.3.1 端到端: 创建租户 → 创建赛事 → 发布
- [ ] 5.3.2 端到端: 用户报名 → 管理员审核 → 用户确认

### 完成标准
- 生产 URL 可公开访问
- 完整流程: 创建赛事 → 报名 → 提交作品 → 评委评分 → 查看排名

---

## 已知风险 & 缓解

| 风险                        | 影响  | 缓解措施                                 |
|----------------------------|------|----------------------------------------|
| Auth0 中国大陆访问不稳定      | 中    | JWKS 缓存 10h + Custom Domain/CF 代理   |
| Gavel 并发评分竞争条件        | 低    | 已有 5min 软锁定，MVP 可接受              |
| JunctionApp 依赖版本老旧      | 低    | MVP 不升级，Phase 3 处理                 |
| Cloudinary 国内访问慢         | 中    | MVP 接受，Phase 2 可换七牛/阿里 OSS       |

---

## Phase 2 待办 (MVP 后)

> 以下为 MVP 上线后的后续规划，当前不实施

- [ ] P2-1 AI 辅助评审 — LLM 自动初筛/打标/生成评语
- [ ] P2-2 数据分析仪表盘 — 报名漏斗/提交率/评审进度
- [ ] P2-3 审计日志 — 多租户操作记录
- [ ] P2-4 赛事模板 — 一键克隆成熟赛制
- [ ] P2-5 作品 Gallery — 赛后公开展示
- [ ] P2-6 通知优化 — 微信/短信通知集成
- [ ] P2-7 Auth0 替换 — 自建认证或迁移到 Logto/Casdoor

## Phase 3 待办

- [ ] P3-1 前端重构 Next.js — SSR/SSG + SEO + 性能
- [ ] P3-2 Mongoose 升级 v8
- [ ] P3-3 支付集成 — 报名费/赞助
- [ ] P3-4 开放 API — 赛事嵌入第三方官网
- [ ] P3-5 白标定制 — 品牌色/Logo/域名
