# 会话中断后的续做说明

这份文件的目标很简单：

- 当当前窗口因为上下文压缩失败、网络中断、远端 compact 异常等原因无法继续时
- 新开一个窗口后，可以不依赖旧聊天历史，直接恢复到可继续工作的状态

---

## 1. 新窗口默认恢复方式

每次新开窗口，直接把下面这段发给 Codex 即可：

```text
项目目录：/Users/mr.ma/Documents/demo

请先做这几步：
1. 读取 docs/architecture/SESSION-RECOVERY.md
2. 读取 docs/architecture/2026-03-23-current-state-and-handoff.md
3. 读取相关 spec 和当前任务对应的 plan
4. 检查 git status、当前分支、git log --oneline -5
5. 总结当前做到哪里
6. 直接继续往下做，不要重新规划，不要重复做已经完成的部分，除非遇到高风险决策再停下来确认
```

如果是某个 worktree 里的任务，直接补上工作树路径和分支名：

```text
项目目录：/Users/mr.ma/Documents/demo
当前工作树：<你的 worktree 路径>
当前分支：<你的分支名>

请先读取 SESSION-RECOVERY 和 handoff 文档，然后检查当前 git 状态，继续完成这个分支上的剩余工作。
```

---

## 2. 必读文件顺序

默认按这个顺序恢复：

1. `docs/architecture/SESSION-RECOVERY.md`
2. `docs/architecture/2026-03-23-current-state-and-handoff.md`
3. 当前任务相关 spec
4. 当前任务相关 plan
5. 当前分支最近提交和工作区状态

---

## 3. 当前项目的主恢复文档

核心项目文档：

- `docs/architecture/2026-03-23-current-state-and-handoff.md`
- `docs/superpowers/specs/2026-03-23-topology-management-platform-design.md`
- `docs/superpowers/plans/2026-03-23-topology-management-platform.md`

如果某次工作有独立 plan，也必须一起读。

例如当前已新增的切片计划：

- `docs/superpowers/plans/2026-03-25-topology-detail-linkage.md`

---

## 4. 续做时必须先检查的 Git 信息

新窗口恢复时，必须先检查：

- 当前目录
- 当前分支
- 是否在 worktree 内
- `git status --short --branch`
- `git log --oneline -5`
- 如果存在 worktree：`git worktree list`

目的：

- 防止在错误目录继续
- 防止在主分支直接开改
- 防止重复实现已经完成的内容

---

## 5. 什么时候更新这份文件

默认不是每次小改动都更新，而是在以下时机更新：

1. 完成一个阶段性任务之后
2. 新建一个新的 worktree / 分支切片之后
3. 写出新的 plan / spec 之后
4. 完成一次重要提交之后
5. 项目恢复入口、目录约定、执行方式发生变化之后

不需要更新的情况：

- 纯样式微调
- 小范围测试修复
- 不改变恢复路径的局部重构

---

## 6. 推荐的持续工作方式

为了让新窗口恢复更稳，默认遵守下面这些规则：

- 每个较大的任务放到独立分支或 worktree
- 每完成一个明确切片就提交一次
- 每完成一个值得恢复的阶段，就更新 handoff 或本文件
- 不把唯一上下文放在聊天历史里
- 以文档、Git 提交和 plan 作为真实上下文来源

---

## 7. 给未来窗口的默认指令

如果你不知道当前该从哪里继续，就默认按这个原则执行：

- 优先读取文档，而不是依赖聊天历史
- 优先检查 Git 现状，而不是假设任务未完成
- 优先继续当前分支上的未完成工作，而不是重新开题
- 除非遇到高风险决策，否则直接往下做，不要频繁停下来等待“继续”

---

## 8. 当前约定

当前项目默认：

- 主仓库目录：`/Users/mr.ma/Documents/demo`
- 主交接文档：`docs/architecture/2026-03-23-current-state-and-handoff.md`
- 会话恢复文档：`docs/architecture/SESSION-RECOVERY.md`
- 允许使用 worktree 进行并行开发
- 恢复时优先依赖文档和 Git 状态，而不是旧窗口上下文
