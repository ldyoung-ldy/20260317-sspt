---
description: 保存当前项目进度，并补齐 PLAN/TODOS 中的 review 与 qa 计划
---

请执行一次“项目进度存档”工作流，并把结果落到仓库计划文件中。

目标：保存当前项目实际进度，并把后续 **review** 与 **qa** 环节计划补充完整。

执行要求：

1. 先读取并核对当前上下文：
   - `git status`
   - 最近提交记录
   - `PLAN.md`
   - `TODOS.md`
   - `acceptance/`
   - `RESOLVED_ISSUES.md`

2. 更新计划文件时，至少同步：
   - `PLAN.md`
   - `TODOS.md`

3. “保存当前进度”时必须明确写出：
   - 已完成的功能
   - 当前阻塞 / 风险
   - 下一步最高优先级
   - 与实际代码、验收记录不一致的旧计划项

4. 必须补齐完整的 **review** 与 **qa** 计划，至少覆盖：
   - pre-landing review / diff review
   - authenticated admin flow QA
   - create / publish / unpublish 回归
   - 非法表单校验场景
   - slug 与边界情况验证
   - acceptance 结果回写与收尾

5. 如果 `acceptance/` 中已有对应验收文件，且这次进度影响了验收状态，要一并同步更新。

6. 不要更新 `README.md` 或无关文档；没有明确要求时不要自动创建 git commit。

7. 完成后用简短总结回复：
   - 更新了哪些文件
   - 新增/补齐了哪些 review 与 qa 计划项
   - 当前建议用户下一步执行什么
