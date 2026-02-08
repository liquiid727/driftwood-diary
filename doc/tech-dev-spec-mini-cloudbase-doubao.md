# 技术开发文档（技术主管版）
# 微信小程序：马年新年主题相册（发布 H5 + 动效/音乐 + CloudBase + 火山引擎 Doubao API（AK/SK 签名））

> 本文档面向研发/设计/测试/运维，目标是把“最终成品的前端展示效果”写成可落地的技术契约，并给出端到端实现方案，避免小程序预览与 H5 播放器效果偏移。
>
> 产品对外话术允许使用「豆包更懂你的创作」，技术实现口径统一为「火山引擎 Doubao API（AK/SK 签名）」。

---

## 0. 纠偏说明（写死）

- 主端是微信小程序：创建/导入/有机整合/AI 生成/微调/发布/分享
- 发布产物是 H5 链接：微信内可打开播放（动效+音乐），并可生成封面海报用于朋友圈二次传播
- AI 调用只允许在 CloudBase 云函数侧进行：严禁在小程序/H5 暴露火山 AK/SK
- “展示效果对齐”优先级最高：小程序内预览默认使用 WebView 打开同一套 H5 播放器进行所见即所得预览

---

## 1. 里程碑、范围与验收（两周可落地）

### 1.1 M1（最小闭环：3 分钟发布分享）
必须做：
- 马年新年主题完整闭环（其他主题占位不投入）
- 小程序：选模板 -> 多选导入 -> 自动填充 -> 预览 -> 发布 -> 分享
- 云端：上传原图 -> 生成多规格 -> 固化 album.json -> 返回 shareUrl/posterUrl
- H5：按 album.json 渲染，首屏可见、可翻页、可开关音乐、至少 1 套动效模板可用

验收：
- 新用户首次从打开到发布并分享 ≤ 3 分钟
- 微信内打开 H5 首屏可见目标 < 2s（常规网络口径）
- 任一环节失败可降级完成发布（无音乐/无动效/默认文案）

### 1.2 M2（AI：让“精美感”显著提升）
必须做：
- 一键生成：封面标题/副标题/祝福、页内段落、图注候选、符号点缀（克制）
- 主题 Prompt Pack + PageType 规则强约束（字数、关键词、禁用词、符号上限）
- AI 失败回退：模板默认文案 + 可发布
- AI 结果可编辑：改字不改结构（避免用户陷入“制作软件”）

验收：
- “只导入照片 + 点一次生成”可直接发布且不违和
- AI 失败自动回退默认文案，链路不中断

### 1.3 M3（播放器体验：动效/音乐/预加载/降级）
必须做：
- 动效模板 3 套：T1/T2/T3（见第 3 章）
- 音乐 5 种风格：M1~M5（默认静音可播放）
- 预加载：封面 + 1-2 页优先，后续边播边预取
- 降级策略：低端机/掉帧/弱网/音频失败均不影响浏览

验收：
- 同一相册在不同机型播放稳定不白屏
- 音频失败不影响浏览；动效失败自动降级为淡入

### 1.4 M4（微调：让用户愿意分享）
必须做：
- 换图：点击槽位 -> 重选图片
- 交换：两槽位交换（裁切参数策略见 4.3）
- 文本编辑：编辑内容 + 基础样式（字号/颜色/对齐/粗细范围）

验收：
- 用户能在 30 秒内修正“这张不想要/顺序不对/字不合适”

---

## 2. 总体架构（CloudBase）

### 2.1 分层边界（强制）
- 小程序：素材采集 + 结构编辑 + 触发发布 + 分享
- 云函数：AI 调用 + 内容安全 + 发布编排 + 资源多规格处理 + 生成 album.json + 海报
- H5 播放器：只负责解释 album.json 并渲染播放（不依赖数据库读写）

### 2.2 CloudBase 组件使用
- 云函数（Node.js 18）：发布编排、资源处理、AI 调用、审核、分享页渲染（含 meta）
- 云存储：图片多规格、album.json、海报、音乐资源
- 云数据库：作品索引、发布任务、AI 缓存、权限（后续）
- 静态托管/云托管：H5 播放器与分享落地页

---

## 3. 前端展示效果契约（防止偏移的核心章节）

> 目标：把“好看”写成可实现的约束。研发只要遵守本章约定，成品视觉不会因为实现细节偏离。

### 3.1 统一画布与适配策略（跨端一致性）
统一约束：
- 设计基准尺寸：390 x 844（9:16 近似，含安全区）
- 所有布局使用相对单位（% 或基准尺寸比例），禁止写死 px（除非是极小的描边/阴影）
- 文本换行必须由“同一套行布局算法”决定（见 3.4）；禁止让不同端各自依赖默认排版引擎自由换行

安全区：
- 顶部安全区：env(safe-area-inset-top) 或小程序系统信息推导
- 底部安全区：env(safe-area-inset-bottom)
- 所有可点击控件不得落入安全区边缘 12px 内

### 3.2 主题 Token（马年新年）
色彩：
- Primary：#C81E1E（年味红，仅用于按钮/标题点缀，避免大面积纯红底）
- Accent：#F5C542（香槟金，用于描边/印章/高光）
- Background：#FFF6E8（米白大留白）
- Text：#1F1A17（暖黑正文）
- Highlight：#EAB308（亮金，仅小面积点亮）

