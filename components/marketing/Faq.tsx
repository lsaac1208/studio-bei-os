import { listFaqs } from "@/lib/queries/faq";

/**
 * 数据来源：DB 表 `faqs`（已发布）。后台 `/admin/faqs` 编辑。
 * DB 为空时 fallback 到下面的默认示例，避免首页出现空板块。
 */
const FALLBACK_ITEMS = [
  {
    id: "f-1",
    question: "可以做真实后端吗？",
    answer:
      "可以。这个作品集是前端静态演示，真实项目可以接 Node、Go、Python、数据库、对象存储和后台权限。",
  },
  {
    id: "f-2",
    question: "可以做微信小程序吗？",
    answer: "可以。通常会先用 H5 或原型确认流程，再根据客户场景改造成小程序或公众号页面。",
  },
  {
    id: "f-3",
    question: "是否包含部署上线？",
    answer: "标准版和定制版通常包含部署协助，包括域名解析、服务器或平台部署、基础上线检查。",
  },
  {
    id: "f-4",
    question: "会交付源码吗？",
    answer: "项目制默认可以交付源码和基础说明文档，具体范围会在报价单里写清楚。",
  },
  {
    id: "f-5",
    question: "后续维护怎么算？",
    answer: "可以按月维护，也可以按迭代任务报价。上线初期建议保留 2 到 4 周用于小调整。",
  },
  {
    id: "f-6",
    question: "沟通前需要准备什么？",
    answer: "准备当前流程、遇到的问题、希望上线时间、预算范围、参考页面或已有表格即可。",
  },
];

export async function Faq() {
  let fromDb: Array<{ id: string; question: string; answer: string }> = [];
  try {
    const rows = await listFaqs();
    fromDb = rows.map((f) => ({ id: f.id, question: f.question, answer: f.answer }));
  } catch (err) {
    // build 时无 DB 或 DB 瞬时不可用 — 走 fallback，不阻塞页面
    console.warn("[Faq] listFaqs failed, using fallback", err);
  }
  const items = fromDb.length > 0 ? fromDb : FALLBACK_ITEMS;

  return (
    <section
      id="faq"
      className="border-hairline border-t bg-paper px-5 py-20 sm:px-8 lg:px-14 lg:py-32"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-12 max-w-3xl">
          <span className="font-mono text-[11px] text-mute uppercase tracking-[0.14em]">
            FAQ / 07
          </span>
          <h2 className="mt-4 mb-4 font-extrabold text-[clamp(32px,5vw,56px)] leading-[1.05] tracking-[-0.035em]">
            成交前，客户最常问的几个问题。
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-[28px] border border-hairline bg-white/40 p-6"
            >
              <h3 className="mb-3 font-bold text-[18px] tracking-tight">{item.question}</h3>
              <p className="whitespace-pre-wrap text-[14px] text-mute leading-relaxed">
                {item.answer}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
