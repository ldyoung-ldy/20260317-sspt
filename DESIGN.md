# Design System — AI 赛事业务管理平台

## Product Context
- **What this is:** AI 赛事管理平台 MVP，支撑核心赛事流程：赛事配置 → 报名 → 作品提交 → 评委评分 → 排名公示
- **Who it's for:** 赛事组织方（管理员）、参赛选手（开发者/学生）、评委（行业专家）
- **Space/industry:** Hackathon / AI Competition Management（Devpost、Devfolio、HackerEarth、Junction 同品类）
- **Project type:** Web app — 前台参赛者体验 + 后台管理运营工具

## Aesthetic Direction
- **Direction:** Warm Minimal — 暖调极简主义
- **Decoration level:** Minimal — 全局 grain 噪点纹理叠加，1px 边框网格分割，无多余装饰
- **Mood:** 温暖、精密、克制。像一个专业的开发者工具，有温度但不花哨
- **Reference sites:** [Claude Code History Viewer](https://jhlee0409.github.io/claude-code-history-viewer/), Kaggle, AIcrowd

## Typography
- **Display/Hero:** Satoshi (Fontshare) — 现代几何无衬线，辨识度强
- **Body:** DM Sans (Google Fonts) — 清晰可读，中西文混排友好
- **UI/Labels:** IBM Plex Mono (Google Fonts) — 导航、标签、meta 信息、section label，等宽字体增强技术感
- **Data/Tables:** DM Sans (tabular-nums) / IBM Plex Mono — 数字等宽对齐
- **Code:** JetBrains Mono (Google Fonts) — 代码块专用
- **Chinese fallback:** -apple-system, 'PingFang SC', 'Noto Sans SC', sans-serif
- **Loading:** Satoshi via Fontshare CDN, DM Sans + IBM Plex Mono + JetBrains Mono via Google Fonts
- **Scale:**
  - Hero: 56px / 700 / -0.03em / line-height 1.05
  - Page title: 28px / 600 / -0.02em
  - Section heading: 22px / 600 / -0.02em
  - Body: 16px / 400 / line-height 1.6
  - Small body: 14px / 400 / line-height 1.65
  - Label (mono): 13px / 500 / -0.01em
  - Section label (mono): 11px / 500 / uppercase / letter-spacing 0.1em
  - Caption (mono): 12px / 400
  - Code: 13px / 400

## Color
- **Approach:** Warm Restrained — 暖色中性底 + 单一铜橘强调色
- **Background:**
  - bg: #FAF8F5 — 主背景（暖米色）
  - bg-alt: #F3EFE9 — 交替区域背景
  - surface: #FFFFFF — 卡片/浮层表面
- **Accent:** #D97757 — 铜橘色，用于所有可交互元素、标签、强调
  - hover: #C4684A
  - light: rgba(217, 119, 87, 0.08) — 用于 badge 背景、hover 行高亮
  - border: rgba(217, 119, 87, 0.25) — 用于 focus 边框
- **Text:**
  - text: #1C1917 — 主文字（Stone-900）
  - text-secondary: #57534E — 次要文字（Stone-600）
  - text-muted: #A8A29E — 弱化文字（Stone-400）
- **Border:**
  - border: #E7E5E4 — 分割线、网格边框（Stone-200）
  - border-hover: #D6D3D1 — hover 态边框（Stone-300）
- **Semantic:**
  - Success: #16A34A (green-600) / bg: #F0FDF4
  - Warning: #D97706 (amber-600) / bg: #FFFBEB
  - Error: #DC2626 (red-600) / bg: #FEF2F2
  - Info: #0284C7 (sky-600) / bg: #F0F9FF
- **Dark mode:** 延期到 MVP 后

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable — 后台兼顾操作效率，前台适当放松
- **Scale:** 4(1) 8(2) 12(3) 16(4) 24(6) 32(8) 48(12) 64(16)
- **Page padding:** 24px (all breakpoints)
- **Section gap:** 48-80px（section 之间用 1px border 分割）
- **Card padding:** 24-32px（网格卡片内部 padding）
- **Max content width:** 1152px (72rem)

## Layout
- **Approach:** Grid-disciplined — 用 1px gap + 背景色做网格分割
- **Grid pattern:** 所有并列内容使用 `gap: 1px; background: var(--color-border); border: 1px solid var(--color-border)` 模式，子元素设 `background: var(--color-bg)`
- **Grid:** 1 col (mobile) / 2 col (md) / 3-4 col (xl) for card grids
- **Admin:** Fixed sidebar 220px + fluid content area
- **Max content width:** 1152px (72rem)
- **Border radius:** 分层圆角体系（开发时必须严格遵循）
  - **设计原则:** 网格容器保持直角以强化 Grid-disciplined 美学，交互元素用圆角增加亲和力，浮层用大圆角暗示层级
  - **第一层 — 直角（0px）— 网格容器 & 结构性边框:**
    - 统计卡片（MetricCard）: 直角 — 网格数据展示，保持冷静克制
    - 表格外层容器（`overflow-hidden border`）: 直角 — 数据密集型，锐利专业
    - PageHeaderCard / 内容区块容器: 直角 — 作为页面结构性骨架
    - 信息块（`border border-border bg-background/60`）: 直角 — 嵌套在卡片内的子块
    - 加载骨架容器: 直角 — 与目标组件保持一致
    - 示例: `border border-border bg-card p-6` ✅（不加 rounded）
  - **第二层 — 小圆角 `rounded-md`（6px）— 操作按钮 & 表单控件:**
    - 按钮（Button）: `rounded-md` — 所有尺寸统一，包括 sm/xs/icon 变体
    - 链接按钮（linkButtonClassName）: `rounded-md` — 与 Button 完全一致
    - 输入框（Input / Textarea）: `rounded-md` — 表单控件
    - Select trigger: `rounded-md`
    - 首页赛事卡片: `rounded-md` — 独立可点击卡片，区别于结构容器
    - 示例: 编辑、报名管理、取消发布等操作按钮均为 `rounded-md`
  - **第三层 — 胶囊 `rounded-full` — 标签 & 状态指示:**
    - Badge（所有 variant）: `rounded-full` — 已发布/草稿/报名中等状态标签
    - EventPhaseBadge: `rounded-full` — 赛事阶段标签
    - 用户信息胶囊: `rounded-full` — 右上角用户区域
    - 头像: `rounded-full` — 圆形
  - **第四层 — 大圆角 `rounded-lg`（8px）— 浮层 & 弹出:**
    - Dialog / Modal: `rounded-lg` — 浮层暗示高于页面层级
    - DropdownMenu popup: `rounded-lg`
    - Select popup: `rounded-lg`
    - Tabs list 容器: `rounded-lg`
  - **⚠️ 禁止事项:**
    - 禁止同一行操作按钮圆角不一致（Button 和 linkButtonClassName 必须统一）
    - 禁止给网格容器加 rounded（破坏 Grid-disciplined 美学）
    - 禁止自行发明圆角值（如 `rounded-[10px]`、`rounded-[12px]`），只用 Tailwind 预设
- **Navigation:** Fixed top, `backdrop-filter: blur(12px)`, 半透明背景 `rgba(250,248,245,0.85)`

## Accessibility
- **ARIA Landmarks:** 所有页面使用语义化 HTML landmarks
  - `<header role="banner" aria-label="网站头部">`
  - `<nav aria-label="主导航">` / `<nav aria-label="移动端导航">`
  - `<main id="main-content" aria-label="主内容区域">`
  - `<aside aria-label="管理后台导航">`
- **Loading States:** 关键数据页面提供骨架屏（`loading.tsx` + Suspense），使用 `animate-pulse` + `bg-muted`
- **Focus Visible:** 所有交互元素有 `:focus-visible` 样式（`ring-3 ring-ring/50`）
- **Touch Targets:** 最小 44×44px（按钮、链接、触控区域）

## Decoration
- **Grain texture:** 全局叠加 SVG fractalNoise 纹理，opacity 0.03，fixed 定位，pointer-events: none，z-index 1000
- **Section divider:** 1px solid var(--color-border)，不使用间距分割
- **Hover effects:** 背景色微变（accent-light 或 bg → surface），translateY(-1px)
- **Card style:** 无 box-shadow，仅 1px border，hover 时 border-color 加深
- **Status indicator:** 赛事卡片顶部 6px 高色条（accent=进行中, warning=即将开始, border=已结束）

## Motion
- **Approach:** Minimal-functional — 仅 fade-up 入场动画和 hover 过渡
- **Easing:** ease-out (enter), ease-in (exit), ease (general)
- **Duration:** 0.2s (hover/focus), 0.6s (fade-up 入场)
- **Fade-up:** `@keyframes fadeUp { from { opacity:0; translateY(20px) } to { opacity:1; translateY(0) } }`
- **Stagger:** 入场动画递增 0.1s delay（delay-1, delay-2, delay-3...）
- **MVP scope:** 仅 CSS transition + @keyframes，不引入动画库

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-21 | 初始设计系统创建 | /design-consultation 基于 Devpost/Devfolio/Junction/HackerEarth 竞品调研 |
| 2026-03-21 | Satoshi 做 Display 字体 | 竞品几乎全用 Inter/Roboto 变体，Satoshi 提供辨识度同时保持专业感 |
| 2026-03-22 | 整体风格从 Industrial/Utilitarian 切换到 Warm Minimal | 参考 Claude Code History Viewer 的暖调极简风格，更有辨识度 |
| 2026-03-22 | 铜橘 #D97757 替代工具蓝 #0F6FDE | 暖色强调色在米色背景上更协调，且在 AI 赛事平台中更独特 |
| 2026-03-22 | 零圆角设计 | 方正元素增强精密感和技术工具气质，与 grain 纹理搭配更和谐 |
| 2026-03-22 | 零圆角改为统一 4px | 完全零圆角过于生硬，用户反馈需要轻微圆角增加温和感。统一 4px（Tailwind `rounded-sm`）
| 2026-03-22 | 引入 IBM Plex Mono 做 UI 标签字体 | 等宽字体用于导航/标签/meta 信息，强化技术感和精密感 |
| 2026-03-22 | 1px gap 网格布局模式 | 用边框色做网格分割线，替代间距分割，更紧凑且有结构感 |
| 2026-03-22 | 全局 grain 噪点纹理 | SVG fractalNoise 叠加 3% 不透明度，增加质感但不影响可读性 |
| 2026-03-22 | 暗色模式继续延期 | PLAN.md 明确 MVP 不启用暗色模式，统一浅色 |
| 2026-03-23 | ARIA Landmarks 规范 | 为 header/main/nav/aside 添加语义化 ARIA labels，提升无障碍访问 |
| 2026-03-23 | 骨架屏加载态 | 首页/赛事详情/管理后台添加 `loading.tsx`，数据加载时显示骨架而非空白 |