质感（必须实现其一，避免“平面 PPT 风”）：
- 背景层：宣纸纹理（低对比度，opacity 0.06~0.12）
- 卡片层：磨砂噪点（opacity 0.04~0.08）+ 极克制阴影
- 金箔层：角落/印章局部（不得覆盖主体脸部/人物上半身）

### 3.3 页面层级（统一 Z 轴，避免“遮挡主体”）
所有页面的渲染层级（由低到高）：
1) Background：纯色/渐变/纹理
2) Ambient：低密度氛围层（暖光、极淡颗粒）
3) PhotoLayer：照片区域（Region），照片永远优先于贴纸
4) FrameLayer：相框/春联边框/窗花镂空（允许遮边，不允许遮脸）
5) TextLayer：标题/段落/图注
6) StickerLayer：福字角标/印章/灯笼/烟花角光点（低密度）
7) UIOverlay：音频按钮/进度/返回等交互控件

硬约束：
- 任意 Decoration 若与人脸区域重叠面积 > 12%（近似判断）必须自动缩小或移位（MVP 可先用“中心安全矩形”近似替代人脸）
- StickerLayer 密度上限：每页最多 2 个主题贴纸 + 1 个角标类（角标算半个）

### 3.4 文本排版契约（避免不同端换行导致错位）
统一策略：
- 文本排版不依赖浏览器/小程序默认换行，必须使用“可控的行布局算法”：
  - 给定：容器宽度、字体族、字号、字重、letterSpacing、lineHeight、最大行数
  - 输出：按字符切分的行数组（严格一致）
- H5 与小程序预览必须使用同一套排版实现（建议：H5 侧实现，预览用 WebView）

马年主题默认排版约束：
- 封面标题：8-14 字，最多 2 行；行高 1.12~1.18
- 副标题：12-20 字，最多 2 行；行高 1.3~1.45
- 页内段落：18-60 字，最多 3 行；行高 1.45~1.65
- 图注：8-16 字，最多 1 行（可截断）
- 禁止出现连续 3 个以上英文/数字导致破版（必要时自动插入软换行）

### 3.5 动效契约（T1/T2/T3，可直接给前端实现）
通用约束：
- 页内动效时长：450-650ms；封面入场：900-1200ms
- 动效只允许 transform / opacity / clip-path（慎用）；禁止重滤镜、重粒子满屏
- “低性能降级”触发：掉帧或内存压力 -> 只保留淡入（opacity）与轻微位移（translateY <= 8）

T1「金粉入场」（氛围但克制）：
- 主图：opacity 0->1 + scale 1.02->1.00（700ms，easeOutCubic）
- 文字：延迟 120ms，translateY 6->0（420ms，easeOutCubic）
- 金粉粒子（可选实现）：仅封面启用，密度 12-18 个/屏，持续 2.8-4.5s，粒子尺寸 1-3px，alpha 0.15-0.35
- 降级：关闭粒子，仅保留主图与文字的淡入/轻推近

T2「纸张翻页」（像一本年册）：
- 翻页过渡：380-520ms（easeInOutCubic）
- 高光扫过：宽度 18-26% 屏宽，alpha 0.06-0.12，仅 1 次
- 阴影：页面边缘投影强度 <= 0.12，不得黑边
- 降级：左右滑动淡入（opacity 0->1 + translateX 12->0）

T3「烟花点亮」（角落点亮，不喧宾夺主）：
- 进入页：先暗 120ms -> 亮起 300ms -> 稳定 200ms（总 620ms）
- 光点：只允许在角落 20% 区域内出现，单次 6-12 个点
- 微光脉冲：1 次（scale 1.0->1.04->1.0，600ms）
- 降级：背景亮度渐变 + 文字淡入

### 3.6 音乐契约（微信 WebView 限制）
规则：
- 默认静音可播放：defaultMuted=true
- 首次解锁播放必须由用户点击触发（按钮文案建议：开启年味音乐）
- 音频失败不影响浏览：失败提示轻量，不弹阻断弹窗

推荐风格（M1~M5）：
- M1 国风轻鼓点
- M2 温暖弦乐与钢琴
- M3 新年 Lo-fi
- M4 传统器乐轻编
- M5 喜庆但克制

### 3.7 LayoutId 图谱（“做出来像什么”写死）
统一说明：
- 坐标系：以基准画布 390x844 为参考，全部用百分比表达（x/y/w/h 均为 0~1）
- Region 基本属性：id、order、role（hero/normal）、rect、cornerRadius
- rect 以页面左上角为原点；cornerRadius 用相对值（建议用 w 的比例）

封面 Cover（3 套）：
- cover-A「春联灯笼·团圆封面」
  - Region.hero（order=1）：
    - rect：{ x: 0.07, y: 0.18, w: 0.86, h: 0.52 }，cornerRadius：0.06
    - 视觉：磨砂玻璃卡（opacity 0.06~0.10）+ 极细金边（<=1.5px 等效）
  - TextBlock.title：
    - rect：{ x: 0.10, y: 0.72, w: 0.80, h: 0.12 }，对齐：居中
  - Decoration：
    - frame.coupletTop：贴顶，高度 8~12%
    - frame.coupletBottom：贴底，高度 8~12%（可选）
    - badge.fuCorner：右上角，rect：{ x: 0.86, y: 0.14, w: 0.10, h: 0.10 }
