# 飞书机器人接入

> 本项目支持「新线索 → 飞书群卡片」推送 + 「卡片按钮 → 写库」回调。
> 共两种推送通道，按需选其一即可工作。

## 选项 A：群自定义机器人 webhook（最简单，无需创建应用）

**优点**：3 分钟搞定。
**缺点**：拿不到 message_id，所以卡片**发出后无法刷新**（点按钮不会回到飞书改卡，只在后台改库）。

1. 飞书群 → 设置 → 群机器人 → **添加机器人** → 选「自定义机器人」
2. 复制 webhook URL（形如 `https://open.feishu.cn/open-apis/bot/v2/hook/xxxxx`）
3. 进 `/admin`（M9 后会有专用「设置」页；当前用 SQL 直接写 `settings` 表）：
   ```sql
   INSERT INTO settings (key, value) VALUES
     ('notify.feishuBotWebhook', '<上面那个 URL>')
   ON CONFLICT (key) DO UPDATE SET value = excluded.value;
   ```

✅ 此后每次新线索都会推一张卡片到该群。按钮**只能跳"打开后台"链接**，「标记已联系」「设高优先级」按钮在该通道下飞书不会回调（限制）。

---

## 选项 B：企业自建应用（推荐，按钮可回调写库）

### 1. 创建应用

1. 访问 [飞书开放平台](https://open.feishu.cn/app)，**创建企业自建应用**
2. 记下 `App ID` 和 `App Secret`
3. 「事件订阅」→ 设置请求网址：
   ```
   https://100yse.com/api/feishu/callback
   ```
4. 复制 **Verification Token**；如启用 Encrypt Key 也复制（**当前代码未实装解密**，建议先关闭加密）
5. 「权限管理」→ 申请：
   - `im:message:send_as_bot`（发消息）
   - `im:message`（修改消息）
6. 「事件订阅」→ 添加事件：
   - `im.message.receive_v1`（接收用户消息，可选）
   - `card.action.trigger`（**卡片按钮回调，必选**）
7. 应用版本 → 创建版本 → 提交审核 → 自助通过 → **发布上线**
8. 把应用拉进目标群组（@应用名 → 添加机器人）

### 2. 配置 .env（生产）

```bash
# 应用凭证
FEISHU_APP_ID=cli_a1b2c3...
FEISHU_APP_SECRET=secretSecretSecret...

# 事件订阅校验
FEISHU_VERIFICATION_TOKEN=tokenTokenToken...

# 加密 key（如果你在飞书后台启用了 Encrypt Key，否则留空）
# 注：当前代码未解密 payload.encrypt，建议先不启用
# FEISHU_ENCRYPT_KEY=
```

### 3. 配置 settings 表（推送目标）

二选一：

```sql
-- 推到群（推荐）：先去飞书"我的群组"开发者工具拿到 chat_id
INSERT INTO settings (key, value) VALUES ('notify.feishuChatId', 'oc_xxxxx')
ON CONFLICT (key) DO UPDATE SET value = excluded.value;

-- 或推到私聊：拿目标接收人的 open_id
INSERT INTO settings (key, value) VALUES ('notify.feishuReceiverOpenId', 'ou_xxxxx')
ON CONFLICT (key) DO UPDATE SET value = excluded.value;
```

> 📌 拿 chat_id：在群里发 `/get_chat_id` 给应用机器人即可；或调 `https://open.feishu.cn/api-explorer/`「会话信息」接口。

### 4. 验证

1. 在飞书后台「事件订阅」点击「**测试**」→ 应该收到 ✓
2. 在线下提交一次需求表单 → 群里应该收到卡片
3. 点卡片「标记已联系」→ 卡片刷新 + `/admin/leads/[id]` 时间线出现一条 `STATUS_CHANGE`，actor=`feishu_card`

---

## 常见问题

| 现象 | 排查 |
| --- | --- |
| 表单提交成功但没卡片 | 看 `docker compose logs app -f`，搜 `[leadCreated] feishu notify failed` |
| 飞书事件订阅 URL 校验失败 | 检查回调路由 `/api/feishu/callback` 是否 200；本机日志看签名错误 |
| 按钮点击没反应 | 自定义机器人 webhook 通道不支持回调；必须走「企业自建应用」 |
| `FEISHU_APP_ID / FEISHU_APP_SECRET not configured` | env 没注入；改完 `.env` 要 `docker compose up -d --force-recreate app` |

## 涉及文件

| 路径 | 作用 |
| --- | --- |
| `lib/feishu/client.ts` | 飞书 SDK 客户端（懒加载） |
| `lib/feishu/cards.ts` | 卡片模板 `renderNewLeadCard` |
| `lib/feishu/bot.ts` | `notifyNewLead` / `refreshLeadCard` |
| `lib/feishu/verify.ts` | 回调签名校验 |
| `lib/feishu/handle-action.ts` | 按钮分发器（contacted / prioritize） |
| `app/api/feishu/callback/route.ts` | 回调入口（URL verify + 按钮回调） |
| `lib/leads.ts::dispatchLeadCreated` | 新线索后异步触发推送，回写 message_id |
