const items = [
  {
    num: "01",
    title: "全栈独立交付",
    desc: "需求、前端、后端、部署和上线串起来",
  },
  {
    num: "02",
    title: "C / B 双端思维",
    desc: "既考虑客户体验，也考虑商家后台效率",
  },
  {
    num: "03",
    title: "先做可用版本",
    desc: "小步上线，再根据真实反馈迭代",
  },
  {
    num: "04",
    title: "面向成交和管理",
    desc: "预约、订单、库存、询盘都围绕业务结果",
  },
];

export function TrustStrip() {
  return (
    <section
      aria-label="服务价值"
      className="mx-auto grid max-w-[1280px] grid-cols-1 gap-px px-5 pb-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:px-14 lg:pb-22"
    >
      {items.map((item, i) => (
        <div
          key={item.num}
          className={`flex min-h-[164px] flex-col justify-between border border-hairline bg-white/30 p-6 ${
            i === 0 ? "sm:rounded-tl-3xl lg:rounded-l-3xl lg:rounded-tr-none" : ""
          } ${i === 1 ? "sm:rounded-tr-3xl lg:rounded-tr-none" : ""} ${
            i === 2 ? "sm:rounded-bl-3xl lg:rounded-bl-none" : ""
          } ${i === items.length - 1 ? "sm:rounded-br-3xl lg:rounded-r-3xl" : ""}`}
        >
          <span className="font-mono text-[11px] text-mute uppercase tracking-[0.14em]">
            {item.num}
          </span>
          <strong className="mt-auto block text-[clamp(18px,2vw,26px)] tracking-tight">
            {item.title}
          </strong>
          <small className="mt-2.5 block text-mute leading-relaxed">{item.desc}</small>
        </div>
      ))}
    </section>
  );
}