- cover-B「金箔印章·轻奢封面」
  - Region.hero（order=1）：
    - rect：{ x: 0.05, y: 0.14, w: 0.90, h: 0.58 }，cornerRadius：0.04
  - TextBlock：
    - title：{ x: 0.08, y: 0.74, w: 0.84, h: 0.10 }
    - blessing：{ x: 0.08, y: 0.83, w: 0.84, h: 0.10 }
  - Decoration：
    - stamp.horseSeal：角落点缀，rect：{ x: 0.72, y: 0.60, w: 0.18, h: 0.18 }，不得遮挡主体脸部/上半身
- cover-C「窗花拼贴·年味相册封面」
  - Region.main（order=1, hero）：
    - rect：{ x: 0.10, y: 0.22, w: 0.80, h: 0.46 }，cornerRadius：0.04
  - Region.sub1（order=2, normal）：
    - rect：{ x: 0.08, y: 0.12, w: 0.34, h: 0.22 }，cornerRadius：0.04
  - Region.sub2（order=3, normal）：
    - rect：{ x: 0.58, y: 0.10, w: 0.34, h: 0.22 }，cornerRadius：0.04
  - TextBlock：
    - title：{ x: 0.10, y: 0.72, w: 0.80, h: 0.08 }
    - catalog：{ x: 0.10, y: 0.80, w: 0.80, h: 0.12 }（“年夜饭 / 拜年 / 合影”）
  - Decoration：
    - mask.windowCutout：仅允许遮挡照片边缘 <= 8%（避免遮主体）

叙事页（MVP 必备 LayoutId）：
- group-hero（合影主视觉）
  - Region.hero（order=1）：{ x: 0.08, y: 0.14, w: 0.84, h: 0.56 }
  - Region.sub（order=2）：{ x: 0.10, y: 0.74, w: 0.38, h: 0.18 }
  - Region.sub（order=3）：{ x: 0.52, y: 0.74, w: 0.38, h: 0.18 }
  - TextBlock.paragraph：可浮在 hero 下沿内侧，最大 2 行（避免压脸）
- grid-9（年夜饭九宫格，谨慎使用）
  - 3x3 等分，gap=0.018（相对宽度），外边距 0.08
  - 全册最多 2 页
- blank-quote（祝福/拜年）
  - Region.photo（order=1）：{ x: 0.10, y: 0.16, w: 0.80, h: 0.46 }
  - TextBlock.greeting：{ x: 0.12, y: 0.66, w: 0.76, h: 0.22 }（1~2 段）
  - Decoration.spark/firework 只允许角落 20% 区域
- blank-text（留白旁白）
  - TextBlock.title：{ x: 0.10, y: 0.18, w: 0.80, h: 0.10 }
  - TextBlock.paragraph：{ x: 0.10, y: 0.30, w: 0.80, h: 0.46 }
  - Region.photo（可选，order=1）：{ x: 0.10, y: 0.78, w: 0.80, h: 0.16 }

### 3.8 主题装饰库契约（贴纸/框/印章）
统一规则：
- 每个装饰资源必须有：id、类型（frame/badge/stamp/sticker/mask/texture）、推荐尺寸、锚点（anchorX/anchorY）、可用区域约束
- 所有装饰默认不参与点击命中（避免误触），仅编辑模式可选中

马年主题默认装饰 ID（MVP 必备）：
- frame.coupletTop / frame.coupletBottom / frame.coupletLeft / frame.coupletRight
- badge.fuCorner（方/圆两套可同 id 下以 variant 区分）
- stamp.horseSeal（3 套文案变体：马年/新春/团圆）
- mask.windowCutout（3 种窗花）
- sticker.lantern / sticker.cloud / sticker.fireworkCorner / sticker.horseTrail

### 3.9 海报与分享卡片契约（影响传播效果）
必须实现：
- poster.jpg：封面主图 + 标题 + 引导语 + 二维码（或“长按识别/打开链接”提示）
- share meta（微信抓取）：
  - title：使用 album.title
  - description：使用封面祝福或副标题（限制 20-32 字）
  - image：使用封面图或 cover.jpg（不超过 300KB 更稳）

---

## 4. 模板驱动的数据模型（创建端与播放器的共同语言）

### 4.1 核心层级
- Room：一本相册
- Page：一页
- Layout：一页的照片槽位集合（Region）
- Region：一个照片槽位（支持不规则），带 order 与 role（hero/normal）
- Decoration：装饰（文本/贴纸/形状），带占位符与自动绑定能力

层级：
- Room -> Pages -> Layout -> Regions + Decorations

### 4.2 自动填充（Region.order 与 role）
排序优先级：
1) capturedAt（可靠则用）
2) 文件名排序
3) 用户手动拖拽排序

填充策略：
- 先填 role=hero 的主图位（尽量每章/每册只有 1-2 个 hero）
- 再按 Region.order 顺序填充
- 不足时：留空并提示“还差 N 张”，可追加导入

### 4.3 微调行为契约（换图/交换/裁切）
换图：
- 替换 Region.assetId，不修改 Region 的布局与 zIndex

