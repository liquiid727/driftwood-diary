## 微信小程序：马年新春相册（CloudBase + Doubao）

### 目录结构
- cloudfunctions/：云函数（每个函数一个同名目录）
- miniprogram/：小程序端代码
- assets/：静态资源占位
- config/：配置样例与研发侧约定

### 实施进度
- 对照技术文档的完成情况见：`doc/progress.md`

### 云函数：本地调试 → 云端部署
1) 本地调试（单测）
```bash
npm i
npm run test:cloudfunctions
```

2) 小程序侧 lint（0 warning）
```bash
npm run lint
```

2) 云端部署（预发布环境）
```bash
npx tcb login
npx tcb functions:deploy --dir cloudfunctions --envId <你的CloudBase环境ID>
```

### 质量门禁（必须）
#### 云函数压测（100 并发，P99 ≤ 600ms，错误率 ≤ 0.1%）
```bash
set TCB_ENV_ID=<你的CloudBase环境ID>
set TCB_SECRET_ID=<你的SecretId>
set TCB_SECRET_KEY=<你的SecretKey>
node tools/loadtest/cloudfunction_p99.js --name getAlbumInfo --concurrency 100 --requests 1000 --data "{\"albumId\":\"mock_album_001\"}"
```

#### 端到端用例（miniprogram-test/e2e，CI 全绿才可合并）
```bash
set WECHAT_IDE_CLI_PATH=<微信开发者工具cli路径>
set MINIPROGRAM_PROJECT_PATH=d:\code\record
npm run test:e2e
```

### 研发自测 → 产品验收 → 运营走查 Checklist
#### 研发自测
- 云函数单测通过，覆盖率 ≥ 90%（输出 coverage 报告）
- 小程序端 lint 通过，0 warning
- 真机自测截图：放到 deliverables/screenshots/dev/（首页/编辑/预览/结果/分享卡片）
- 云监控日志截图：放到 deliverables/screenshots/dev/（包含 requestId 串联）

#### 产品验收
- MVP 链路走通：首页 → 编辑 → 预览（WebView/H5）→ 结果 → 分享
- 降级策略验证：断网或超时自动回退到本地 mock-album.json
- 真机验收截图：放到 deliverables/screenshots/pm/
- 云监控日志截图：放到 deliverables/screenshots/pm/

#### 运营走查
- 12 渠道复用：album.json 中 shareImg 字段可被复用
- 运营话术矩阵核对：deliverables/运营话术矩阵.md
- 走查截图：放到 deliverables/screenshots/ops/
- 云监控日志截图：放到 deliverables/screenshots/ops/
