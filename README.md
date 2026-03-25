# 智能拓扑管理与护网作战平台

这是一个面向等保保护对象的本地可运行平台，当前已经具备：

- 资产、流向、设备、控制点、暴露面、账号的模板化录入
- 动态拓扑、事件中心、护网推演、AI 编排、运行与接入、合规备案等工作面
- `collector -> API -> events -> topology / strategy / operations` 的最小运行闭环
- 对象级精确落点能力：从首页、运行与接入、事件、拓扑、策略之间可以直接跳到目标对象

## 核心文档

- 总设计说明：
  [docs/superpowers/specs/2026-03-23-topology-management-platform-design.md](/Users/mr.ma/Documents/demo/docs/superpowers/specs/2026-03-23-topology-management-platform-design.md)
- 实现计划：
  [docs/superpowers/plans/2026-03-23-topology-management-platform.md](/Users/mr.ma/Documents/demo/docs/superpowers/plans/2026-03-23-topology-management-platform.md)
- 当前状态与交接：
  [docs/architecture/2026-03-23-current-state-and-handoff.md](/Users/mr.ma/Documents/demo/docs/architecture/2026-03-23-current-state-and-handoff.md)
- 启动与演示手册：
  [docs/architecture/2026-03-24-demo-and-runbook.md](/Users/mr.ma/Documents/demo/docs/architecture/2026-03-24-demo-and-runbook.md)

## 本地启动

1. 安装 Node 依赖

```bash
npm install
```

2. 准备 Python 环境

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -e apps/api[dev]
pip install -e services/syslog-collector
```

3. 启动 API

```bash
.venv/bin/uvicorn app.main:app --app-dir apps/api --reload --host 0.0.0.0 --port 8000
```

4. 启动 Web

```bash
npm --workspace apps/web run dev
```

5. 可选：启动默认 collector

```bash
PYTHONPATH=services/syslog-collector .venv/bin/python -m syslog_collector
```

## 默认访问地址

- Web: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:8000](http://localhost:8000)
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

## 推荐演示路径

1. 首页总驾驶舱：`/`
2. 运行与接入：`/operations`
3. 策略与设备：`/strategy`
4. 监控与事件：`/events`
5. 动态拓扑：`/topology`
6. 应急与护网：`/war-room`
7. AI 编排：`/orchestration`
8. 合规与备案：`/compliance`

## 验证命令

```bash
npm --workspace apps/web run test
npm --workspace apps/web run build
.venv/bin/pytest apps/api/tests -v
cd services/syslog-collector && /Users/mr.ma/Documents/demo/.venv/bin/pytest syslog_collector/tests -v
```