交换：
- 交换两种策略（默认用 A，B 作为增强）：
  - A：交换 assetId，同时保留各自 pan/zoom/rotate（更稳定，不易破版）
  - B：交换整个 CellState（更符合“我想把这张完整挪过去”的直觉，但更易破版）

裁切：
- fitMode 默认 cover
- pan/zoom 的默认值由“居中 + 最小覆盖”算出，避免首次出现黑边

---

## 5. “照片有机整合”（把 80-200 张压成 8-12 页）

> 本能力决定“女性用户是否觉得省心好看”，必须在 MVP 就有明确规则与可解释性。

### 5.1 输入与输出
输入：
- photos[]：包含 localPath、width、height、size、capturedAt（可空）
- 目标页数：8-12（随模板/照片量动态调整）

输出：
- chapters[]：3-8 个章节
- heroPick：每章 1 张主图
- pagePlan[]：pageType 序列 + 每页照片数量预算 + 装饰建议

### 5.2 MVP 规则（不依赖复杂识别）
章节聚类：
- 若 capturedAt 可用：按时间间隔聚类（阈值建议 2-6 小时动态）
- 否则：按导入顺序等分成 3-6 组

挑主图（每组 1 张）：
- 评分近似：分辨率更高 + 曝光更正常（可用简单亮度方差估计）+ 非过度模糊（简单 Laplacian 近似，MVP 可先跳过）
- 兜底：取分辨率最大且非截图（文件名/比例近似）的一张

控密度（核心）：
- 目标页数 8-12：照片越多 -> 每页图更多，但必须保留留白页
- 节奏模板：主图页 -> 细节页 -> 合影页 -> 留白文案页 循环
- 九宫格页上限：全册最多 2 页（否则“像朋友圈截图合集”）

去重：
- MVP：连拍去重（capturedAt 间隔 < 2s 视为候选）+ 分辨率/大小更优保留
- 后续可加：感知 hash 相似度去重

---

## 6. AI（火山引擎 Doubao API：AK/SK 签名）

### 6.1 仅云函数调用（安全红线）
- 火山 AK/SK 写入 CloudBase 环境变量
- 云函数向火山发起请求并做输出校验与审核
- 小程序/H5 只拿结果（文本与符号），不得直连火山

### 6.2 输入与输出（强结构，避免 AI 漫谈）
输入（最小集合）：
- themeId/templateId
- pages[]：pageType、layoutId、每页照片摘要（数量/横竖/可选时间）
- 可选：year/location/members（家庭称呼）
- 风格控制：tone（温暖/幽默/克制/文艺），strength（少量点缀/明显氛围）

输出（必须可直接写入 album.json）：
- cover：title/subtitle/blessing
- pages[]：paragraph/captions/tags/greeting/symbols（按 pageType 不同字段可为空）

### 6.3 马年主题 Prompt Pack（硬约束）
通用：
- 语气：温暖、精致、克制，不用土味口号/夸张营销词/PUA 语气
- 标点：感叹号最多 1 个/页；优先中文标点
- 符号：每页 0-2 个，避免刷屏
- 意象池（按页分布，不要每页重复）：灯笼/窗花/春联/烟花/金粉/祥云/马蹄或奔跑

PageType 规则（摘要）：
- cover：标题 8-14 字（<=2 行）；副标题 12-20 字；祝福 12-24 字
- groupPhoto：段落 20-45 字；图注 8-16 字（<=2）
- dinner：段落 18-40 字；可选 3-6 个“细节点词”
- greeting：祝福主句 12-22 字；可选补一句 12-22 字；避免每页重复“新年快乐”
- blank：文案 24-60 字（<=2 段），更像纪念册旁白

### 6.4 输出校验、重试与降级
- 校验：长度、重复度、禁用词、符号上限、是否贴合 pageType
- 不通过：自动重试 1-2 次（保留结构，调整风格/更短）
- 仍失败：回退模板默认文案（流程不断）

### 6.5 AI 缓存（控成本控延迟）
- key = hash(themeId + templateId + pageType + imageSummary + tone + strength)
- 命中直接复用
- 过期：默认 30 天（可调）

### 6.6 AK/SK 签名调用实现口径（云函数内）
强约束：
- 所有签名逻辑仅存在于云函数
- host/region/service 作为配置项写在环境变量（不同火山产品可能不同）

签名流程（抽象口径，按火山控制台文档落到具体值）：
1) 准备请求：
   - method：POST
   - canonicalUri：API path（如 /api/v3/chat/completions）
   - query：空或按字典序排序
   - headers（至少）：host、content-type、x-date、x-content-sha256
   - body：JSON 字符串（必须参与 sha256）
2) 计算 x-content-sha256：
   - sha256Hex(body)
3) 构造 CanonicalRequest：
   - method + "\n"
   - canonicalUri + "\n"
   - canonicalQueryString + "\n"
   - canonicalHeaders（lowercase，按 key 排序，key:value\n） + "\n"
   - signedHeaders（以 ; 连接） + "\n"
   - x-content-sha256
4) 构造 StringToSign：
   - algorithm + "\n"
   - x-date + "\n"
   - credentialScope（date/region/service/request） + "\n"
   - sha256Hex(CanonicalRequest)
5) 计算 Signature：
   - kDate = HMAC("HMAC-SHA256", secretKey, date)
   - kRegion = HMAC(kDate, region)
   - kService = HMAC(kRegion, service)
   - kSigning = HMAC(kService, "request")
   - signature = HMAC_HEX(kSigning, StringToSign)
