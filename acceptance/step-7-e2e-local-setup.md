# 本地 E2E 实跑准备指引（Neon branch 方案）

> 适用范围：在本地浏览器实际跑 `bun run test:e2e`（Playwright），并保持开发库 `neondb` 不被 reset/seed 误清。
> 前置：已存在 `.env.local`，且 `DATABASE_URL` 指向开发库 `neondb`。

## 一、为什么需要独立测试库

`e2e/helpers/db.ts` 在每条 spec 之间会调用 `resetE2EDatabase()`，对所有业务表执行 `deleteMany`。如果连接的是开发库会清空你的真实数据。`assertSafeE2EDatabaseUrl` 强制要求"非 CI 环境数据库名必须包含 `test` 或 `e2e`"，因此需要一条独立的测试库连接串。

## 二、创建 Neon 测试 branch

1. 打开 [Neon 控制台](https://console.neon.tech/) 选中当前项目（与 `DATABASE_URL` 同一个 Neon project）
2. 左侧导航进入 **Branches** → 点击 **Create branch**
3. 关键参数：
   - **Branch name**: `neondb_e2e`（名称必须包含 `test` 或 `e2e`，否则 reset 脚本会拒绝执行）
   - **Parent branch**: `main`（或当前开发库所在的 branch）
   - **Compute**: 选择最小规格（E2E 用量极低）
4. 创建完成后进入新 branch，点击 **Connection Details** 复制 `Pooled connection`（带 `?sslmode=require` 的 URL）

## 三、把 schema 推到测试 branch

新建 branch 是父 branch 的副本，已经包含完整 schema 与历史数据。**为避免历史数据干扰 E2E**，请在切到测试 branch 后跑一次重置：

```bash
# 把测试库连接串临时塞到环境变量再执行迁移与种子
export E2E_DATABASE_URL="postgresql://...neondb_e2e..."

# schema 同步到测试 branch（首次或 schema 漂移时执行）
DATABASE_URL="$E2E_DATABASE_URL" bunx prisma migrate deploy

# 清空业务表 + 写入 E2E 核心测试用户
bun run e2e:reset
```

> `bun run e2e:reset` 会自动优先读取 `E2E_DATABASE_URL`；只读到 `DATABASE_URL` 时仍会要求名称含 `test`/`e2e`。

## 四、写入 `.env.local`

```ini
# 开发库（保持不动）
DATABASE_URL="postgresql://...neondb..."
# 新增：E2E 专用测试库
E2E_DATABASE_URL="postgresql://...neondb_e2e..."
AUTH_SECRET="..."
ADMIN_EMAILS="admin-e2e@example.com"
```

## 五、本地实跑

```bash
bun install
bunx playwright install chromium     # 首次安装浏览器
bun run e2e:reset                     # 每次跑前重置测试库
bun run test:e2e                      # 运行 3 条主流程 spec
```

可视化调试：

```bash
bun run test:e2e:headed
```

## 六、安全校验

执行前确认：

- `echo $E2E_DATABASE_URL | grep -E "test|e2e"` 必须命中
- 真正发起 reset 的是 `bun run e2e:reset`，对应 `e2e/scripts/reset-and-seed.ts`，里面会再做一次 `assertSafeE2EDatabaseUrl`
- `playwright.config.ts` 在启动 Next dev server 时会把 `E2E_DATABASE_URL` 注入为 `DATABASE_URL`，确保被测应用与 reset 操作同库

## 七、常见问题

| 现象 | 处理 |
|------|------|
| `当前 E2E 数据库连接看起来不是测试库` | 检查 branch 名称是否含 `test`/`e2e`，或确认 `E2E_DATABASE_URL` 已正确导出 |
| Playwright 启动 dev server 后查询为空 | 先跑 `bun run e2e:reset`；该命令会写入 5 个 E2E 核心用户 |
| Neon branch 进入空闲休眠后首次连接超时 | Neon 冷启动属正常现象，再跑一次 `bun run e2e:reset` 即可 |
| 想清理测试 branch | Neon 控制台 → Branches → 选中 `neondb_e2e` → Delete branch |
