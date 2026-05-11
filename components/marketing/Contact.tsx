import Link from "next/link";

const grid = [
  { label: "建议发送", value: "当前流程 + 最大痛点" },
  { label: "预算区间", value: "¥3,000 — ¥30,000" },
  { label: "常见周期", value: "2 周 — 6 周" },
  { label: "沟通方式", value: "飞书 / 微信 / 远程会议" },
];

/**
 * M2 占位：纯静态展示 + 链接到 /contact 表单页。
 * M4 时这一区会替换成嵌入式表单或保留作为 hero CTA，
 * /contact 提交页会承载完整 React Hook Form + Zod 流程。
 */
export function Contact() {
  return (
    <section
      id="contact"
      className="border-hairline border-t bg-paper px-5 py-20 sm:px-8 lg:px-14 lg:py-32"
    >
      <div className="mx-auto max-w-[1280px]">
        <span className="font-mono text-[11px] text-mute uppercase tracking-[0.14em]">
          Contact / 08
        </span>
        <h2 className="mt-4 mb-6 font-extrabold text-[clamp(40px,6vw,80px)] leading-[1] tracking-[-0.04em]">
          把你现在的
          <br />
          <em className="font-serif font-semibold text-studio-1 italic">业务流程和卡点</em>
          <br />
          告诉我。
        </h2>
        <p className="mb-10 max-w-[640px] text-[16px] text-ink-soft leading-relaxed">
          你不需要一开始就写完整需求。只要告诉我：现在怎么接单、哪里最浪费人工、希望什么时候上线、预算大概在哪个区间，我会帮你判断先做哪一版最合适。
        </p>

        <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {grid.map((g) => (
            <div
              key={g.label}
              className="rounded-2xl border border-hairline bg-white/40 px-4 py-3.5"
            >
              <small className="block font-mono text-[10px] text-mute uppercase tracking-[0.14em]">
                {g.label}
              </small>
              <strong className="mt-1.5 block text-[15px] tracking-tight">{g.value}</strong>
            </div>
          ))}
        </div>

        <Link
          href="/contact"
          className="inline-flex items-center gap-3 rounded-full bg-ink px-6 py-3.5 font-semibold text-[15px] text-paper transition-all hover:-translate-y-px hover:bg-studio-1"
        >
          <span>填写需求表单</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