6) 组装 Authorization：
   - Authorization: HMAC-SHA256 Credential={accessKey}/{credentialScope}, SignedHeaders={signedHeaders}, Signature={signature}

超时与重试：
- 单次请求超时：8-12s
- 仅对可重试错误重试 1-2 次（网络/限流）；其余直接降级默认文案

### 6.7 AI 请求体“稳定化”规则（避免同图同模板输出漂移）
- 输入固定字段顺序（序列化稳定）
- 图片摘要使用稳定格式（例如：{count, orientations, capturedAtBuckets}）
- tone/strength 必须显式传入（不依赖模型自行猜）

---

## 7. 发布与分享（CloudBase）

### 7.1 云存储目录结构（统一）
/albums/{albumId}/
  album.json
  poster.jpg
  images/
    original/{assetId}.jpg
    large/{assetId}.jpg
    medium/{assetId}.jpg
    thumb/{assetId}.jpg
  audio/
    {trackId}.mp3

### 7.2 云函数清单（MVP）
- createPublishJob：创建发布任务
- finalizeUpload：通知上传完成（可选）
- processAssets：生成多规格（thumb/medium/large），可 WebP 优先
- generateAiText：调用火山 Doubao，输出校验、缓存、审核
- buildAlbumJson：固化 album.json 到云存储并写索引到数据库
- generatePoster：生成 poster.jpg（含标题 + 二维码/引导）
- getAlbumJson：H5 拉取（可直读云存储，也可透传加缓存头）
- renderSharePage：返回带 meta 的 HTML（解决微信分享卡片抓取不执行 JS 的问题）

### 7.3 shareUrl 设计（防止微信抓取失败）
必须：
- shareUrl 指向“服务端渲染的分享落地页”，HTML 必须包含：
  - og:title / og:description / og:image
  - 微信抓取需要的 meta（由分享页直出，不依赖前端 JS）
- 分享落地页再加载 H5 播放器并开始播放

---

## 8. 内容安全与隐私（红线）

文案：
- AI 输出必须审核，不通过直接回退默认文案

图片：
- MVP：发布前可先做抽样+举报（若你们要强风控，可改为发布前全量审核）

隐私：
- 明确告知：压缩图用于 AI 理解；支持关闭 AI（纯模板）
- 日志与埋点不得记录原图直链到可公开位置

---

## 9. H5 播放器实现细则（避免“实现出来像另一个产品”）

### 9.1 渲染来源唯一：album.json
- 播放器不读取数据库，不做“智能补全”，避免不同版本渲染差异
- 版本兼容：album.json 必带 version，播放器按版本做兼容

### 9.2 首屏策略（性能预算）
- 首屏只保证：封面图 large 或 medium + 关键纹理 + 标题文本
- 1-2 页预取：优先 thumb，进入该页再替换 large
- 骨架屏：封面先骨架，避免白屏

### 9.3 动效实现建议（落地口径）
- 优先 CSS Keyframes + transform/opacity
- 粒子（T1/T3）可用 Canvas 轻量实现，并且必须可关闭（降级开关）

### 9.4 音频实现建议（微信内）
- 默认静音（或不创建 AudioContext）
- 用户点击后：
  - 解锁 audio
  - 显示“音乐已开启”的轻提示，不弹窗
- 若加载失败：保持静音并隐藏播放状态，不阻断浏览

### 9.5 渲染映射表（pageType + layoutId -> 展示效果）
原则：
- pageType 决定“文案字段与默认动效/装饰”
- layoutId 决定“照片槽位与文本块位置”（见 3.7）

映射（MVP 必做）：
- cover + cover-A/cover-B/cover-C
  - 文案字段：text.title / text.subtitle / text.blessing
  - 默认动效：T1
  - 默认装饰：frame.coupletTop + badge.fuCorner（A）、stamp.horseSeal（B）、mask.windowCutout（C）
- groupPhoto + group-hero
  - 文案字段：text.paragraph + text.captions（<=2）
  - 默认动效：T1 或 T2（模板可选）
  - 装饰：stamp.horseSeal（低密度）
- dinner + grid-9
  - 文案字段：text.paragraph + text.tags（可选）
  - 默认动效：T2
  - 装饰：尽量不加，避免脏
- greeting + blank-quote
  - 文案字段：text.greeting + text.caption（可选）
  - 默认动效：T3
  - 装饰：sticker.fireworkCorner（角落）
- blank + blank-text
  - 文案字段：text.title（可选）+ text.paragraph
  - 默认动效：T1（无粒子）或 T2
  - 装饰：最多 1 个（如 sticker.cloud 或 stamp.horseSeal）

### 9.6 渐进式图片加载（稳定与清晰兼得）
加载策略：
- 首屏：优先加载 cover 的 medium/large（网络差时先 thumb 占位）
- 非首屏：先 thumb，再在页面进入视口时换 medium/large
- 替换策略：同一 Region 从 thumb 替换到 large 时保持同一裁切参数（pan/zoom/rotate 不变）

失败策略：
- large 失败：回退 medium
- medium 失败：保持 thumb + 显示轻量重试按钮（不阻断）

