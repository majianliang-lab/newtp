# 启动与演示手册

## 1. 适用范围

这份手册用于：

- 本机启动当前平台
- 快速验证服务是否正常
- 按推荐顺序演示主要模块
- 在交付或换人接手时快速恢复上下文

---

## 2. 启动前提

建议环境：

- Node.js 20+
- Python 3.14
- 当前仓库根目录：`/Users/mr.ma/Documents/demo`

---

## 3. 一次性安装

### 3.1 Node 依赖

```bash
cd /Users/mr.ma/Documents/demo
npm install
```

### 3.2 Python 依赖

```bash
cd /Users/mr.ma/Documents/demo
python3 -m venv .venv
. .venv/bin/activate
pip install -e apps/api[dev]
pip install -e services/syslog-collector
```

---

## 4. 启动方式

### 4.1 启动 API

```bash
cd /Users/mr.ma/Documents/demo
.venv/bin/uvicorn app.main:app --app-dir apps/api --reload --host 0.0.0.0 --port 8000
```

启动后访问：

- [http://localhost:8000](http://localhost:8000)
- [http://localhost:8000/docs](http://localhost:8000/docs)

### 4.2 启动 Web

```bash
cd /Users/mr.ma/Documents/demo
npm --workspace apps/web run dev
```

启动后访问：

- [http://localhost:3000](http://localhost:3000)

### 4.3 启动默认 collector

可选，但推荐开启，这样能看到 collector 运行态和心跳。

```bash
cd /Users/mr.ma/Documents/demo
PYTHONPATH=services/syslog-collector .venv/bin/python -m syslog_collector
```

---

## 5. 推荐演示路径

### 5.1 首页总驾驶舱

地址：

- [http://localhost:3000](http://localhost:3000)

看点：

- 资产、流向、设备、实时事件、待审批变更总览
- collector 接入状态
- 最近审批与执行
- 首页到 `/operations` 和 `/strategy` 的精确跳转

### 5.2 运行与接入

地址：

- [http://localhost:3000/operations](http://localhost:3000/operations)

看点：

- `建议优先动作`
- collector / 设备 / 事件 / 待审批变更的对象级落点
- `collectorId` 命中后会显示 `定位命中`

### 5.3 策略与设备

地址：

- [http://localhost:3000/strategy](http://localhost:3000/strategy)

看点：

- 设备接入健康度
- 最近策略变更与模拟批准
- `searchDevice` 与 `recordId` 命中后会显示 `定位命中`

### 5.4 监控与事件

地址：

- [http://localhost:3000/events](http://localhost:3000/events)

看点：

- 实时事件优先展示
- 事件到拓扑流向 / 资产定位
- collector 在线状态

### 5.5 动态拓扑

地址：

- [http://localhost:3000/topology](http://localhost:3000/topology)

看点：

- 域视角 / 资产视角 / 流向视角
- `targetNodeId / targetEdgeId` 精确落点
- 445 回放与详情联动

### 5.6 应急与护网

地址：

- [http://localhost:3000/war-room](http://localhost:3000/war-room)

看点：

- 445 回放
- 推荐动作
- 执行回执
- 误杀流向 / 事件证据回跳

### 5.7 AI 编排

地址：

- [http://localhost:3000/orchestration](http://localhost:3000/orchestration)

推荐输入：

- `立即阻断全网 TCP 445 横向访问，防止勒索病毒扩散。`
- `立即隔离感染主机 10.10.32.45，阻止进一步扩散。`

看点：

- 意图解析
- 回放摘要
- 推荐动作与推荐例外
- 提交审批流

### 5.8 合规与备案

地址：

- [http://localhost:3000/compliance](http://localhost:3000/compliance)

看点：

- 模板录入
- 最近录入对象
- 备案摘要

---

## 6. 回归验证

### 6.1 Web

```bash
cd /Users/mr.ma/Documents/demo
npm --workspace apps/web run test
npm --workspace apps/web run build
```

### 6.2 API

```bash
cd /Users/mr.ma/Documents/demo
.venv/bin/pytest apps/api/tests -v
```

### 6.3 Collector

```bash
cd /Users/mr.ma/Documents/demo/services/syslog-collector
/Users/mr.ma/Documents/demo/.venv/bin/pytest syslog_collector/tests -v
```

---

## 7. 当前建议

如果只是演示：

- 优先看 `/`、`/operations`、`/strategy`、`/events`、`/topology`

如果是继续开发：

- 先读
  [2026-03-23-current-state-and-handoff.md](/Users/mr.ma/Documents/demo/docs/architecture/2026-03-23-current-state-and-handoff.md)
- 再读
  [2026-03-23-topology-management-platform-design.md](/Users/mr.ma/Documents/demo/docs/superpowers/specs/2026-03-23-topology-management-platform-design.md)
