# 实施进度（对照技术文档）

截至：2026-02-08

对照文档：`doc/tech-dev-spec-mini-cloudbase-doubao.md`、`doc/deliverables-horse-newyear.md`、`doc/about.MD`

状态说明：
- ✅ 已完成：仓库内已有实现 + 可跑通主流程（在本地或 CloudBase 环境）
- 🟡 部分完成：实现了“管道/接口”，但缺少关键资源或依赖外部组件
- ⛔ 未开始/缺失：文档要求存在，但仓库内尚无对应实现

## M1 最小闭环（模板成册 + 发布分享）

- ✅ 小程序信息架构：`miniprogram/pages/home`、`miniprogram/pages/edit`、`miniprogram/pages/preview`、`miniprogram/pages/result`
- ✅ 云函数清单（按文档 7.2）：`cloudfunctions/*` 已对齐目录命名
- ✅ 发布链路（创建 -> 上传 -> 多规格 -> AI -> album.json -> 海报/分享图）：`miniprogram/pages/edit/index.js`
- ✅ 降级回退到本地 mock：`miniprogram/utils/cloud.js`（`fallbackMockAlbum`）+ `miniprogram/config/mock-album.json`
- 🟡 分享落地页：`cloudfunctions/renderSharePage` 已输出 OG meta + iframe；播放器本体依赖 `H5_PLAYER_BASE_URL`（外部）

结论：M1 主链路“能跑通”，但分享页/预览页的 H5 播放器属于外部依赖（仓库内不含播放器实现）。

## M2 AI 文案（Doubao AK/SK 签名 + 结构化输出）

- ✅ AK/SK 签名与请求：`cloudfunctions/_shared/doubaoSign.js` + `cloudfunctions/generateAiText/index.js`
- ✅ 结构校验 + 重试 + 降级默认文案：`cloudfunctions/generateAiText/index.js`
- ✅ 缓存（控成本/延迟）：`cloudfunctions/generateAiText/index.js`（`ai_text_cache`）
- 🟡 内容安全：当前为“禁词 + 格式约束”内置校验；未接入微信/云侧内容安全 API（如需强风控，需补）

结论：AI 能力基本齐；若要满足“红线级”合规，需要补“审核/风控”的外部集成与策略落地。

## M3 播放器体验（动效/音乐/预加载/降级）

- ✅ album.json 已包含音乐字段与 motionPreset：`cloudfunctions/buildAlbumJson/index.js`
- 🟡 音乐资源：小程序侧曲目配置存在但 `fileId` 为空（需要把 mp3 上传云存储并回填）：`miniprogram/config/music.js`
- ⛔ 动效预设：`assets/horse-newyear/v1/motion` 目前仅占位（无 T1/T2/T3 预设文件）
- ⛔ H5 播放器实现：仓库内未包含播放器代码（目前通过 `H5_PLAYER_BASE_URL` 以 iframe/web-view 方式接入）

结论：后端数据与分享页“接口已铺好”，但 M3 体验上限主要卡在“播放器实现 + 主题资源包（动效/音乐）补齐”。

## M4 微调（换图/交换/文本编辑）

- ⛔ 小程序编辑能力：当前仅“选图 + 选音乐 + 发布”；尚无“换图/交换/文本编辑”UI/数据回写链路：`miniprogram/pages/edit/index.js`
- 🟡 数据模型：技术文档已定义行为契约（4.3），但未落到端侧交互与发布入参

结论：M4 基本未做；建议等播放器/资源包稳定后再补，避免返工。

## 云函数对齐情况（按文档 7.2 / 接口表）

- ✅ createPublishJob：`cloudfunctions/createPublishJob`
- ✅ finalizeUpload：`cloudfunctions/finalizeUpload`
- ✅ processAssets：`cloudfunctions/processAssets`
- ✅ generateAiText：`cloudfunctions/generateAiText`
- ✅ buildAlbumJson：`cloudfunctions/buildAlbumJson`
- ✅ generatePoster：`cloudfunctions/generatePoster`
- ✅ genShareImg：`cloudfunctions/genShareImg`
- ✅ getAlbumJson：`cloudfunctions/getAlbumJson`
- ✅ getAlbumInfo：`cloudfunctions/getAlbumInfo`
- ✅ renderSharePage：`cloudfunctions/renderSharePage`
- ✅ reportAnalytics：`cloudfunctions/reportAnalytics`

## 质量门禁（仓库内可验证部分）

- ✅ 云函数单测：`npm run test:cloudfunctions`（本地已通过）
- 🟡 覆盖率口径：当前 jest 报告 `Lines 90.53% / Statements 84.77%`；若门禁要求“全口径 ≥ 90%”，需补测试（主要是 `cloudfunctions/generateAiText/index.js` 分支）
- 🟡 端到端 e2e：`npm run test:e2e` 需要微信开发者工具 CLI（本仓库可跑，但依赖本机配置）
- 🟡 压测：`tools/loadtest/cloudfunction_p99.js` 需要 CloudBase 环境变量（按 README 配置后可跑）

## 建议（可以直接写入排期/验收项）

- 1) 明确 H5 播放器边界：若播放器不在本仓库，建议在 README/技术文档补“播放器 API 契约 + 必须能力清单 + 回归用例”，并在 CloudBase 环境变量里固定 `H5_PLAYER_BASE_URL`。
- 2) 补齐主题资源包最小集：至少补 `motion-presets.v1.json`（T1/T2/T3）与可用的 `music/M1~M3.mp3`；同时把 `miniprogram/config/music.js` 的 `fileId` 回填为云存储 fileID。
- 3) 统一“覆盖率门禁”口径：建议在 README 写死以 `Lines` 为准，或把 `Statements/Branches` 也拉到 ≥ 90%（再决定 CI gate）。
- 4) 内容安全与隐私落地：把“审核点/降级点/日志最小化”落实到云函数（尤其是 AI 文案与发布链路），并在交付清单里加“审查记录/开关策略”。
- 5) M4 微调建议先做“最小可用”两件：换图（单槽位）+ 文本编辑（只改标题/段落，不改结构）；交换/裁切可后置。