### 9.7 性能预算与埋点（必须）
性能预算（目标）：
- 首屏：HTML + CSS + JS（gz）<= 250KB（能做到越小越好）
- 首屏图片：<= 300KB（cover 优先）
- 预加载并发：<= 3（弱网降到 1）

核心埋点：
- h5_open / h5_first_paint / h5_cover_ready
- h5_page_view（pageId）/ h5_complete
- h5_music_enable / h5_music_error
- h5_share_click（如有）

---

## 10. 风险与关键取舍（工程上提前写死）

跨端一致性（高风险）：
- 小程序原生渲染与 H5 渲染会在字体行高、字间距、裁切上产生像素差异
- 解决策略：小程序内预览默认使用 WebView 打开同一套 H5 播放器渲染，避免“预览好看，发布变样”

音乐自动播放限制：
- 微信 WebView 禁止带声音自动播放
- 解决策略：默认静音 + 强交互引导按钮解锁播放

AI 延迟焦虑：
- 解决策略：乐观 UI（先默认文案填充），AI 结果回写替换，提供“AI 正在优化…”状态

CDN 流量成本：
- 解决策略：多规格 + WebP + 渐进式加载；大图仅在需要时加载

---

## 11. 马年主题资源包（文件级契约，可直接交付美术与前端）

> 目标：资源“拿来就能用”，并且能从文件名/目录结构直接反推它在播放器里的用途与约束，减少返工与视觉偏移。

### 11.1 资源包根目录与命名规则（写死）
资源包根目录（建议）：
- /theme-packs/horse-newyear/v1/
  - manifest.json（资源清单与校验信息）
  - preview/（用于模板列表与投放素材的预览图）
  - textures/（纹理）
  - frames/（边框/相框/春联）
  - badges/（角标，如福字）
  - stamps/（印章）
  - masks/（窗花镂空等遮罩）
  - stickers/（灯笼、祥云等装饰）
  - motion/（动效配置或 lottie）
  - music/（音频）
  - fonts/（字体授权与 webfont）

文件命名（统一）：
- {category}-{name}.{variant}.v{major}.{ext}
  - category：frame/badge/stamp/mask/sticker/texture/motion/music/font/preview
  - name：英文小写 + kebab-case
  - variant：a/b/c 或 light/dark 或 01/02/03
  - ext：svg/png/webp/jpg/json/mp3/woff2/ttf

资源 ID 与文件名映射规则（播放器与编辑器共用）：
- 资源 ID 使用点分层：{category}.{name}
  - 例：frame.coupletTop、badge.fuCorner、stamp.horseSeal、mask.windowCutout、sticker.lantern
- variant 不拼进资源 ID：由 manifest 的 (id, variant) 唯一确定具体文件
- 播放器只认 manifest，不做“猜文件名”。

### 11.2 manifest.json（资源清单结构）
最小字段（必须）：
- version：资源包版本（例：1.0.0）
- themeId：horseNewYear
- updatedAt：时间戳
- assets[]：
  - id：资源 ID（例：frame.coupletTop）
  - variant：资源变体（例：a/b/c；无变体则填 a）
  - file：相对路径（例：frames/frame-couplet-top.a.v1.svg）
  - type：frame/badge/stamp/mask/sticker/texture/motion/music/font/preview
  - format：svg/png/webp/jpg/json/mp3/woff2/ttf
  - size：{ w, h }（像素或逻辑尺寸，见 11.3/11.4）
  - safeArea：{ top, right, bottom, left }（0~1，相对遮挡安全区）
  - tintable：boolean（是否允许主题色染色）
  - checksum：sha256（用于发布与 CDN 缓存一致性）
唯一性（写死）：
- assets 的唯一键为 (id, variant)

### 11.3 矢量与位图交付规范（SVG/PNG/WebP）
SVG（用于 H5，必须）：
- viewBox 必须存在；坐标系从 (0,0) 开始
- 禁止外部引用（image/link），必须自包含
- 所有 stroke 必须转为 outline（避免不同渲染器笔触差异）
- 透明背景；尽量避免 filter（尤其是 blur/feGaussianBlur），避免微信内性能风险
- 色彩：
  - 金色建议用渐变，但必须提供“纯色降级版”（不使用渐变）
  - 允许使用 currentColor 的资源需标记 tintable=true

PNG/WebP（用于小程序与海报，必须二选一，默认 WebP 优先）：
- 贴纸/角标：建议 1024px 以内的正方形画板，透明背景
- 边框/相框：按 9:16 画布导出（建议 1080x1920），透明背景
- 纹理：至少 1024x1024（可平铺），透明或浅底
- 压缩要求：单文件 <= 200KB（纹理可放宽到 350KB）

### 11.4 音频交付规范（music）
交付格式（必须）：
- mp3：44.1kHz，CBR 160kbps 或 VBR（质量 >= 4）
- 时长：45s~90s（可循环），必须提供 loopStart/loopEnd（秒）
- 峰值：-1.0dBFS；响度建议 -16 ~ -14 LUFS（避免刺耳）
- 版权：必须可商用，附带授权证明文件名（见 11.8）

播放器约束（写死）：
- 默认静音；用户点击后解锁播放（见 3.6/9.4）
- 音频文件需可按需加载，不允许首屏强制拉取全部曲库

