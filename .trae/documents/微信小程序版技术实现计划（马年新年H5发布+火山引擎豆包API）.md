## 纠偏说明
- 技术实现主端应是微信小程序；我刚才尝试初始化 Web（Next.js）属于跑偏，会停止这条线，后续以小程序工程为中心推进。
- AI 侧不在客户端直连“豆包”，而是通过火山引擎（Volcengine/Ark）相关 API 由后端/云函数代调用，避免泄露 Key，并便于内容安全与限流。

## 目标（MVP）
- 小程序端：选模板→导入照片→自动整合→一键 AI 生成图文→预览→发布。
- 发布产物：一个 H5 相册链接（微信内打开播放）+ 封面海报。
- 兜底：AI 失败回退模板默认文案，仍可发布。

## 技术架构（建议默认）
- **小程序端**：原生小程序（TypeScript + miniprogram）做页面与上传/导入；复杂渲染放到 H5 播放器。
- **后端/云**（优先快落地）：微信云开发 CloudBase（云函数 + 云存储 + 云数据库 + 静态托管）。
- **AI 调用**：云函数调用火山引擎 Doubao/Ark Chat Completions（Bearer API Key 或 AK/SK 签名二选一，按你们现有账号形态落地）。
- **H5 播放器**：静态站点（最轻：纯 HTML/TS；或 React/Vue 任一）托管在 CloudBase 静态托管/CDN；播放器按 album.json 协议渲染。
- **对象存储**：CloudBase 云存储按 albumId 分区保存 album.json / poster / 图片多规格 / 音频。

## 工程拆分（仓库结构）
- apps/mini：微信小程序主工程（页面、导入、发布、作品库）。
- apps/h5-player：H5 播放器（只读渲染与埋点）。
- packages/core（可选先放在 mini 内）：数据模型、PageType 规则、自动整合（分组/去重/挑重点）、文案占位符。

## 数据协议与关键实体
- 定义并固化 album.json v1：themeId、motionPreset、music、pages[pageType/layoutId/assets/text/decorations]。
- 存储目录：/albums/{albumId}/album.json、poster.jpg、images/{thumb|medium|large}/{assetId}.jpg、audio/{trackId}.mp3。

## 小程序端实现步骤（M1→M3）
### M1：模板成册 + 发布链接
1) 页面骨架：首页/模板列表/导入/预览/发布/作品库。
2) 导入：wx.chooseMedia 多选→本地生成缩略图→Asset 列表。
3) 自动整合：按时间聚类/去重/选主图→生成 pages 与 pageType 分布。
4) 发布：上传图片多规格（至少 thumb+medium）→生成 album.json（先用默认文案）→返回 shareUrl 与 posterUrl。
5) H5：播放器可加载 album.json，首屏封面+1页预加载，动效/音乐开关与降级。

### M2：AI 图文（火山引擎豆包 API）
1) 云函数 GenerateAIText：按 PageType 规则拼装 prompt（马年主题约束）→调用 Doubao Chat Completions。
2) 输出校验：长度/敏感/重复/主题一致性→不合格自动重试或回退默认文案。
3) 小程序端交互：文风选择、强度、重试、编辑与撤回。

### M3：播放器体验增强
- 动效模板 T1/T2/T3 参数化；低端机/弱网降级。
- 音乐：默认静音；用户点击后启用；播放状态记忆。
- 海报：后端生成（更稳）或前端合成（二选一）。

## 后端/云函数清单（最小可用）
- CreateDraftAlbum：生成 albumId，初始化草稿记录。
- UploadAssets：接收并落盘多规格图片（可先客户端直传到云存储）。
- GenerateAIText：调用火山引擎 Doubao/Ark；缓存（albumId+pageId+style）。
- PublishAlbum：固化 album.json、生成 shareUrl、生成 posterUrl。
- GetAlbum：H5 拉取 album.json（可 CDN 缓存）。
- SafetyCheck：文案审核/策略降级（可先内置规则，后续接入云审）。

## 鉴权与安全（必须）
- 火山引擎 Key/AKSK 仅放云函数环境变量；客户端不保存任何密钥。
- 上传与访问：发布后的 album.json 可公开读；写操作需小程序登录态。
- 合规：AI 文案审核与敏感词回退；图片审核策略先“抽样+举报”，后续可全量。

## 验收与里程碑对齐
- 3 分钟发布分享闭环；AI 失败不阻断；H5 首屏目标 <2s（常规网络口径）。

## 我接下来会具体做的代码落地（你确认后立即开始）
1) 初始化 apps/mini（微信小程序 TS 工程）+ 基础路由页面。
2) 初始化 apps/h5-player（静态播放器）+ album.json 解析与渲染框架。
3) 建 CloudBase 目录与云函数骨架（含火山引擎 Doubao 调用封装）。
4) 跑通 M1：导入→发布→生成链接→微信内打开播放。
5) 再接 M2：马年主题 Prompt Pack + AI 生成 + 校验/降级。

确认后我会按以上步骤开始写小程序与云函数代码，并以 doc 中的 album.json 协议作为主线实现。