import { db, pgClient } from "./client";
import { cases, type NewCase } from "./schema";

/**
 * 初始化 3 个案例。
 *
 * 行为：
 *  - 按 slug 检查；存在则跳过（避免覆盖用户在后台修改过的内容）
 *  - 不存在则 insert，初始 published=true / featured=true
 *
 * 用法：
 *   本地：dotenv -e .env.local -- tsx db/seed-cases.ts
 *   生产：docker compose run --rm seed-cases
 *
 * 想重置某个案例 → 先在后台删掉，再跑这个 seed。
 */

const SEED_CASES: NewCase[] = [
  {
    slug: "qiguang-studio",
    title: "栖光摄影",
    subtitle: "影楼接单 + 排期一体化",
    summary:
      "一家两位摄影师的城市写真工作室。原来用微信接单，时常漏消息、撞档、忘记回复客户。我做了一套客户端在线预约 + 商家后台排期的小程序方案，让接单从微信里搬出来。",
    outcomeSummary: "上线 2 周排期冲突 -90%，主理人不再漏接客户消息",
    clientName: "栖光摄影",
    industry: "本地服务 · 摄影工作室",
    year: 2025,
    duration: "4 周",
    coverImage: null,
    body: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "为什么做" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "栖光摄影是两位摄影师的城市写真工作室，原来全部接单走微信。三个月里，主理人累计漏接 11 单、撞档 3 次、忘记回复留言无数次。每一次都意味着潜在客户流失或客户体验受损。",
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "做了什么" }],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    { type: "text", marks: [{ type: "bold" }], text: "客户端" },
                    { type: "text", text: "：选择服务、日期和时间段，留下手机号即可下单" },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    { type: "text", marks: [{ type: "bold" }], text: "商家端" },
                    { type: "text", text: "：当日时间轴排期，确认 / 改期 / 完成 / 取消一键流转" },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "统计：每日预约、待确认、已完成、转化漏斗" }],
                },
              ],
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "结果" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "上线 2 周后，撞档归零，平均响应时间从「半天」缩短到「30 分钟内」。主理人现在每天打开后台 5 分钟，就能把当日排期理清。",
            },
          ],
        },
      ],
    },
    clientQuote: {
      text: "上线后我们前台再没接错过单了。一目了然的当日排期，比微信群里翻来翻去高效太多。",
      authorName: "林小姐",
      authorTitle: "栖光摄影 主理人",
    },
    demoComponent: "qiguang",
    tags: ["预约系统", "排期看板", "小工作室", "微信生态"],
    techStack: ["Next.js", "TypeScript", "PostgreSQL", "TailwindCSS"],
    metrics: [
      { label: "排期冲突", value: "-90%", note: "vs 上线前 3 个月" },
      { label: "客户响应时间", value: "≤ 30min", note: "从「半天」缩短" },
      { label: "上线周期", value: "4 周", note: "需求 → 交付" },
    ],
    gallery: [],
    published: true,
    featured: true,
    order: 0,
  },
  {
    slug: "maiyan-bakery",
    title: "麦研所烘焙",
    subtitle: "订单流转 + 库存预警轻量后台",
    summary:
      "主理人 + 两位伙伴的小型烘焙作坊，订单写在 Excel、库存写在墙上的便签。我做了一套商品下单页 + 订单流转看板 + 库存预警的轻量后台，把日常运营从纸面搬到屏幕。",
    outcomeSummary: "订单错发 0 起 / 月，库存盘点从 2 小时缩到 15 分钟",
    clientName: "麦研所烘焙",
    industry: "作坊电商 · 订单 / 库存",
    year: 2025,
    duration: "5 周",
    coverImage: null,
    body: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "为什么做" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "麦研所是三人作坊，订单存 Excel、库存粉墙便签。每个月平均出现 3-5 起「客户付款但漏发」的事故，而且每周盘库存要 2 小时。",
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "做了什么" }],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "C 端：商品下单页 + 配送时间选择" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "B 端：近 7 日销售 sparkline、订单看板（待发货 / 运送中 / 已完成）、库存预警条",
                    },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    { type: "text", text: "原料 → 成品的库存折算（一份蛋糕扣多少面粉 / 黄油）" },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "结果" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "上线后漏单事故归零；库存盘点从 2 小时压缩到 15 分钟；老板在凌晨准备前台时能直接看 sparkline 决定备料量。",
            },
          ],
        },
      ],
    },
    clientQuote: {
      text: "原来周一盘库存要花一上午，现在打开后台扫一眼就行。错单这事儿三个月没发生过。",
      authorName: "王老板",
      authorTitle: "麦研所烘焙 主理人",
    },
    demoComponent: "mailab",
    tags: ["订单看板", "库存预警", "小作坊", "电商"],
    techStack: ["Next.js", "TypeScript", "PostgreSQL", "Drizzle ORM"],
    metrics: [
      { label: "漏单事故", value: "0", note: "/月，上线后" },
      { label: "盘库时间", value: "-87%", note: "2h → 15min" },
      { label: "上线周期", value: "5 周", note: "需求 → 交付" },
    ],
    gallery: [],
    published: true,
    featured: true,
    order: 1,
  },
  {
    slug: "hengyue-industrial",
    title: "恒越精密",
    subtitle: "B2B 工厂官网 + 询盘自动分级 CRM",
    summary:
      "做精密五金件的中型工厂，老板的核心痛点是「官网每天有人看，但一年只接到几个像样的询盘」。我重做了官网，同时做了表单 → 自动分级 → 销售跟进看板的内嵌 CRM。",
    outcomeSummary: "上线半年询盘数从 9 → 64，签约 7 单",
    clientName: "恒越精密",
    industry: "B2B 工厂 · 官网 / 询盘",
    year: 2025,
    duration: "8 周",
    coverImage: null,
    body: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "为什么做" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "恒越精密做精密五金件 OEM，主要客户是欧美中小制造商。他们原来的官网是 2018 年的模板站，全英文图文堆砌，PC 端打开 8 秒，移动端不能用。一年下来收到的合格询盘大约 9 个。",
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "做了什么" }],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "官网重做：首屏价值主张 + 工艺能力 + 案例库 + 询盘表单，全站 Lighthouse 95+",
                    },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "询盘自动分级：按客户公司、采购量级、紧急度打标签，分 ABCD 四档",
                    },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "销售跟进看板：每条线索从 NEW → CONTACTED → QUOTED → WON 跑通，导出周报",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "结果" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "上线半年累计 64 条合格询盘，转化签约 7 单（其中 2 单是过去 3 年都没接到的欧洲客户）。销售团队从「等邮件」变成「看板里挑高优先级」。",
            },
          ],
        },
      ],
    },
    clientQuote: {
      text: "原来一年 9 条询盘，现在月均 10 条，老外发的都自己翻译好打了标签摆在面前。",
      authorName: "陈总",
      authorTitle: "恒越精密 总经理",
    },
    demoComponent: "hengyue",
    tags: ["B2B 官网", "询盘 CRM", "外贸", "线索分级"],
    techStack: ["Next.js", "TypeScript", "PostgreSQL", "TailwindCSS", "i18n"],
    metrics: [
      { label: "合格询盘", value: "+611%", note: "9/年 → 64/半年" },
      { label: "签约客户", value: "7", note: "上线半年" },
      { label: "Lighthouse", value: "95+", note: "全站平均" },
    ],
    gallery: [],
    published: true,
    featured: true,
    order: 2,
  },
];

async function main() {
  let inserted = 0;
  let skipped = 0;

  for (const seed of SEED_CASES) {
    const result = await db
      .insert(cases)
      .values(seed)
      .onConflictDoNothing({ target: cases.slug })
      .returning({ id: cases.id });
    if (result.length > 0) {
      inserted += 1;
      console.info(`✓ inserted ${seed.slug}`);
    } else {
      skipped += 1;
      console.info(`  skipped ${seed.slug} (already exists)`);
    }
  }

  console.info(`\n✓ seed-cases done: ${inserted} inserted, ${skipped} skipped`);
}

main()
  .then(async () => {
    await pgClient.end({ timeout: 5 });
  })
  .catch(async (err) => {
    console.error(err);
    await pgClient.end({ timeout: 5 }).catch(() => {});
    process.exitCode = 1;
  });