### 11.5 动效资源交付规范（motion）
两种落地方式二选一（manifest 中注明）：
- A：纯参数动效（推荐，最稳）
  - 文件：motion/motion-presets.v1.json
  - 内容：T1/T2/T3 的时长、easing、粒子开关与密度参数（与 3.5 对齐）
- B：Lottie（仅用于氛围层，不覆盖主体）
  - 文件：motion/motion-t1-gold-dust.a.v1.json 等
  - 约束：单文件 <= 120KB；禁止引入大位图；层级不得盖住 PhotoLayer 主体

### 11.6 预览图与模板卡片（preview）
用于：
- 小程序模板列表卡片
- 模板详情整册缩略图
- 运营投放 KV 复用

规格（写死）：
- card：preview/preview-card.{variant}.v1.jpg
  - 竖版 3:4：900x1200，<= 120KB
- cover：preview/preview-cover.{variant}.v1.jpg
  - 9:16：1080x1920，<= 220KB
- pages（可选）：preview/preview-pages.{variant}.v1.jpg
  - 横向拼图：1600x900，<= 260KB

### 11.7 文件级清单（MVP 必备）
贴纸/框/印章/遮罩（SVG 为主，必要时补 PNG/WebP）：
| 资源 ID | variant | 目录/文件 | 格式 | 建议画板/像素 | safeArea（0~1） | 备注 |
|---|---|---|---|---:|---|---|
| frame.coupletTop | a | frames/frame-couplet-top.a.v1.svg | svg | 1080x240 | {top:0,right:0,bottom:0,left:0} | 贴顶春联边框 |
| frame.coupletBottom | a | frames/frame-couplet-bottom.a.v1.svg | svg | 1080x240 | {top:0,right:0,bottom:0,left:0} | 贴底春联边框（可选） |
| frame.coupletLeft | a | frames/frame-couplet-left.a.v1.svg | svg | 120x1920 | {top:0,right:0,bottom:0,left:0} | 侧边春联（可选） |
| frame.coupletRight | a | frames/frame-couplet-right.a.v1.svg | svg | 120x1920 | {top:0,right:0,bottom:0,left:0} | 侧边春联（可选） |
| badge.fuCorner | a | badges/badge-fu-corner.a.v1.svg | svg | 256x256 | {top:0.2,right:0.2,bottom:0,left:0} | 角标（方形） |
| badge.fuCorner | b | badges/badge-fu-corner.b.v1.svg | svg | 256x256 | {top:0.2,right:0.2,bottom:0,left:0} | 角标（圆形） |
| stamp.horseSeal | a | stamps/stamp-horse-seal.a.v1.svg | svg | 512x512 | {top:0.15,right:0.15,bottom:0.15,left:0.15} | 变体：马年 |
| stamp.horseSeal | b | stamps/stamp-horse-seal.b.v1.svg | svg | 512x512 | {top:0.15,right:0.15,bottom:0.15,left:0.15} | 变体：新春 |
| stamp.horseSeal | c | stamps/stamp-horse-seal.c.v1.svg | svg | 512x512 | {top:0.15,right:0.15,bottom:0.15,left:0.15} | 变体：团圆 |
| mask.windowCutout | a | masks/mask-window-cutout.a.v1.svg | svg | 1080x1920 | {top:0.08,right:0.08,bottom:0.08,left:0.08} | 窗花 01，仅遮边 <= 8% |
| mask.windowCutout | b | masks/mask-window-cutout.b.v1.svg | svg | 1080x1920 | {top:0.08,right:0.08,bottom:0.08,left:0.08} | 窗花 02，仅遮边 <= 8% |
| mask.windowCutout | c | masks/mask-window-cutout.c.v1.svg | svg | 1080x1920 | {top:0.08,right:0.08,bottom:0.08,left:0.08} | 窗花 03，仅遮边 <= 8% |
| sticker.lantern | a | stickers/sticker-lantern.a.v1.svg | svg | 512x512 | {top:0.12,right:0.12,bottom:0.12,left:0.12} | 灯笼，低密度 |
| sticker.cloud | a | stickers/sticker-cloud.a.v1.svg | svg | 512x512 | {top:0.12,right:0.12,bottom:0.12,left:0.12} | 祥云 |
| sticker.fireworkCorner | a | stickers/sticker-firework-corner.a.v1.svg | svg | 512x512 | {top:0.2,right:0.2,bottom:0,left:0} | 仅角落区域 |
| sticker.horseTrail | a | stickers/sticker-horse-trail.a.v1.svg | svg | 768x256 | {top:0.2,right:0.2,bottom:0.2,left:0.2} | 奔跑线条/马蹄印 |

纹理（textures）：
| 资源 ID | 目录/文件 | 格式 | 像素 | 平铺 | 备注 |
|---|---|---|---:|---|---|
| texture.xuanPaper | textures/texture-xuan-paper.a.v1.webp | webp | 1024x1024 | 是 | 宣纸纹理，opacity 0.06~0.12 |
| texture.goldFoil | textures/texture-gold-foil.a.v1.webp | webp | 1024x1024 | 是 | 金箔局部，可用于印章/高光 |
| texture.frostNoise | textures/texture-frost-noise.a.v1.webp | webp | 1024x1024 | 是 | 磨砂噪点，opacity 0.04~0.08 |
| texture.warmGlow | textures/texture-warm-glow.a.v1.webp | webp | 1024x1024 | 是 | 暖光渐变，谨慎使用 |

