# Design System — AI 赛事业务管理平台

## Product Context
- **What this is:** AI 赛事管理平台 MVP，支撑核心赛事流程：赛事配置 → 报名 → 作品提交 → 评委评分 → 排名公示
- **Who it's for:** 赛事组织方（管理员）、参赛选手（开发者/学生）、评委（行业专家）
- **Space/industry:** Hackathon / AI Competition Management（Devpost、Devfolio、HackerEarth、Junction 同品类）
- **Project type:** Web app — 前台参赛者体验 + 后台管理运营工具

## Aesthetic Direction
- **Direction:** Industrial / Utilitarian
- **Decoration level:** Intentional — 微妙的背景层级区分，不做多余装饰；表格、表单、状态卡片本身构成视觉节奏
- **Mood:** 专业、清晰、高效。像一个值得信赖的赛事运营控制台，不是一个营销落地页
- **Reference sites:** Devpost, Devfolio, Junction (hackjunction.com), HackerEarth

## Typography
- **Display/Hero:** Satoshi (Fontshare) — 现代几何无衬线，比 Inter/Roboto 更有辨识度，字重表现力强
- **Body:** DM Sans (Google Fonts) — 清晰可读，中西文混排友好
- **UI/Labels:** DM Sans 500 — 导航、标签等小号 UI 文案
- **Data/Tables:** DM Sans (tabular-nums) — 数字等宽对齐，表格一致性
- **Code:** JetBrains Mono — 开发者赛事场景的自然选择
- **Chinese fallback:** -apple-system, 'PingFang SC', 'Noto Sans SC', sans-serif
- **Loading:** Satoshi via Fontshare CDN, DM Sans + JetBrains Mono via Google Fonts
- **Scale:**
  - Hero: 48px / 700 / -0.02em
  - Page title: 30px / 600 / -0.01em (对应 text-3xl)
  - Section heading: 22px / 600
  - Body: 16px / 400 / 1.7 line-height
  - Small body: 14px / 400 / 1.65
  - Label: 13px / 500
  - Caption: 12px / 400-500
  - Code: 14px / 400

## Color
- **Approach:** Restrained — 1 个主色 + 冷灰中性色 + 语义色
- **Primary:** #0F6FDE — 克制的工具蓝，用于可交互元素和关键操作
  - Light: #3b8eef
  - Dark: #0b5ab3
  - 50: #eff6ff
  - 100: #dbeafe
  - 900: #1e3a5f
- **Neutrals:** Slate 冷灰系
  - 50: #f8fafc (bg-subtle)
  - 100: #f1f5f9 (bg-muted)
  - 200: #e2e8f0 (border)
  - 400: #94a3b8 (text-muted)
  - 600: #475569 (text-secondary)
  - 900: #0f172a (text)
- **Semantic:**
  - Success: #16a34a (green-600)
  - Warning: #d97706 (amber-600)
  - Error: #dc2626 (red-600)
  - Info: #0284c7 (sky-600)
- **Dark mode:** 延期到 MVP 后。策略：反转 Slate 灰阶，主色切换到 #3b8eef，降饱和度 10-20%

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable — 后台兼顾操作效率，前台适当放松
- **Scale:** 4(1) 8(2) 12(3) 16(4) 24(6) 32(8) 48(12) 64(16)
- **Page padding:** 24px (mobile) / 32px (desktop)
- **Section gap:** 24-32px
- **Card padding:** 24px (standard) / 32px (hero/header)
- **Max content width:** 1152px (max-w-6xl, 与现有代码一致)

## Layout
- **Approach:** Grid-disciplined
- **Grid:** 1 col (mobile) / 2 col (md) / 3 col (xl) for card grids
- **Admin:** Fixed sidebar 256px + fluid content area
- **Max content width:** 1152px (72rem)
- **Border radius:** Hierarchical scale
  - xs: 4px — 按钮、输入框、小元素
  - sm: 8px — 内嵌卡片、代码块、下拉菜单
  - md: 12px — 中号容器、MetricCard
  - lg: 16px — 主要内容卡片
  - full: 9999px — 头像、Badge、Pill

> **注意：** 当前代码使用 rounded-2xl(16px) / rounded-3xl(24px)，需在 Step 4 开发时逐步过渡到新的分级圆角体系。现有页面不强制回改，新页面优先使用新体系。

## Motion
- **Approach:** Minimal-functional — 仅转场和状态变化使用动画，不做装饰性动效
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50-100ms) short(150-250ms) medium(250-400ms)
- **MVP scope:** 仅 CSS transition（hover、focus、theme toggle），不引入动画库

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-21 | 初始设计系统创建 | /design-consultation 基于 Devpost/Devfolio/Junction/HackerEarth 竞品调研 |
| 2026-03-21 | Satoshi 做 Display 字体 | 竞品几乎全用 Inter/Roboto 变体，Satoshi 提供辨识度同时保持专业感 |
| 2026-03-21 | 冷灰 Slate 替代默认灰 | 中文 SaaS 多用暖灰，冷灰使产品更"国际化"、更技术导向 |
| 2026-03-21 | 分级圆角 4/8/12/16px | 当前统一大圆角在数据密集场景下浪费空间，分级能提升信息密度 |
| 2026-03-21 | 暗色模式延期 | PLAN.md 明确 MVP 不启用暗色模式，统一浅色 |
| 2026-03-21 | 圆角过渡策略 | 现有页面不强制回改，新页面（Step 4+）优先使用新体系 |
