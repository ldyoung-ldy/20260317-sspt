# AI 赛事业务管理平台 — MVP 实施计划

> 基于 Fork [JunctionApp](https://github.com/hackjunction/JunctionApp) 的 SCOPE REDUCTION 方案
> 审查模式: SCOPE REDUCTION | 审查日期: 2026-03-18

## 项目概述

构建一个通用 AI 赛事业务管理平台，支撑赛事流程配置、赛事页面发布、用户报名、作品提交、评委评分、成绩排名等业务流程，具备多租户权限管理体系。

## 技术栈 (继承 JunctionApp)

| 层         | 技术                                      |
|-----------|------------------------------------------|
| 前端       | React (CRA) + Redux + Apollo Client + MUI v4 |
| 后端       | Express + Apollo GraphQL (REST + GraphQL 双模) |
| 数据库     | MongoDB (Mongoose 5.9)                    |
| 认证       | Auth0 (JWT RS256 + Authorization Extension) |
| 文件存储   | Cloudinary                                |
| 邮件       | SendGrid                                 |
| 部署       | Docker Compose + Nginx                    |

## 架构决策记录

| # | 决策                     | 选项                          | 结论     | 理由                                    |
|---|-------------------------|------------------------------|---------|----------------------------------------|
| 1 | 开发模式                 | 从零/Fork JunctionApp/Fork OpenHackathon | Fork JunctionApp | 80% 功能已有，节省 2-3 个月 |
| 2 | 认证方案                 | 保留Auth0/自建/Casdoor        | 保留Auth0 | MVP 最快，免费 7000 MAU              |
| 3 | 审查模式                 | EXPANSION/HOLD/REDUCTION     | REDUCTION | 快速验证，最小可行产品                  |

## 复用清单 (直接可用，不改动)

- ✅ Event CRUD + 赛事配置 (含 tracks/challenges/自定义表单)
- ✅ Registration 报名流程 (12 种状态: incomplete → pending → accepted → confirmed → checkedIn)
- ✅ Project 作品提交 (文件/链接/描述/自定义表单字段)
- ✅ Gavel 评审系统 (MIT 贝叶斯配对投票算法)
- ✅ ProjectScore 手动评分 (多维度 + 多评委 + 均分)
- ✅ Team 组队系统 (邀请码加入)
- ✅ Ranking 排名系统
- ✅ WinnerVote 公众投票
- ✅ Cloudinary 文件上传
- ✅ SendGrid 邮件通知
- ✅ shared/ 常量库 (字段定义/校验/状态机)

## 删除清单 (MVP 不需要)

- ❌ Travel Grant 差旅报销模块
- ❌ Recruitment 招聘门户
- ❌ Hackerpack 资源包
- ❌ Discord Bot 集成
- ❌ Meeting Rooms 会议室
- ❌ Newsletter / Banner 管理
- ❌ Azure Pipelines CI/CD 配置

---

## 实施步骤

### Step 1: Fork & Clean (Day 1)

**目标**: Fork 仓库，删除不需要的模块，验证系统仍能运行。

- [ ] Fork hackjunction/JunctionApp 到自己的仓库
- [ ] 初始化本地开发环境 (Node.js + MongoDB via Docker)
- [ ] 删除后端模块:
  - [ ] `backend/modules/travel-grant/`
  - [ ] `backend/modules/recruitment/`
  - [ ] `backend/modules/hackerpack/`
  - [ ] `backend/modules/meeting/`
  - [ ] `backend/modules/newsletter/`
  - [ ] `backend/modules/banner/`
  - [ ] Discord Bot 相关代码
- [ ] 删除前端对应页面和路由
- [ ] 清理 `backend/modules/routes.js` 中对应路由注册
- [ ] 清理 `backend/modules/graphql.js` 中对应 schema
- [ ] 删除 Azure Pipelines 配置文件
- [ ] 验证: `npm start` 前后端均能正常启动
- [ ] 验证: 核心流程可走通 (创建赛事 → 报名 → 提交 → 评审)

### Step 2: 多租户改造 (Day 2-4)

**目标**: 所有数据按租户隔离，跨租户不可访问。

#### 2.1 Tenant 模型 (Day 2)
- [ ] 新建 `backend/modules/tenant/model.js`
  ```
  Tenant {
    name: String (required, max 100)
    slug: String (auto, unique)
    admins: [String]    // Auth0 userIds
    members: [String]   // Auth0 userIds
    logo: CloudinaryImage
    config: {
      defaultLanguage: String
      emailConfig: { senderEmail, senderName }
    }
    createdAt / updatedAt
  }
  ```
- [ ] 新建 Tenant CRUD API (`backend/modules/tenant/routes.js`)
- [ ] 新建 Tenant controller 和 service

#### 2.2 tenantId 注入 (Day 2-3)
- [ ] 创建 Mongoose Global Plugin `backend/misc/tenant-plugin.js`
  ```js
  // 自动为所有带 tenantId 的 model 注入查询 scope
  schema.pre(/^find/, function() {
    if (!this._bypassTenant && this.getQuery().tenantId) {
      // 自动确保 tenantId 在查询条件中
    }
  })
  ```
- [ ] 以下模型添加 `tenantId` 字段 (required):
  - [ ] Event
  - [ ] Registration
  - [ ] Project
  - [ ] Team
  - [ ] ProjectScore
  - [ ] WinnerVote
  - [ ] GavelProject / GavelAnnotator / GavelDecision
- [ ] Organization 模型改造: 关联到 Tenant

#### 2.3 中间件 & 权限 (Day 3)
- [ ] 创建 `backend/common/middleware/tenant.js`
  - [ ] 从 JWT `app_metadata.tenantId` 提取租户信息
  - [ ] 注入 `req.tenantId` 到所有请求
  - [ ] 无 tenantId 的请求返回 403
- [ ] Auth0 Rule: 登录时将 tenantId 写入 id_token
- [ ] 修改 Event slug 唯一索引: 从全局唯一改为 `(tenantId, slug)` 联合唯一

#### 2.4 数据库索引 (Day 3)
- [ ] 为所有加 tenantId 的 collection 创建复合索引:
  - [ ] `Event: { tenantId: 1, slug: 1 }`
  - [ ] `Registration: { tenantId: 1, event: 1, user: 1 }`
  - [ ] `Project: { tenantId: 1, event: 1 }`
  - [ ] `Team: { tenantId: 1, event: 1 }`
  - [ ] `ProjectScore: { tenantId: 1, event: 1, project: 1 }`

#### 2.5 测试 (Day 4)
- [ ] 单元测试: tenantScope 中间件
  - [ ] 请求带正确 tenantId → 正常通过
  - [ ] 请求无 tenantId → 403
  - [ ] 请求带不存在的 tenantId → 404
  - [ ] 跨租户查询 → 返回空结果
- [ ] 集成测试: Tenant CRUD API
- [ ] 集成测试: Event 查询租户隔离
- [ ] 集成测试: Registration/Project 租户隔离

### Step 3: 中文化 (Day 5-6)

**目标**: 核心用户界面支持中文。

- [ ] 安装 `react-i18next` + `i18next`
- [ ] 创建 `frontend/src/i18n/` 目录
- [ ] 创建语言文件:
  - [ ] `frontend/src/i18n/en.json` (提取现有英文硬编码)
  - [ ] `frontend/src/i18n/zh-CN.json` (中文翻译)
- [ ] 翻译核心页面:
  - [ ] 赛事列表/详情页
  - [ ] 报名表单
  - [ ] 作品提交页
  - [ ] 评审面板
  - [ ] 排名/结果页
  - [ ] 登录/注册流程
  - [ ] 管理后台关键操作
- [ ] 语言切换器组件 (Header 区域)
- [ ] 验证: 切换中/英文，所有核心页面无缺失 key

### Step 4: 赛事公开页优化 (Day 7)

**目标**: 赛事详情页适配国内用户习惯。

- [ ] 赛事详情页布局调整:
  - [ ] 突出报名按钮和截止时间
  - [ ] 赛事时间线可视化
  - [ ] 奖项/奖金信息展示区
- [ ] 移动端适配检查
- [ ] 赛事分享功能 (复制链接)
- [ ] SEO meta 标签 (中文标题/描述)

### Step 5: 部署上线 (Day 8)

**目标**: 生产环境可访问。

- [ ] Auth0 配置:
  - [ ] 创建生产 Tenant
  - [ ] 配置 SPA Client + M2M Client
  - [ ] 配置 Google/GitHub 社交登录
  - [ ] 添加 Auth0 Rule (tenantId 注入)
- [ ] 云服务配置:
  - [ ] 云服务器 (2C4G 起步)
  - [ ] 域名 + SSL 证书
  - [ ] Cloudinary 账号
  - [ ] SendGrid 账号
- [ ] Docker Compose 生产配置:
  - [ ] MongoDB (带持久化 volume)
  - [ ] Backend (环境变量)
  - [ ] Frontend (nginx serve build/)
  - [ ] Nginx 反向代理 + HTTPS
- [ ] 冒烟测试:
  - [ ] 创建租户
  - [ ] 创建赛事
  - [ ] 用户报名
  - [ ] 提交作品
  - [ ] 评委评分
  - [ ] 查看排名

---

## 安全清单

| # | 项目                    | 状态     | 说明                                    |
|---|------------------------|---------|----------------------------------------|
| 1 | 跨租户数据隔离 (IDOR)    | 🔴 P0   | Mongoose Plugin + 中间件，必须在上线前完成 |
| 2 | JWT RS256 验证          | ✅ 已有  | JunctionApp 已实现                       |
| 3 | MongoDB 注入防护        | ✅ 已有  | Mongoose 参数化查询                      |
| 4 | XSS 防护               | ✅ 已有  | React 默认转义                           |
| 5 | CSRF 防护              | ✅ 已有  | JWT Bearer Token (无 Cookie 认证)        |
| 6 | 文件上传安全             | ✅ 已有  | Cloudinary 处理                          |
| 7 | Auth0 JWKS 缓存        | ✅ 已有  | jwks-rsa cache + rateLimit              |

## 性能清单

| # | 项目                         | 状态     | 说明                           |
|---|------------------------------|---------|-------------------------------|
| 1 | tenantId 复合索引             | 🔴 P0   | Step 2.4 中完成                |
| 2 | Gavel assignNextProject 优化  | ✅ 已有  | 按 event+track 过滤            |
| 3 | 分页                          | ✅ 已有  | 前端分页组件                    |

---

## NOT in scope (明确排除)

| 项目                    | 理由                                      |
|------------------------|------------------------------------------|
| AI 辅助评审             | Phase 2 — 需要 LLM 集成，MVP 不需要        |
| 赛事模板市场            | Phase 2 — 先验证核心流程                    |
| 数据分析仪表盘          | Phase 2 — 报名漏斗/评审进度等运营分析        |
| 前端重构 Next.js        | Phase 3 — SEO + 性能优化                   |
| Mongoose 升级 v8        | Phase 3 — 当前版本够用                     |
| 审计日志                | Phase 2 — 多租户操作审计                    |
| 支付集成                | Phase 3 — 报名费/赞助等                    |
| 作品展示社区 Gallery     | Phase 2 — 赛后作品公开展示                  |
| 实时协作评审            | Phase 3 — WebSocket 实时同步评分           |

## 12 个月路线图

```
  Month 1-2:   MVP 上线 (当前计划)
  Month 3-4:   Phase 2 — AI 评审辅助 + 数据分析 + 审计日志
  Month 5-6:   Phase 2 — 赛事模板 + 作品 Gallery + 通知优化
  Month 7-9:   Phase 3 — 前端重构 Next.js + 性能优化
  Month 10-12: Phase 3 — 支付集成 + 开放 API + 白标定制
```

## 开源项目参考

| 项目                     | URL                                           | 参考价值              |
|-------------------------|-----------------------------------------------|----------------------|
| JunctionApp (主 Fork)    | github.com/hackjunction/JunctionApp            | 全部核心功能           |
| OpenHackathon-Web        | github.com/kaiyuanshe/OpenHackathon-Web         | Next.js 架构参考       |
| Hackerspace3             | github.com/govhackaustralia/hackerspace3        | 大型赛事管理经验       |
| ContestHub               | github.com/Rafisto/competition-website          | Keycloak 多租户参考    |
| DMOJ Online Judge        | github.com/DMOJ/online-judge                    | 赛制/排名系统参考      |
| Gavel (MIT)              | github.com/anishathalye/gavel                   | 评审算法原版           |
| awesome-hackathon        | github.com/dribdat/awesome-hackathon            | 工具和指南汇总         |