音乐（music）：
| trackId | 目录/文件 | 风格 | 时长 | loopStart~loopEnd | 备注 |
|---|---|---|---:|---|---|
| M1 | music/music-guofeng-drum.a.v1.mp3 | 国风轻鼓点 | 60s | 2.0~58.0 | 热闹合影/欢聚 |
| M2 | music/music-warm-strings.a.v1.mp3 | 温暖弦乐钢琴 | 60s | 1.5~58.5 | 团圆/留白文案 |
| M3 | music/music-newyear-lofi.a.v1.mp3 | 新年 Lo-fi | 60s | 2.0~58.0 | 拼贴/碎片 |
| M4 | music/music-traditional-lite.a.v1.mp3 | 传统器乐轻编 | 60s | 2.0~58.0 | 拜年/仪式感 |
| M5 | music/music-festive-subtle.a.v1.mp3 | 喜庆但克制 | 60s | 2.0~58.0 | 封面/结尾页 |

动效（motion）：
| presetId | 目录/文件 | 方式 | 备注 |
|---|---|---|---|
| T1 | motion/motion-presets.v1.json | 参数 | 金粉入场（可关闭粒子） |
| T2 | motion/motion-presets.v1.json | 参数 | 纸张翻页（含高光一次） |
| T3 | motion/motion-presets.v1.json | 参数 | 烟花点亮（角落 20%） |

预览图（preview）：
| 用途 | 目录/文件 | 规格 | 备注 |
|---|---|---|---|
| 模板卡片 A | preview/preview-card.a.v1.jpg | 900x1200 | 模板列表 |
| 模板卡片 B | preview/preview-card.b.v1.jpg | 900x1200 | 模板列表 |
| 模板卡片 C | preview/preview-card.c.v1.jpg | 900x1200 | 模板列表 |
| 封面预览 A | preview/preview-cover.a.v1.jpg | 1080x1920 | 模板详情/投放 |
| 封面预览 B | preview/preview-cover.b.v1.jpg | 1080x1920 | 模板详情/投放 |
| 封面预览 C | preview/preview-cover.c.v1.jpg | 1080x1920 | 模板详情/投放 |

### 11.8 授权与审查文件（必须随包交付）
| 文件 | 必须 | 说明 |
|---|---|---|
| licenses/music-licenses.v1.pdf | 是 | 每首音乐的授权证明与范围 |
| licenses/font-licenses.v1.pdf | 是 | 字体授权证明（若用到） |
| manifest.json | 是 | 资源清单、校验与映射 |

### 11.9 资源 ID 一一对应校验表（开发自检/验收写死）
规则：
- 任意模板 JSON / album.json 内引用的 decoration，必须能在 manifest.json 中用 (id, variant) 找到
- 默认 variant：a（若模板/播放器不填 variant，必须按 a 处理）

运行时必须存在的资源（MVP，缺一即视为“资源包不合格”）：
| 来源 | 引用点 | 资源 ID | 默认 variant | 必须有文件 |
|---|---|---|---|---|
| Layout cover-A | 3.7 cover-A | frame.coupletTop | a | frames/frame-couplet-top.a.v1.svg |
| Layout cover-A | 3.7 cover-A | badge.fuCorner | a 或 b | badges/badge-fu-corner.{a/b}.v1.svg |
| Layout cover-B | 3.7 cover-B | stamp.horseSeal | a/b/c | stamps/stamp-horse-seal.{a/b/c}.v1.svg |
| Layout cover-C | 3.7 cover-C | mask.windowCutout | a/b/c | masks/mask-window-cutout.{a/b/c}.v1.svg |
| 装饰库 | 3.8 | sticker.lantern | a | stickers/sticker-lantern.a.v1.svg |
| 装饰库 | 3.8 | sticker.cloud | a | stickers/sticker-cloud.a.v1.svg |
| 装饰库 | 3.8 / 9.5 | sticker.fireworkCorner | a | stickers/sticker-firework-corner.a.v1.svg |
| 装饰库 | 3.8 | sticker.horseTrail | a | stickers/sticker-horse-trail.a.v1.svg |
| 纹理层 | 11.7 textures | texture.xuanPaper | a | textures/texture-xuan-paper.a.v1.webp |
| 纹理层 | 11.7 textures | texture.frostNoise | a | textures/texture-frost-noise.a.v1.webp |
| 动效 | 11.7 motion | T1/T2/T3 | a | motion/motion-presets.v1.json |
| 音乐 | 11.7 music | M1~M5 | a | music/music-*.a.v1.mp3 |
| 预览图 | 11.7 preview | preview-card/cover | a/b/c | preview/preview-*.{a/b/c}.v1.jpg |

---

## 12. 交付清单（研发最终交付）

- 小程序端：可创建/导入/预览/发布/分享
- CloudBase：云函数、云存储结构、数据库索引、环境变量配置
- H5 播放器：可打开 shareUrl 播放（动效/音乐/预加载/降级）
- 主题资源包：马年新年 tokens、贴纸、纹理、封面 A/B/C、动效 T1/T2/T3、音乐 M1~M5
- 埋点：发布/分享/打开/完播核心漏斗可用
