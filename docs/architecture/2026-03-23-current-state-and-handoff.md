# 当前进展与续做交接文档

**日期**：2026-03-23

**用途**：为后续新窗口/新会话继续开发提供稳定上下文，避免仅依赖聊天历史。

---

## 1. 项目当前目标

正在构建一套：

- 面向等保保护对象的智能拓扑管理平台
- 支持动态安全域拓扑、多视角查看、模板化录入、备案导出
- 支持护网场景、黑名单批量阻断、主机失陷隔离、业务影响评估
- 以天融信安全设备为主要控制对象，配置语义贴近 `NGTOS`
- 支持本机完整仿真，不依赖真实设备
- AI 默认采用 `GPT-5.4`

该平台不是单一页面，而是一套：

- 总驾驶舱
- 动态拓扑中心
- 资产与业务工作台
- 策略与设备工作台
- 监控与事件工作台
- 应急与护网工作台
- 合规与备案工作台
- 仿真与演练中心

---

## 2. 已沉淀的核心文档

### 2.1 产品/架构设计说明

文件：

- `docs/superpowers/specs/2026-03-23-topology-management-platform-design.md`

说明：

- 这是当前项目的总设计基线
- 记录了产品定位、角色、页面体系、核心数据模型、AI 编排中心、护网案例、仿真平台设计
- 后续如需开新窗口，优先从这份文档读取项目整体意图

### 2.2 实现计划

文件：

- `docs/superpowers/plans/2026-03-23-topology-management-platform.md`

说明：

- 这是当前项目的实施拆解清单
- 记录了 monorepo、web、api、sim-core、syslog-collector、seed-data、infra 的推荐结构
- 不是所有计划任务都已实施，目前仅完成了其中的第一部分骨架

### 2.3 当前进展交接文档

文件：

- `docs/architecture/2026-03-23-current-state-and-handoff.md`

说明：

- 本文件用于持续记录“当前已经做到哪里、下一步做什么、有哪些环境限制”
- 新窗口继续时优先读本文件，再读设计说明和实现计划

---

## 3. 当前代码层已完成的内容

### 3.1 根目录工程骨架

已创建：

- `README.md`
- `package.json`
- `turbo.json`
- `.gitignore`

作用：

- 建立了本地 monorepo 根骨架
- 当前 Node 侧使用 `npm workspaces`
- 暂未使用 `pnpm`

注意：

- 这是为了适配当前机器环境的临时现实选择，不影响后续切回 `pnpm`

### 3.2 Web 应用骨架

已创建目录：

- `apps/web`

主要文件：

- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `apps/web/vitest.config.ts`
- `apps/web/vitest.setup.ts`
- `apps/web/app/layout.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `apps/web/app/(platform)/events/page.tsx`
- `apps/web/app/(platform)/orchestration/page.tsx`
- `apps/web/app/(platform)/war-room/page.tsx`

说明：

- Next.js + React 基础壳已建立
- 测试框架为 `vitest`
- `vitest.config.ts` 已增加 JSX 运行时注入：
  - `jsxInject: import React from "react"`
  - 这是为了兼容 Next 将 `tsconfig.json` 改为 `jsx: preserve` 后的测试运行

### 3.3 全局应用壳

已完成：

- `apps/web/app/page.tsx`
- `apps/web/components/navigation/app-shell.tsx`
- `apps/web/components/navigation/sidebar.tsx`
- `apps/web/components/navigation/topbar.tsx`
- `apps/web/components/dashboard/summary-cards.tsx`
- `apps/web/components/dashboard/summary-cards.test.tsx`
- `apps/web/components/dashboard/dashboard-workspace.tsx`
- `apps/web/components/dashboard/dashboard-workspace.test.tsx`

现状：

- 已有全局左侧导航
- 已有顶部状态栏
- 顶部摘要卡当前已接入真实聚合接口 `/api/dashboard/overview`
- 已新增真实 `总驾驶舱` 页面：
  - 首页当前会聚合 `/api/assets`、`/api/flows`、`/api/devices`、`/api/events/live`、`/api/simulation/replay/smb-445`
  - 已展示资产对象 / 业务流向 / 安全设备 / 实时事件四类总览指标
  - 已展示模块入口卡片，可直接进入：
    - 资产与业务
    - 策略与设备
    - 运行与接入
    - 动态拓扑
    - AI 编排
    - 监控与事件
    - 应急与护网
    - 合规与备案
    - 仿真与演练
  - 已展示当前重点演练场景摘要、受影响资产和应急/仿真直达入口
- 侧边导航已接通真实入口：
  - `/`
  - `/operations`
  - `/topology`
  - `/orchestration`
  - `/business`
  - `/strategy`
  - `/events`
  - `/war-room`
  - `/compliance`
  - `/simulation`
- 顶部摘要卡当前会展示：
  - 高价值资产
  - 互联网暴露面
  - 日志接入率
  - 高危事件
- 顶部摘要卡当前已新增：
  - 待审批变更
  - Collector 在线
- 首页总驾驶舱当前已新增变更总览：
  - hero 区已展示待审批变更计数
  - 已新增 `最近审批与执行` 区域
  - 可直接从首页回跳到策略审批或护网页面来源记录
  - orchestration 待审批记录当前会精确落到 `/strategy?recordId=...`
- 首页总驾驶舱当前已新增 `数据接入状态` 区域：
  - 当前会展示主 collector ID、监听地址、API 转发地址与心跳间隔
  - 当前会展示 collector 在线数 / 总数
  - 当前会展示主 collector 在线 / 离线状态
  - 当前会展示其余 collector 实例列表
  - 可直接跳转到 `/events`
  - collector 实例当前已支持精确落到 `/operations?collectorId=...`
- 目前首页工作台和全局摘要卡都已升级成真实聚合总览

### 3.4 模板录入中心

已完成：

- `apps/web/app/(platform)/compliance/page.tsx`
- `apps/web/components/forms/template-center.tsx`
- `apps/web/components/forms/asset-form.tsx`
- `apps/web/components/forms/asset-form.test.tsx`
- `apps/web/components/forms/exposure-form.tsx`
- `apps/web/components/forms/account-form.tsx`
- `apps/web/components/forms/flow-form.tsx`
- `apps/web/components/forms/device-form.tsx`
- `apps/web/components/forms/control-point-form.tsx`
- `apps/web/lib/api.ts`

现状：

- 已有“高价值资产、互联网暴露面、账号权限矩阵、核心业务流向、安全设备、控制点”六大入口
- 模板中心顶部已新增跨工作面入口：
  - `/business`
  - `/strategy`
  - `/topology?view=asset-view`
- 模板中心已能从 API 拉取：
  - 保护对象数量
  - 安全域数量
  - 资产数量
  - 设备数量
  - 备案摘要 `/api/compliance/report`
- 高价值资产表单已升级为受控表单
- 高价值资产表单已具备实际提交能力，可调用 `/api/assets`
- 暴露面表单已具备实际提交能力，可调用 `/api/exposures`
- 账号表单已具备实际提交能力，可调用 `/api/accounts`
- 流向表单已具备实际提交能力，可调用 `/api/flows`
- 设备表单已具备实际提交能力，可调用 `/api/devices`
- 控制点表单已具备实际提交能力，可调用 `/api/control-points`
- 已新增“最近录入对象”区域，直接展示最近资产、最近设备和最近流向
- 已新增“最近变更”区域，记录资产、暴露面、账号、流向、设备、控制点的最近录入动作
- 最近录入对象已按最新创建顺序展示，而不是按最早对象展示
- 最近录入资产、最近纳管设备、最近录入流向已变成真实联动入口：
  - 资产可直接跳转到拓扑资产视角
  - 设备可直接跳转到策略与设备工作台
  - 流向可直接跳转到拓扑流向视角
- 已新增 `备案摘要` 区域：
  - 展示备案 readiness 百分比
  - 展示 8 类备案对象的完成情况与样本对象
  - 支持工作面直达入口
  - 支持下载备案 JSON
- 当前模板中心已经从“静态壳”升级成“可读 + 可写”的真实对象入口

### 3.5 动态拓扑中心

已完成：

- `apps/web/app/(platform)/topology/page.tsx`
- `apps/web/components/topology/topology-canvas.tsx`
- `apps/web/components/topology/topology-workspace.tsx`
- `apps/web/components/topology/topology-workspace.test.tsx`
- `apps/web/components/topology/replay-panel.tsx`
- `apps/web/components/topology/view-switcher.tsx`
- `apps/web/components/topology/filter-bar.tsx`
- `apps/web/components/topology/details-panel.tsx`

现状：

- 已有第一版动态拓扑工作面
- 支持视角切换按钮、筛选栏、节点卡片、边摘要、详情侧栏
- 当前拓扑工作区已接后端：
  - `/api/topology/domain-view`
  - `/api/topology/asset-view`
  - `/api/topology/flow-view`
- 当前拓扑工作区已接入第一版护网场景回放结果：
  - `/api/simulation/replay/smb-445`
- 已新增 `445 护网应急推演` 面板，展示：
  - 流量允许/阻断统计
  - 误杀候选计数
  - 受影响资产
  - 白名单例外命中
  - 最近事件列表
- 视角切换已能真实触发重新取图
- 边摘要已开始用节点名称而不是裸 ID 展示
- 已不再完全依赖本地 demo fixture
- 已新增真实筛选联动：
  - 搜索
  - 风险等级筛选
  - 流向类型筛选
- 已新增边详情联动：
  - 点击关键流向可查看流向详情
  - 详情面板已支持节点/边双态展示
- 已新增从事件中心跳转过来的拓扑定位能力：
  - `/topology` 当前可消费 `view` 与 `search` 查询参数
  - 事件中心可带着资产/IP 定位信息跳转到资产视角并自动落入搜索态
- 已新增从事件中心直接落到流向视角的能力：
  - 高优先事件当前可带着 `protocol + port` 查询条件跳转到 `/topology?view=flow-view&search=...`
  - `flow view` 当前已支持基于 `protocol / port / flow_type` 的搜索命中
- 已新增显式目标参数能力：
  - 事件页当前会附带 `targetType / targetLabel / targetProtocol / targetPort / targetDestination`
  - 拓扑页会优先按这些显式目标参数精确选中命中的资产或流向
- 已新增基于对象 ID / 流向 ID 的精确定位能力：
  - `/topology` 当前可消费 `targetNodeId / targetEdgeId`
  - 当 URL 同时带有标签和稳定 ID 时，拓扑页当前会优先按稳定 ID 精确选中
  - 资产详情、流向详情、边详情回跳到事件页时，也会把这些稳定 ID 一并透传
- 已新增基于事件跳转的自动聚焦能力：
  - 带 `search` 参数进入拓扑页时，命中的资产或流向节点会自动在详情面板中打开
  - `flow` 节点详情当前已展示流向类型、协议端口与风险，不再只显示基础对象字段
- 已新增基于事件跳转的可见高亮：
  - 命中的资产或流向节点当前会显示“定位命中”徽标
  - 节点卡片会同步增强边框和高亮态，便于快速肉眼识别
- 已新增关键流向列表同步高亮：
  - 资产视角下，和命中资产相关的关键流向条目会显示“关联命中”
  - 节点高亮与关键流向列表当前已能形成最小同步感知
- 已新增从拓扑详情回跳事件证据的链路：
  - 资产详情与流向详情当前都提供“查看相关事件”入口
  - 资产会按 `targetLabel` 精确回跳到相关事件
  - 流向会按 `protocol + port + destination asset` 组合查询词回跳到事件证据
- 已新增回放 evidence 的后端定位引用：
  - `/api/simulation/replay/smb-445` 当前会直接返回 `impacted_asset_refs`
  - 白名单例外和误杀候选当前会直接返回 `target_asset_node_id / target_flow_node_id / target_edge_id`
  - 因此前台不必总是靠额外拓扑请求来猜测定位对象
- 已新增 ReplayPanel 最近事件证据入口：
  - 当 replay event 自带 `destination_ip / host_ip` 与稳定引用时，最近事件卡片会提供“查看事件详情”
  - 当前会优先把 `targetNodeId / targetEdgeId` 继续带到 `/events`
- 当前仍是简化工作面，不是最终图形引擎版本

### 3.5.1 应急与护网工作台

已完成：

- `apps/web/app/(platform)/war-room/page.tsx`
- `apps/web/components/war-room/war-room-workspace.tsx`
- `apps/web/components/war-room/war-room-workspace.test.tsx`

现状：

- 已新增第一版 `应急与护网` 页面
- 页面当前直接接入 `/api/simulation/replay/smb-445`
- 页面当前直接接入：
  - `/api/simulation/replay/smb-445`
  - `/api/simulation/actions/smb-445`
  - `/api/simulation/actions/smb-445/execute`
- 已展示：
  - `445` 护网应急推演标题与 AI 摘要
  - 事件类型分布
  - 误杀候选流量卡片
  - 处置建议卡片
  - 黑名单批量阻断建议
  - 感染主机隔离建议
  - 天融信 `NGTOS` 风格意图摘要
  - 回滚提示
  - 受影响资产
  - 白名单例外命中
  - 最近安全事件
- 已新增护网页面对拓扑/事件的证据跳转：
  - 回放面板中的受影响资产当前可一键回到拓扑资产视角
  - 误杀候选流量当前可直接定位到拓扑流向视角
  - 误杀候选流量当前可直接回跳到事件证据页
  - 当前优先消费 replay evidence 自带的 `targetNodeId / targetEdgeId`
  - 当 replay evidence 缺少这些引用时，`war-room` 仍会回退到拓扑视图做一次补充映射
  - 因此受影响资产和误杀流向现在都能以对象 ID / 流向节点 ID / 边 ID 级别精确落位
- 已支持在工作台内直接执行处置动作，并展示执行回执：
  - `action_id`
  - `status`
  - `executed_device_count`
  - `generated_event_types`
  - `summary`
- 该页面当前是第一版战时工作面，后续可继续扩充审批、回滚与批量执行编排

### 3.5.2 监控与事件工作台

已完成：

- `apps/web/app/(platform)/events/page.tsx`
- `apps/web/components/events/events-workspace.tsx`
- `apps/web/components/events/events-workspace.test.tsx`

现状：

- 已新增第一版 `监控与事件` 页面
- 页面当前已优先接入 `/api/events/live`
- 当实时事件流为空时，会自动回退到 `/api/simulation/replay/smb-445`
- 当前展示内容包括：
  - 事件总数 / 高优先事件 / 策略变更 / 误杀候选四张指标卡
  - 高优先事件流
  - 事件类型分布
  - 受影响资产清单
- 已支持优先展示 collector / API 摄取进来的实时标准化事件
- 实时模式当前使用 `live-event-stream` 作为场景标识，便于和回放场景区分
- 已新增 collector 运行态展示：
  - 页面当前会读取 `/api/collector/statuses`
  - 当前会展示主 collector ID、监听地址、API 转发地址与心跳间隔
  - 当前会展示 collector 在线数 / 总数
  - 当前会展示主 collector 在线 / 离线状态
  - 当前会展示其余 collector 实例列表
- 已新增到拓扑中心的定位链路：
  - 受影响资产当前可一键跳转到 `/topology?view=asset-view&search=...`
  - 跳转后拓扑工作区会自动切到资产视角并带入搜索条件
- 已新增到拓扑流向视角的直达链路：
  - 高优先事件卡片当前可一键打开关联流向视角
  - 会自动带入 `tcp 445 10.20.30.15` 这类查询词，并附带显式目标参数
- 已新增事件跳转后的自动详情打开：
  - 从事件中心跳到资产视角或流向视角后，详情面板会自动聚焦命中的对象
- 已新增来自拓扑详情的事件证据回跳消费能力：
  - `/events` 当前可消费 `search`、`targetLabel`、`targetNodeId` 与 `targetEdgeId` 查询参数
  - 命中的事件卡片会显示“定位命中”徽标
  - 证据回跳时，高优先事件流、事件类型分布与受影响资产会按当前证据子集收敛展示
  - 事件页当前会把收到的稳定 ID 继续透传回拓扑页，保证来回跳转时仍能落到同一对象/流向
- 已新增事件页的 ID 级精确过滤：
  - 当 URL 中带有 `targetEdgeId / targetNodeId` 且当前事件流中存在对应稳定引用时，事件列表会优先收敛到精确命中的证据
  - 若当前事件流不带这些稳定引用，则会自动回退到 `search / targetLabel` 过滤，避免页面被误过滤为空
- 该页面当前采用客户端拉取数据，因此服务端初始 HTML 会先显示“事件流加载中...”，随后在浏览器端完成数据填充

### 3.5.3 AI 编排中心

已完成：

- `apps/web/app/(platform)/orchestration/page.tsx`
- `apps/web/components/orchestration/orchestration-workspace.tsx`
- `apps/web/components/orchestration/orchestration-workspace.test.tsx`

现状：

- 已新增第一版 `AI 编排中心` 页面
- 页面当前直接接入 `/api/orchestration/simulate`
- 当前已支持最小闭环：
  - 输入自然语言编排意图
  - 发起编排模拟请求
  - 展示结构化意图解析结果
  - 展示回放摘要、受影响资产与关键统计
  - 展示解释链
  - 展示审批态与所需审批角色
  - 展示分步骤执行计划
  - 展示推荐动作与推荐例外
- 页面当前已提供常见编排示例入口：
  - `445` 横向阻断
  - 感染主机隔离
  - 黑名单批量封堵
  - 新业务放通
  - 暴露面收敛
- 当前已具备第一版解释链工作面：
  - 意图解析
  - 回放结果
  - 解释链
  - 审批态
  - 执行计划
  - 推荐动作
  - 推荐例外
- 当前已支持至少五类意图：
  - `445` 横向阻断
  - 感染主机隔离
  - 黑名单批量封堵
  - 新业务放通
  - 暴露面收敛
- 当前已补上最小审批提交闭环：
  - 编排结果可直接 `提交审批流`
  - 提交后会生成统一变更记录编号
  - 可继续跳转到策略工作台处理审批与执行
- 后续继续扩更多意图类型、更细的误杀解释与真实审批流转

### 3.5.4 资产与业务工作台

已完成：

- `apps/web/app/(platform)/business/page.tsx`
- `apps/web/components/business/business-workspace.tsx`
- `apps/web/components/business/business-workspace.test.tsx`

现状：

- 已新增第一版 `资产与业务` 页面
- 页面当前直接接入：
  - `/api/assets`
  - `/api/flows`
  - `/api/exposures`
  - `/api/accounts`
- 当前已支持最小业务侧总览：
  - 资产总数
  - 核心流向
  - 暴露面
  - 关键账号
- 当前已展示四类对象清单：
  - 高价值资产
  - 核心业务流向
  - 互联网暴露面
  - 关键账号
- 页面顶部已新增工作面直达入口：
  - 进入资产拓扑
  - 查看事件证据
  - 维护基础对象
- 资产、流向、暴露面、账号四类对象当前都已带真实跳转：
  - 资产可定位到拓扑
  - 流向可查看拓扑流向
  - 暴露面可查看相关事件
  - 账号可回到合规维护
- 该页面当前已从“只读清单”升级成“业务对象总览 + 联动入口”工作面

### 3.5.5 策略与设备工作台

已完成：

- `apps/web/app/(platform)/strategy/page.tsx`
- `apps/web/components/strategy/strategy-workspace.tsx`
- `apps/web/components/strategy/strategy-workspace.test.tsx`

现状：

- 已新增第一版 `策略与设备` 页面
- 页面当前直接接入：
  - `/api/devices`
  - `/api/control-points`
- 当前已支持最小策略侧总览：
  - 设备总数
  - 可推策略设备
  - 控制点
  - 审批中变更
- 页面当前已新增 `设备接入健康度` 区域：
  - 会展示日志接入率、已接入日志、未接入日志、只读设备
  - 未接入设备可直接跳转到事件中心查看相关事件
  - 可直接回到合规中心补录接入信息
  - 当前已支持来自 `/operations` 的 `searchDevice` 精确定位
  - 命中设备卡片会显示 `定位命中`
- 页面当前已新增 `采集器运行态` 区域：
  - 会展示采集器在线率、在线采集器、离线采集器、主心跳周期
  - 当前会直接展示 collector 多实例清单与在线 / 离线状态
  - 可直接跳转到事件中心查看接入链路事件
- 当前已展示两类对象清单：
  - 安全设备
  - 控制点
- 页面顶部已新增工作面直达入口：
  - 进入 AI 编排
  - 查看仿真策略
  - 查看设备事件
- 当前已形成最小策略治理联动：
  - 可推策略设备可直接生成变更编排
  - 只读设备可查看相关事件
  - 支持仿真的控制点可直接进入仿真推演
  - 仅监控控制点可查看域间关系
- 页面当前已新增 `最近策略变更` 区域：
  - 会汇总 AI 编排提交和 war-room 执行产生的统一变更记录
  - 审批中记录可直接在策略工作台内 `模拟批准`
  - 已执行记录可回跳来源工作面
  - 当前已支持来自 `/operations` 的 `recordId` 精确定位
  - 命中变更记录会显示 `定位命中`
- 该页面当前已从“设备清单页”升级成“策略治理入口 + 审批闭环面”

### 3.5.5A 运行与接入工作台

已完成：

- `apps/web/app/(platform)/operations/page.tsx`
- `apps/web/components/operations/operations-workspace.tsx`
- `apps/web/components/operations/operations-workspace.test.tsx`

现状：

- 已新增第一版 `运行与接入` 页面
- 页面当前直接接入：
  - `/api/operations/overview`
- 该聚合接口当前会统一返回：
  - collector 在线数 / 总数
  - 设备接入率与采集链健康度
  - 未接入设备
  - 最近运行事件
  - 最近策略与处置变更
  - 接入归因摘要与建议动作
  - 已按优先级输出 `recommended_actions`
  - `recommended_actions` 与诊断项当前会携带 `targets`
  - `targets` 当前会给出最值得先看的 collector / 设备 / 高危目标 / 待审批变更入口
  - 诊断项当前带 `P1/P2/P3/P4` 优先级标签
  - 固定三组归因视图：
    - `Collector 异常`
    - `设备接入异常`
    - `事件与处置`
- 当前已支持最小运行态总览：
  - 采集器在线
  - 设备接入率
  - 实时事件
  - 待审批变更
  - 采集链健康度
- 当前已展示三类运行态清单：
  - collector 实例
  - 未接入设备
  - 最近运行事件
- 页面当前已新增 `接入归因摘要` 区域：
  - 当前会固定展示 `Collector / 设备 / 事件处置` 三组归因
  - 即使某一组当前无异常，也会给出稳定态提示，避免工作面结构跳变
  - 可直接跳转到事件中心或合规中心继续处置
- 页面当前已新增 `建议优先动作` 区域：
  - 会按优先级顺序展示最该先处理的运行态动作
  - 当前已展示 `P1/P2/P3/P4` 标签，帮助快速判断先后顺序
  - 每条建议动作当前会展示 `优先对象`
  - 可直接点击跳到对应 collector、设备、事件目标或待审批来源页面
  - 高危事件类建议动作当前已补成双入口：
    - `事件证据` 入口可回到 `/events`
    - `拓扑流向` 入口可直接落到 `/topology` 的流向视角
  - collector 类建议动作当前已补成精确落点：
    - 可直接落到 `/operations?collectorId=...`
  - 设备接入类建议动作当前已补成精确落点：
    - 可直接落到 `/strategy?searchDevice=...`
  - 待审批变更类建议动作当前已补成精确落点：
    - 可直接落到 `/strategy?recordId=...`
- 页面当前已补齐“摘要 -> 对象”的最后一层：
  - 不再只告诉操作者哪里异常
  - 还会直接给出这一步最值得先看的对象入口
- 运行与接入页当前也已支持 `collectorId` 定位参数：
  - 命中 collector 实例卡会显示 `定位命中`
- 页面底部已补齐最近策略与处置变更清单：
  - 可回跳到 AI 编排或 war-room 来源工作面
- 该页面当前已作为“运行巡检入口 + 接入治理入口”并入主导航和首页模块入口

### 3.5.6 仿真与演练中心

已完成：

- `apps/web/app/(platform)/simulation/page.tsx`
- `apps/web/components/simulation/simulation-workspace.tsx`
- `apps/web/components/simulation/simulation-workspace.test.tsx`

现状：

- 已新增第一版 `仿真与演练` 页面
- 页面当前直接接入：
  - `/api/simulation/replay/smb-445`
  - `/api/simulation/actions/smb-445`
- 当前已支持最小演练总览：
  - 推演场景摘要
  - 允许/阻断/策略变更/安全事件四类统计
  - 受影响资产摘要
  - 推荐动作清单
- 页面顶部已新增工作面直达入口：
  - 进入应急执行
  - 交给 AI 编排
  - 查看拓扑流向
- 当前已形成最小演练联动：
  - 受影响资产可直接跳转到拓扑资产视角
  - 推荐动作可直接跳转到护网页面或 AI 编排中心
- 该页面当前已从“仿真查看页”升级成“仿真结果 + 执行入口”工作面

### 3.6 共享对象模型 contracts 包

已创建目录：

- `packages/contracts`

主要文件：

- `packages/contracts/src/index.ts`
- `packages/contracts/src/protection-object.ts`
- `packages/contracts/src/security-domain.ts`
- `packages/contracts/src/asset.ts`
- `packages/contracts/src/exposure.ts`
- `packages/contracts/src/account.ts`
- `packages/contracts/src/flow.ts`
- `packages/contracts/src/device.ts`
- `packages/contracts/src/control-point.ts`
- `packages/contracts/src/event.ts`

说明：

- 已定义一批基础 Zod schema
- 当前已覆盖保护对象、安全域、资产、暴露面、账号、流向、设备、控制点、事件
- 这些 schema 是后续前后端共享语义层的基础

### 3.7 API 控制面骨架

已创建目录：

- `apps/api`

主要文件：

- `apps/api/pyproject.toml`
- `apps/api/app/main.py`
- `apps/api/app/config.py`
- `apps/api/app/db.py`
- `apps/api/app/api/router.py`
- `apps/api/app/api/health.py`
- `apps/api/app/api/assets.py`
- `apps/api/app/api/accounts.py`
- `apps/api/app/api/exposures.py`
- `apps/api/app/api/flows.py`
- `apps/api/app/api/devices.py`
- `apps/api/app/api/control_points.py`
- `apps/api/app/api/topology.py`
- `apps/api/app/api/simulation.py`
- `apps/api/app/api/orchestration.py`
- `apps/api/app/api/events.py`
- `apps/api/app/api/dashboard.py`
- `apps/api/app/api/compliance.py`
- `apps/api/app/api/change_records.py`
- `apps/api/app/models/protection_object.py`
- `apps/api/app/models/security_domain.py`
- `apps/api/app/models/asset.py`
- `apps/api/app/models/account.py`
- `apps/api/app/models/exposure.py`
- `apps/api/app/models/flow.py`
- `apps/api/app/models/device.py`
- `apps/api/app/models/control_point.py`
- `apps/api/app/schemas/asset.py`
- `apps/api/app/schemas/account.py`
- `apps/api/app/schemas/exposure.py`
- `apps/api/app/schemas/flow.py`
- `apps/api/app/schemas/device.py`
- `apps/api/app/schemas/control_point.py`
- `apps/api/app/schemas/simulation.py`
- `apps/api/app/schemas/orchestration.py`
- `apps/api/app/schemas/event_stream.py`
- `apps/api/app/schemas/dashboard.py`
- `apps/api/app/schemas/compliance.py`
- `apps/api/app/schemas/change_record.py`
- `apps/api/app/services/ai_orchestrator.py`
- `apps/api/app/services/change_record_store.py`
- `apps/api/app/services/event_store.py`
- `apps/api/app/services/intent_parser.py`
- `apps/api/app/services/impact_simulator.py`
- `apps/api/app/services/policy_optimizer.py`
- `apps/api/app/services/replay_scenarios.py`
- `apps/api/app/services/topology_projection.py`

说明：

- 已有 FastAPI 基础入口
- 已有健康检查接口
- 已有内存 SQLite + SQLAlchemy 基础数据库层
- 已有保护对象、安全域、资产、暴露面、账号、流向、设备、控制点等最小模型
- 已有以下创建接口：
  - `/api/assets`
  - `/api/exposures`
  - `/api/accounts`
  - `/api/flows`
  - `/api/devices`
  - `/api/control-points`
- 已有以下列表接口：
  - `/api/protection-objects`
  - `/api/security-domains`
  - `/api/assets`
  - `/api/exposures`
  - `/api/accounts`
  - `/api/flows`
  - `/api/devices`
  - `/api/control-points`
  - `/api/compliance/report`
  - `/api/change-records`
- 已有拓扑投影服务：
  - `build_domain_topology`
  - `build_asset_topology`
  - `build_flow_topology`
- 拓扑投影已新增更适合真实工作面联动的元数据：
  - 域级风险映射
  - 边级 `flow_type / protocol / port / risk`
  - `flow view` 节点级 `source_asset_label / destination_asset_label`
- 已有拓扑接口：
  - `/api/topology/domain-view`
  - `/api/topology/asset-view`
  - `/api/topology/flow-view`
- 已有第一版仿真场景接口：
  - `/api/simulation/replay/smb-445`
- 已有第一版处置建议接口：
  - `/api/simulation/actions/smb-445`
- 已新增备案摘要接口：
  - `/api/compliance/report`
  - 返回备案 readiness、8 类对象完成情况、样本对象与工作面跳转建议
- 已新增统一变更记录能力：
  - `/api/orchestration/submit`
  - `/api/change-records`
  - `/api/change-records/{record_id}/approve`
  - `/api/simulation/actions/smb-445/execute` 当前会自动沉淀已执行记录
- 已新增运行态统一聚合接口：
  - `/api/operations/overview`
  - 统一汇总 collector、设备接入、实时事件、待审批变更、未接入设备、最近运行事件与接入诊断建议
- 已将 `sim-core` 的 `445` 回放结果标准化为 API 响应对象：
  - `scenario_id`
  - `title`
  - `stats`
  - `evidence`
  - `events`
  - `event_type_counts`
- 当前回放 evidence 与 replay events 已支持稳定定位引用：
  - `impacted_asset_refs`
  - `target_asset_node_id`
  - `target_flow_node_id`
  - `target_edge_id`
- 已新增基于 `445` 护网场景的处置建议对象：
  - `blacklist_block`
  - `host_isolation`
  - 包含目标设备、目标对象、执行模式、优先级、`NGTOS` 意图摘要、回滚提示
- 已新增处置动作执行接口：
  - `/api/simulation/actions/smb-445/execute`
  - 返回执行回执、执行设备数与生成事件类型
- 已新增第一版 AI 编排接口：
  - `/api/orchestration/simulate`
  - 当前可将以下自然语言意图解析为结构化对象：
    - `445` 横向阻断
    - 感染主机隔离
    - 黑名单批量封堵
    - 新业务放通
    - 暴露面收敛
  - 当前会返回：
    - `intent`
    - `replay`
    - `explanation_chain`
    - `approval_state`
    - `execution_plan`
    - `recommended_actions`
    - `recommended_exceptions`
  - 当数据库中已存在对应资产/流向时，当前也会把 replay 与推荐例外中的稳定定位引用一并透传出来
- 已新增事件摄取与实时事件流接口：
  - `/api/events/ingest`
  - `/api/events/live`
  - 当前可将标准化事件写入 API 内存事件流，并供事件工作台优先消费
- 已新增仪表盘聚合接口：
  - `/api/dashboard/overview`
- 当前会统一返回高价值资产数、暴露面数、日志接入率、高危事件数、待审批变更数、已执行变更数、最近变更记录、重点场景摘要、collector 主状态、collector 在线数 / 总数以及 collector 实例列表
- 已新增 collector 运行态接口：
  - `/api/collector/heartbeat`
  - `/api/collector/status`
  - `/api/collector/statuses`
  - 当前可记录多个 collector 心跳，并向前台返回主 collector 状态与多实例运行态列表
- 已有最小种子数据：
  - 1 个默认保护对象
  - 1 个默认安全域
  - 1 个默认资产
  - 1 个默认设备

### 3.8 仿真层 sim-core

已创建目录：

- `services/sim-core`

主要文件：

- `services/sim-core/pyproject.toml`
- `services/sim-core/sim_core/models/device.py`
- `services/sim-core/sim_core/models/policy.py`
- `services/sim-core/sim_core/models/route.py`
- `services/sim-core/sim_core/engine/policy_matcher.py`
- `services/sim-core/sim_core/execution/scenario_executor.py`
- `services/sim-core/sim_core/execution/change_executor.py`
- `services/sim-core/sim_core/execution/replay_engine.py`
- `services/sim-core/sim_core/logging/formatter.py`
- `services/sim-core/sim_core/repository.py`
- `services/sim-core/sim_core/traffic/generator.py`
- `services/sim-core/sim_core/traffic/scenarios.py`
- `services/sim-core/sim_core/tests/test_device_repository.py`
- `services/sim-core/sim_core/tests/test_traffic_generator.py`
- `services/sim-core/sim_core/tests/test_policy_matcher.py`
- `services/sim-core/sim_core/tests/test_log_formatter.py`
- `services/sim-core/sim_core/tests/test_scenario_executor.py`
- `services/sim-core/sim_core/tests/test_change_executor.py`
- `services/sim-core/sim_core/tests/test_replay_engine.py`
- `services/sim-core/sim_core/seeds/topsec_branch_fw.json`
- `services/sim-core/sim_core/seeds/topsec_hq_ips.json`
- `services/sim-core/sim_core/seeds/topsec_dc_av.json`
- `seed-data/traffic/baseline_flows.json`

说明：

- 已有第一版天融信 `NGTOS` 虚拟设备数字孪生模型
- 已能从 JSON 种子恢复一台虚拟天融信防火墙
- 已扩展到多设备类型种子：
  - `ngfw`
  - `ips`
  - `av`
- 已具备接口、区域、地址对象、服务对象、策略、路由、syslog 配置块
- 已具备第一版逻辑流量发生器：
  - 基线业务流量生成
  - 异常扫描流量生成
- 已具备第一版策略命中引擎：
  - 根据接口网段解析源域/目的域
  - 根据地址对象和服务对象匹配 NGTOS 风格策略
  - 产出 permit/deny/implicit-deny 结果
- 已具备第一版命中日志格式化：
  - 将命中结果转换成天融信风格 `key=value` syslog 文本
- 已具备多类安全日志生成：
  - 策略命中日志
  - 策略变更日志
  - IPS 事件日志
  - 防病毒事件日志
- 已具备第一版批量场景执行器：
  - 支持一批基线流量和攻击流量跑过同一台虚拟设备
  - 同时返回命中结果与 syslog 文本
- 已具备第一版策略变更场景执行器：
  - 生成结构化变更记录
  - 同时生成变更 syslog
- 已具备第一版 `445` 时间窗回放引擎：
  - 将基线流量和攻击流量放入同一窗口回放
  - 串联策略变更、IPS 告警、防病毒告警
  - 输出聚合统计与误杀候选计数
  - 已新增证据输出层：
    - 受影响资产列表
    - 白名单例外命中明细
    - 误杀候选明细
    - AI 摘要文本
- 已通过 API 服务层暴露第一版护网剧本结果：
  - 自动加载 NGFW / IPS / AV 天融信虚拟设备
  - 自动加载基线流量种子
  - 自动注入 445 横向扫描攻击流量
  - 自动将 syslog 文本标准化为统一事件列表
  - 自动统计 `policy_hit / policy_change / ips_alert / antivirus_alert`

### 3.9 Syslog Collector 骨架

已创建目录：

- `services/syslog-collector`

主要文件：

- `services/syslog-collector/pyproject.toml`
- `services/syslog-collector/syslog_collector/parser.py`
- `services/syslog-collector/syslog_collector/normalizer.py`
- `services/syslog-collector/syslog_collector/server.py`
- `services/syslog-collector/syslog_collector/tests/test_parser.py`
- `services/syslog-collector/syslog_collector/tests/test_normalizer.py`
- `services/syslog-collector/syslog_collector/tests/test_server.py`

说明：

- 已有第一版 `key=value` syslog 解析器
- 已能解析天融信风格命中日志中的 `vendor/action/dport/src/dst`
- 已有最小 UDP datagram protocol 骨架，后续可直接接 `UDP/514`
- 已有可启动的 UDP collector 入口 `start_syslog_collector`
- 已通过 datagram 接收测试，证明真实 UDP socket 收包链已跑通
- 已有第一版事件标准化层：
  - 将天融信风格日志映射成统一事件字典
  - 已支持事件类型：
    - `policy_hit`
    - `policy_change`
    - `ips_alert`
    - `antivirus_alert`
  - 统一输出 `event_type/device_id/action/destination_port/source_zone/destination_zone`
- 已新增事件分发器 `EventDispatcher`
- 已新增 HTTP 消费适配器 `HttpEventConsumer`
- 当前 collector 协议层已具备：
  - `parse -> normalize -> dispatch` 串联
  - 同一条标准化事件 fan-out 给多个消费方
  - 可直接把标准化事件 POST 到 API 的 `/api/events/ingest`
  - 已从“仅测试回调”升级到“可直接接入 API / 监控层”的最小消费接口
- 已新增默认运行时装配：
  - `load_runtime_config` 当前可从环境变量读取 collector ID / host / port / API ingest URL / heartbeat URL / heartbeat interval
  - `build_default_dispatcher` 当前会默认挂载 `HttpEventConsumer`
  - 已新增 `python -m syslog_collector` 与 `syslog-collector` 启动入口
  - 因此 collector 已从“可复用库能力”升级成“可直接按默认配置启动的服务”
  - 默认启动入口当前会周期性向 API 的 `/api/collector/heartbeat` 发送运行心跳

### 3.10 Python 虚拟环境

已创建：

- `.venv`

说明：

- 当前 Python 依赖通过项目内虚拟环境安装
- 不依赖系统 Python 全局安装

---

## 4. 当前已通过的验证

说明：

- 当前为了提速，已切换为“先跑相关测试、到检查点再做更大范围验证”的节奏
- 下面先记录最近一轮已经实跑通过的定点检查点，再保留此前的全量回归记录

### 4.0 最近定点检查点

命令：

```bash
npm --workspace apps/web run test -- components/navigation/app-shell.test.tsx components/orchestration/orchestration-workspace.test.tsx
npm --workspace apps/web run test -- components/navigation/app-shell.test.tsx components/dashboard/dashboard-workspace.test.tsx components/business/business-workspace.test.tsx components/strategy/strategy-workspace.test.tsx components/simulation/simulation-workspace.test.tsx
npm --workspace apps/web run test -- components/navigation/app-shell.test.tsx components/dashboard/summary-cards.test.tsx components/dashboard/dashboard-workspace.test.tsx components/orchestration/orchestration-workspace.test.tsx
npm --workspace apps/web run test -- components/events/events-workspace.test.tsx
npm --workspace apps/web run test -- components/dashboard/dashboard-workspace.test.tsx components/events/events-workspace.test.tsx
npm --workspace apps/web run test -- components/dashboard/summary-cards.test.tsx components/dashboard/dashboard-workspace.test.tsx components/events/events-workspace.test.tsx
npm --workspace apps/web run test -- components/strategy/strategy-workspace.test.tsx
npm --workspace apps/web run test -- components/operations/operations-workspace.test.tsx components/navigation/app-shell.test.tsx
npm --workspace apps/web run test -- components/dashboard/dashboard-workspace.test.tsx components/operations/operations-workspace.test.tsx components/navigation/app-shell.test.tsx
npm --workspace apps/web run test
.venv/bin/pytest apps/api/tests/test_operations_api.py -v
.venv/bin/pytest apps/api/tests/test_operations_api.py apps/api/tests/test_dashboard_api.py -v
npm --workspace apps/web run test -- components/topology/topology-workspace.test.tsx
npm --workspace apps/web run test -- components/war-room/war-room-workspace.test.tsx
.venv/bin/pytest apps/api/tests -v
.venv/bin/pytest apps/api/tests/test_collector_api.py apps/api/tests/test_dashboard_api.py -v
.venv/bin/pytest apps/api/tests/test_dashboard_api.py -v
.venv/bin/pytest apps/api/tests/test_simulation_api.py -v
.venv/bin/pytest apps/api/tests/test_event_api.py -v
.venv/bin/pytest apps/api/tests/test_intent_parser.py -v
cd services/syslog-collector && /Users/mr.ma/Documents/demo/.venv/bin/pytest syslog_collector/tests/test_server.py -v
cd services/syslog-collector && /Users/mr.ma/Documents/demo/.venv/bin/pytest syslog_collector/tests -v
npm --workspace apps/web run build
```

当前结果：

- `components/navigation/app-shell.test.tsx` + `components/orchestration/orchestration-workspace.test.tsx`：`3` 项通过
- `components/orchestration/orchestration-workspace.test.tsx`：`2` 项通过
- `components/navigation/app-shell.test.tsx` + `components/dashboard/dashboard-workspace.test.tsx` + `components/business/business-workspace.test.tsx` + `components/strategy/strategy-workspace.test.tsx` + `components/simulation/simulation-workspace.test.tsx`：`5` 项通过
- `components/navigation/app-shell.test.tsx` + `components/dashboard/summary-cards.test.tsx` + `components/dashboard/dashboard-workspace.test.tsx` + `components/orchestration/orchestration-workspace.test.tsx`：`5` 项通过
- `components/events/events-workspace.test.tsx`：`8` 项通过
- `components/dashboard/dashboard-workspace.test.tsx` + `components/events/events-workspace.test.tsx`：`9` 项通过
- `components/dashboard/summary-cards.test.tsx` + `components/dashboard/dashboard-workspace.test.tsx` + `components/events/events-workspace.test.tsx`：`10` 项通过
- `components/strategy/strategy-workspace.test.tsx`：`2` 项通过
- `components/operations/operations-workspace.test.tsx` + `components/navigation/app-shell.test.tsx`：`2` 项通过
- `components/dashboard/dashboard-workspace.test.tsx` + `components/operations/operations-workspace.test.tsx` + `components/navigation/app-shell.test.tsx`：`3` 项通过
- `npm --workspace apps/web run test`：`19` 个文件、`44` 项通过
- `apps/api/tests/test_operations_api.py`：`1` 项通过
- `apps/api/tests/test_operations_api.py` + `apps/api/tests/test_dashboard_api.py`：`2` 项通过
- `components/topology/topology-workspace.test.tsx`：`9` 项通过
- `components/war-room/war-room-workspace.test.tsx`：`5` 项通过
- `apps/api/tests`：`43` 项通过
- `apps/api/tests/test_collector_api.py` + `apps/api/tests/test_dashboard_api.py`：`2` 项通过
- `apps/api/tests/test_dashboard_api.py`：`1` 项通过
- `apps/api/tests/test_simulation_api.py`：`5` 项通过
- `apps/api/tests/test_event_api.py`：`1` 项通过
- `apps/api/tests/test_intent_parser.py`：`8` 项通过
- `syslog_collector/tests`：`12` 项通过
- `syslog_collector/tests/test_server.py`：`7` 项通过
- `npm --workspace apps/web run build`：通过，当前静态路由已包含 `/`、`/business`、`/operations`、`/strategy`、`/simulation`

### 4.1 Web 测试

命令：

```bash
npm --workspace apps/web run test
```

当前结果：

- `components/navigation/app-shell.test.tsx` 通过
- `components/forms/template-center.test.tsx` 通过
- `components/forms/template-center.test.tsx` 已覆盖最近流向与最近变更
- `components/forms/asset-form.test.tsx` 通过
- `components/forms/exposure-form.test.tsx` 通过
- `components/forms/account-form.test.tsx` 通过
- `components/forms/flow-form.test.tsx` 通过
- `components/forms/device-form.test.tsx` 通过
- `components/forms/control-point-form.test.tsx` 通过
- `components/topology/topology-canvas.test.tsx` 通过
- `components/topology/topology-workspace.test.tsx` 通过
- `components/topology/topology-workspace.test.tsx` 已覆盖 `445` 推演面板展示
- `components/topology/topology-workspace.test.tsx` 已覆盖风险筛选与边详情联动
- `components/war-room/war-room-workspace.test.tsx` 通过
- `components/war-room/war-room-workspace.test.tsx` 已覆盖处置动作执行与回执展示
- `components/war-room/war-room-workspace.test.tsx` 已覆盖护网页面对拓扑/事件的证据跳转
- `components/war-room/war-room-workspace.test.tsx` 已覆盖直接消费 replay evidence 中的定位引用
- `components/events/events-workspace.test.tsx` 通过
- `components/events/events-workspace.test.tsx` 已覆盖实时事件流优先展示
- `components/events/events-workspace.test.tsx` 已覆盖到拓扑中心的定位链接
- `components/events/events-workspace.test.tsx` 已覆盖高优先事件到流向视角的直达链接
- `components/events/events-workspace.test.tsx` 已覆盖事件页附带显式目标参数的跳转链接
- `components/events/events-workspace.test.tsx` 已覆盖来自拓扑详情回跳后的事件证据筛选与“定位命中”高亮
- `components/events/events-workspace.test.tsx` 已覆盖事件页对 `targetNodeId / targetEdgeId` 的透传
- `components/topology/topology-workspace.test.tsx` 已覆盖基于 URL 参数的自动定位
- `components/topology/topology-workspace.test.tsx` 已覆盖基于 `flow-view + search` 的事件直达落点
- `components/topology/topology-workspace.test.tsx` 已覆盖跳转后详情面板的自动聚焦
- `components/topology/topology-workspace.test.tsx` 已覆盖跳转后节点“定位命中”高亮
- `components/topology/topology-workspace.test.tsx` 已覆盖关键流向列表“关联命中”高亮
- `components/topology/topology-workspace.test.tsx` 已覆盖详情面板“查看相关事件”回跳链接
- `components/topology/topology-workspace.test.tsx` 已覆盖 `targetNodeId / targetEdgeId` 的精确定位优先级
- 当前合计 `12` 个测试文件、`32` 项测试通过

### 4.1.1 Web 构建

命令：

```bash
npm --workspace apps/web run build
```

当前结果：

- `Next.js` 生产构建通过
- `/compliance`、`/topology`、`/events` 与 `/war-room` 页面已可静态构建
- 构建过程中 Next 自动将 `apps/web/tsconfig.json` 的 `jsx` 调整为 `preserve`

### 4.2 Contracts 测试

命令：

```bash
npm --workspace packages/contracts run test
```

当前结果：

- `packages/contracts/src/index.test.ts` 通过

### 4.3 API 测试

命令：

```bash
.venv/bin/pytest apps/api/tests -v
```

当前结果：

- `test_health_endpoint` 通过
- `test_asset_has_security_domain_fk` 通过
- `test_create_asset` 通过
- `test_create_exposure` 通过
- `test_create_account` 通过
- `test_create_flow` 通过
- `test_create_device` 通过
- `test_create_control_point` 通过
- `test_projection_groups_assets_by_domain` 通过
- `test_domain_projection_maps_risk_from_high_value_assets` 通过
- `test_get_domain_topology` 通过
- `test_get_asset_topology` 通过
- `test_get_flow_topology` 通过
- `test_asset_projection_links_assets_with_flow_edges` 通过
- `test_get_smb_replay_returns_structured_result` 通过
- `test_get_smb_replay_includes_normalized_events` 通过
- `test_get_smb_replay_includes_topology_target_refs` 通过
- `test_get_smb_actions_returns_recommended_response_actions` 通过
- `test_execute_smb_action_returns_execution_receipt` 通过
- `test_parse_emergency_445_block_intent` 通过
- `test_orchestration_simulation_returns_replay_and_recommendations` 通过
- `test_ingest_and_list_live_events` 通过
- 当前合计 `31` 项测试通过

### 4.4 sim-core 测试

命令：

```bash
/Users/mr.ma/Documents/demo/.venv/bin/pytest sim_core/tests/test_device_repository.py sim_core/tests/test_traffic_generator.py -v
```

工作目录：

- `services/sim-core`

当前结果：

- `test_load_ngtos_device_seed` 通过
- `test_generate_smb_baseline_flow` 通过
- `test_generate_abnormal_scan_flow` 通过
- `test_baseline_flow_matches_topsec_policy` 通过
- `test_scan_flow_without_matching_rule_is_denied` 通过
- `test_format_topsec_hit_log_from_matched_flow` 通过
- `test_execute_flows_returns_results_and_syslog_messages` 通过
- `test_format_policy_change_log` 通过
- `test_format_ips_alert_log` 通过
- `test_format_antivirus_alert_log` 通过
- `test_simulate_policy_change_returns_change_record_and_log` 通过
- `test_load_ips_device_seed` 通过
- `test_load_antivirus_device_seed` 通过
- `test_replay_window_aggregates_stats_and_security_logs` 通过
- `test_replay_window_marks_denied_baseline_flow_as_false_positive_candidate` 通过
- 上述两项测试已覆盖证据输出层：
  - `impacted_assets`
  - `whitelist_exception_hits`
  - `false_positive_candidates`
  - `ai_summary`

### 4.5 syslog-collector 测试

命令：

```bash
/Users/mr.ma/Documents/demo/.venv/bin/pytest syslog_collector/tests -v
```

工作目录：

- `services/syslog-collector`

当前结果：

- `test_normalize_topsec_hit_log` 通过
- `test_normalize_policy_change_log` 通过
- `test_normalize_ips_alert_log` 通过
- `test_normalize_antivirus_alert_log` 通过
- `test_parse_topsec_hit_log` 通过
- `test_event_dispatcher_fans_out_to_multiple_consumers` 通过
- `test_protocol_normalizes_and_dispatches_event` 通过
- `test_http_event_consumer_posts_event_to_api` 通过
- `test_udp_collector_receives_datagram` 通过
- 当前合计 `9` 项测试通过

---

## 5. 当前环境现实约束

### 5.1 pnpm 不可用

现状：

- 当前机器没有可直接使用的 `pnpm`

处理方式：

- 当前工程先使用 `npm workspaces`

后续建议：

- 如果后续你提供或安装 `pnpm`，可以再统一切换
- 但当前阶段不是阻塞项

### 5.2 系统 Python 受保护

现状：

- 不能直接用系统 `pip` 全局安装依赖

处理方式：

- 已使用 `.venv` 解决

结论：

- 当前不是阻塞项

### 5.3 当前目录 git 状态

现状：

- `/Users/mr.ma/Documents/demo` 当前可识别为 git repo
- 但当前工作树仍以本地未提交改动为主，尚未进入稳定提交节奏

影响：

- 不影响继续编码
- 会影响后续按 worktree / 分支规范切分任务与提交历史整理

后续建议：

- 如果要长期推进，建议尽快整理首批提交，再引入 worktree 流程

### 5.4 Next.js dev/build 缓存注意事项

现状：

- 在 `next dev` 正在运行时执行 `next build`，可能把 `apps/web/.next` 开发态产物污染
- 污染后的现象包括：
  - 页面返回 `500`
  - `Cannot find module './xxx.js'`
  - React Client Manifest 相关报错

已验证的恢复方式：

- 停掉 `next dev`
- 将 `apps/web/.next` 改名隔离
- 重新启动 `next dev`

结论：

- 后续开发时，尽量不要在同一时刻并发运行 `next dev` 与 `next build`

---

## 6. 关键业务规则与产品前提

后续任何新窗口继续时，都必须默认遵守以下前提：

### 6.1 设备厂商前提

- 主要管控对象是天融信设备
- 配置和策略语义要尽量贴近 `NGTOS`

### 6.2 AI 模型前提

- 默认模型能力按 `GPT-5.4` 设计
- AI 是平台内生能力，不是外挂聊天框

### 6.3 平台能力前提

- 平台必须非常聪明
- AI 不能只是自动点按钮，而要先理解、先推演、先发现误杀、再精准执行

### 6.4 护网场景前提

平台必须支持典型护网场景：

- 一台主机被攻陷
- 国家下发黑名单批量阻断
- 445 横向传播阻断
- 办公网越权访问数据库
- 暴露面收敛
- 临战加固

### 6.5 高频场景前提

除了低频应急，还必须覆盖高频日常场景：

- 新员工入职开通
- 员工离职权限回收
- 新业务上线放通
- 临时运维窗口开通
- 日志断流排查
- 配置漂移核查

### 6.6 仿真前提

平台必须支持本机仿真：

- 不依赖真实设备
- 模拟设备管理本质是修改配置、修改路由、下发策略、接收日志
- 模拟设备应能通过 `UDP/514` 发日志
- 模拟环境必须模拟流量，不只是模拟配置

---

## 7. 当前最重要的下一步

按优先级排序，建议后续继续开发时按以下顺序推进。

### 第一优先级：让动态拓扑中心继续做真实工作面能力

应做：

- 风险状态映射
- flow view 的边与命中信息增强
- 节点详情联动到对象原始数据
- 将当前“基于 search 的跳转定位”继续升级为：
  - 基于对象 ID / 流向 ID 的精确定位
  - 节点/流向高亮
  - 事件到流向的更精确直接落点
- 当前高亮已具备最小前台提示，下一步更值得做的是：
  - 基于对象 ID / 流向 ID 的精确高亮
  - 与关键流向列表同步高亮
  - 从详情面板直接跳回事件证据

### 第二优先级：继续扩 AI 编排中心

应做：

- 当前已具备 445 最小意图解析与回放编排入口
- 下一步继续补：
  - 更完整的意图类型
  - 误杀评估解释
  - 白名单优化理由
  - 执行计划与审批态

### 第三优先级：继续扩 collector 与前台工作面的联动深度

应做：

- 当前 `/api/events/ingest` 与 `/api/events/live` 已具备最小闭环
- `HttpEventConsumer` 已可将 collector 标准化事件直接投递到 API
- `/api/collector/heartbeat` 与 `/api/collector/status` 已具备最小闭环
- 首页总驾驶舱与事件工作台都已能显示 collector 在线状态与接入配置
- 策略与设备工作台当前也已展示设备接入覆盖率与 collector 运行态统一视图
- 下一步应继续补：
  - 拓扑层对实时事件的定位与高亮消费
  - 事件中心到拓扑/护网页面的跳转联动
  - collector 多实例与接入覆盖率统计
  - collector 多实例详情与接入异常原因归因

---

## 8. 重要实现建议

### 8.1 先逻辑仿真，不做真实报文转发

MVP 阶段建议：

- 不实现真实高性能数据包转发
- 只做逻辑流量命中计算和结果回写

原因：

- 更快形成闭环
- 足够支撑产品演示和功能开发

### 8.2 统一对象模型优先于界面精美

即使 UI 还在演进，也必须保证：

- 保护对象
- 安全域
- 资产
- 流向
- 控制点
- 设备

这几类对象关系统一，不要各页面各存一份

### 8.3 AI 不能直接越过规则引擎

必须坚持：

- GPT-5.4 做理解、生成、解释、推理
- 真正执行前要经过规则校验、仿真评估、审批链和回滚保护

---

## 9. 新窗口续做时建议的起手动作

如果后续开新窗口继续，建议起手顺序如下：

1. 先读本文件：
   - `docs/architecture/2026-03-23-current-state-and-handoff.md`

2. 再读总设计：
   - `docs/superpowers/specs/2026-03-23-topology-management-platform-design.md`

3. 再读实现计划：
   - `docs/superpowers/plans/2026-03-23-topology-management-platform.md`

4. 然后执行当前验证：

```bash
npm --workspace apps/web run test
npm --workspace packages/contracts run test
.venv/bin/pytest apps/api/tests/test_health.py apps/api/tests/test_models.py apps/api/tests/test_asset_api.py apps/api/tests/test_core_object_apis.py apps/api/tests/test_list_apis.py apps/api/tests/test_topology_projection.py apps/api/tests/test_topology_api.py apps/api/tests/test_simulation_api.py -v
cd services/sim-core && /Users/mr.ma/Documents/demo/.venv/bin/pytest sim_core/tests/test_device_repository.py sim_core/tests/test_traffic_generator.py -v
cd services/syslog-collector && /Users/mr.ma/Documents/demo/.venv/bin/pytest syslog_collector/tests -v
```

5. 验证通过后，从“动态拓扑工作面增强 + AI 编排中心解释链增强”继续推进

---

## 10. 当前建议的下一开发任务

如果紧接着继续编码，最推荐的下一任务是：

### 任务 A：继续扩 AI 编排中心的意图类型和解释链

目标：

- 让自然语言意图不只支持 445 阻断，还能继续覆盖放通、隔离、批量封堵等场景

### 任务 B：继续扩 collector 到 API / 工作面的自动装配

目标：

- 让 syslog 收到的标准化事件默认就进入 API 摄取入口，并能驱动更多前台工作面联动

### 任务 C：继续增强 topology 与 events 的联动

目标：

- 当前已具备从事件中心跳到拓扑资产视角的最小定位链路
- 下一步继续让拓扑节点、流向、事件中心之间形成更精确的跳转、高亮与详情联动

---

## 11. 备注

- 当前所有关键需求已经从聊天中沉淀到文档和代码，不必担心上下文过长导致项目主线丢失
- 后续每推进一段，都应该继续更新本文件
- 这份文件的目标不是优雅，而是让任何一个后续会话都能快速接力
